import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { readAppDataWithToken, driveFileExists } from "@/lib/driveUtils";

/** Exchange a Google refresh token for a short-lived access token. */
async function exchangeRefreshToken(refreshToken: string): Promise<string> {
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
  if (!res.ok) throw new Error("Token-Austausch fehlgeschlagen");
  const { access_token } = await res.json();
  return access_token as string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { maxAge: 24 * 60 * 60 }, // 24 hours
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, user }) {
      // ── First login via Google OAuth ─────────────────────────────────────
      if (account?.provider === "google") {
        const email = user.email ?? "";

        // 1. Check if this Google account owns the Drive file → admin
        if (account.access_token) {
          const isAdmin = await driveFileExists(account.access_token);
          if (isAdmin) {
            return {
              ...token,
              accessToken:  account.access_token,
              refreshToken: account.refresh_token,
              expiresAt:    account.expires_at,
              role:         "admin" as const,
            };
          }
        }

        // 2. Check if email is registered as a household member
        const hhRefreshToken = process.env.HOUSEHOLD_REFRESH_TOKEN;
        if (hhRefreshToken && email) {
          try {
            const hhAccessToken = await exchangeRefreshToken(hhRefreshToken);
            const appData = await readAppDataWithToken(hhAccessToken);
            const member = appData.settings.children.find(
              (m) => m.email?.toLowerCase() === email.toLowerCase()
            );
            if (member) {
              return {
                ...token,
                accessToken:          account.access_token,
                expiresAt:            account.expires_at,
                role:                 (member.role ?? "child") as "child" | "adult",
                memberId:             member.id,
                householdRefreshToken: hhRefreshToken,
              };
            }
          } catch {
            // Drive lookup failed – fall through to pending
          }
        }

        // 3. No HOUSEHOLD_REFRESH_TOKEN set → fresh deployment, first user = admin
        if (!hhRefreshToken) {
          return {
            ...token,
            accessToken:  account.access_token,
            refreshToken: account.refresh_token,
            expiresAt:    account.expires_at,
            role:         "admin" as const,
          };
        }

        // 4. Email not registered → pending
        return {
          ...token,
          role:  "pending" as const,
          email: email,
        };
      }

      // ── Subsequent token calls (session refreshes) ───────────────────────
      // Non-admin roles need no server-side token refresh
      if (token.role === "child" || token.role === "adult" || token.role === "pending") {
        return token;
      }

      // Admin: return token if still valid (60s buffer)
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Admin: access token expired – refresh via Google
      if (!token.refreshToken) return { ...token, error: "RefreshTokenMissing" };

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id:     process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type:    "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });
        const tokens = await response.json();
        if (!response.ok) throw tokens;
        return {
          ...token,
          accessToken:  tokens.access_token,
          expiresAt:    Math.floor(Date.now() / 1000) + tokens.expires_in,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Token refresh failed:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
  },
});
