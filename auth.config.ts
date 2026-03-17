import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config used by middleware.
 * Does NOT include CredentialsProvider (uses bcryptjs which is Node.js-only).
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: { signIn: "/" },
  callbacks: {
    authorized({ auth }) {
      // Middleware just checks if a session exists; role-based redirects handled separately
      return !!auth;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          role: "admin" as const,
        };
      }
      // Child credential sessions come through here without account
      return token;
    },
    async session({ session, token }) {
      session.accessToken           = token.accessToken           as string | undefined;
      session.refreshToken          = token.refreshToken          as string | undefined;
      session.expiresAt             = token.expiresAt             as number | undefined;
      session.role                  = token.role                  as "admin" | "child" | undefined;
      session.childId               = token.childId               as string | undefined;
      session.householdRefreshToken = token.householdRefreshToken as string | undefined;
      return session;
    },
  },
};
