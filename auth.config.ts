import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config used by middleware.
 * No Node.js-only code here.
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
      return !!auth;
    },
    async session({ session, token }) {
      session.accessToken           = token.accessToken           as string | undefined;
      session.refreshToken          = token.refreshToken          as string | undefined;
      session.expiresAt             = token.expiresAt             as number | undefined;
      session.role                  = token.role                  as "admin" | "child" | "adult" | "pending" | undefined;
      session.memberId              = token.memberId              as string | undefined;
      session.householdRefreshToken = token.householdRefreshToken as string | undefined;
      return session;
    },
  },
};
