import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { readAppDataWithToken } from "@/lib/driveUtils";
import { decryptHouseholdToken } from "@/lib/householdToken";

/** Exchange a Google refresh token for a short-lived access token. */
async function getAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token-Austausch fehlgeschlagen: ${err}`);
  }
  const { access_token } = await res.json();
  return access_token as string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { maxAge: 24 * 60 * 60 }, // 24 hours
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Kind-Login",
      credentials: {
        username:      { label: "Benutzername",   type: "text" },
        password:      { label: "Passwort",       type: "password" },
        householdCode: { label: "Haushalt-Code",  type: "text" },
      },
      async authorize(credentials) {
        const username      = credentials?.username      as string | undefined;
        const password      = credentials?.password      as string | undefined;
        const householdCode = credentials?.householdCode as string | undefined;

        if (!username || !password) return null;

        // Resolve the household refresh token:
        // 1. From the encrypted household code (multi-tenant, preferred)
        // 2. From the HOUSEHOLD_REFRESH_TOKEN env var (backward compat)
        let householdRefreshToken: string | null = null;

        if (householdCode) {
          householdRefreshToken = decryptHouseholdToken(householdCode);
          if (!householdRefreshToken) {
            throw new Error("Ungültiger Haushalt-Code. Bitte Admin um einen neuen Code bitten.");
          }
        }

        if (!householdRefreshToken) {
          householdRefreshToken = process.env.HOUSEHOLD_REFRESH_TOKEN ?? null;
        }

        if (!householdRefreshToken) {
          throw new Error(
            "Kein Haushalt-Code hinterlegt. Bitte den Admin-Haushalt-Code eingeben."
          );
        }

        // Exchange refresh token for access token
        const accessToken = await getAccessTokenFromRefreshToken(householdRefreshToken);

        // Read household data from Drive
        const appData = await readAppDataWithToken(accessToken);
        if (!appData) throw new Error("Haushaltsdaten konnten nicht geladen werden.");

        // Find child by name (case-insensitive)
        const member = appData.settings.children.find(
          (c) => c.name.toLowerCase() === username.toLowerCase()
        );
        if (!member || !member.passwordHash) return null;

        const valid = await bcrypt.compare(password, member.passwordHash);
        if (!valid) return null;

        return {
          id: member.id,
          name: member.name,
          email: member.email ?? `${member.id}@household.local`,
          role: "child" as const,
          childId: member.id,
          householdRefreshToken,
          // Cache the freshly-obtained access token so Drive calls don't need
          // to re-exchange the refresh token on every server action (valid 1h)
          accessToken,
          accessTokenExpiry: Math.floor(Date.now() / 1000) + 3600,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, user }) {
      // Google OAuth first login → admin session
      if (account?.provider === "google") {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          role: "admin" as const,
        };
      }

      // Credentials login (child) — user is set, account is null
      if (user && !account) {
        return {
          ...token,
          role: "child" as const,
          childId: user.childId ?? user.id,
          householdRefreshToken: user.householdRefreshToken,
          // Cache the access token obtained during login; Drive will reuse it
          // until it expires (~1h), then fall back to exchanging householdRefreshToken
          accessToken: user.accessToken,
          expiresAt: user.accessTokenExpiry,
        };
      }

      // Child session subsequent calls – no token refresh needed
      if (token.role === "child") return token;

      // Admin token still valid (60s buffer)
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Admin token expired – try to refresh
      if (!token.refreshToken) return { ...token, error: "RefreshTokenMissing" };

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });
        const tokens = await response.json();
        if (!response.ok) throw tokens;
        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Token refresh failed:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
  },
});
