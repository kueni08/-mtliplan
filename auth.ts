import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { readAppDataWithToken } from "@/lib/drive";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Kind-Login",
      credentials: {
        username: { label: "Benutzername", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        if (!username || !password) return null;

        const rt = process.env.HOUSEHOLD_REFRESH_TOKEN;
        if (!rt) throw new Error("HOUSEHOLD_REFRESH_TOKEN nicht konfiguriert. Bitte Admin kontaktieren.");

        // Get access token from refresh token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: rt,
          }),
        });
        if (!tokenRes.ok) throw new Error("Haushalt-Token ungültig. Bitte Admin kontaktieren.");
        const { access_token } = await tokenRes.json();

        // Read AppData using admin's access token
        const appData = await readAppDataWithToken(access_token);
        if (!appData) throw new Error("Haushaltsdaten konnten nicht geladen werden.");

        // Find member by name (case-insensitive)
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
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, user }) {
      // Google OAuth first login
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
        const u = user as typeof user & { role?: string; childId?: string };
        return {
          ...token,
          role: "child" as const,
          childId: u.childId ?? u.id,
          // No accessToken for child – drive.ts uses HOUSEHOLD_REFRESH_TOKEN
        };
      }

      // Child session – no token refresh needed (uses env var)
      if (token.role === "child") return token;

      // Token still valid (with 60s buffer)
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Token expired – try to refresh
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
