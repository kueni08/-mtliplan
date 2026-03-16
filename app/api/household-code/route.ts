import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { encryptHouseholdToken } from "@/lib/householdToken";

/**
 * GET /api/household-code
 * Returns an encrypted household code that children can use to log in.
 * The code contains the admin's Google refresh token (encrypted with AUTH_SECRET).
 * Only accessible to admin (Google-authenticated) sessions.
 */
export async function GET() {
  const session = await auth();

  if (!session?.refreshToken || session.role === "child") {
    return NextResponse.json(
      { error: "Nur für Admin zugänglich" },
      { status: 401 }
    );
  }

  const householdCode = encryptHouseholdToken(session.refreshToken);
  return NextResponse.json({ householdCode });
}
