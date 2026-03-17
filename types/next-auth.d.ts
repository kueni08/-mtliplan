import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "child";
    childId?: string;
    householdRefreshToken?: string;
    accessToken?: string;
    accessTokenExpiry?: number;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    role?: "admin" | "child";
    childId?: string;
    /** Encrypted household refresh token stored in child sessions for Drive access */
    householdRefreshToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    role?: "admin" | "child";
    childId?: string;
    /** Encrypted household refresh token stored in child sessions for Drive access */
    householdRefreshToken?: string;
  }
}
