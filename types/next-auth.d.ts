import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "child" | "adult" | "pending";
    memberId?: string;
    householdRefreshToken?: string;
    accessToken?: string;
    accessTokenExpiry?: number;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    role?: "admin" | "child" | "adult" | "pending";
    /** ID of the HouseholdMember record this user maps to (non-admin) */
    memberId?: string;
    /** Household refresh token stored in non-admin sessions for Drive access */
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
    role?: "admin" | "child" | "adult" | "pending";
    memberId?: string;
    householdRefreshToken?: string;
  }
}
