import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  // Only admin (Google-authenticated) sessions can access this
  if (!session?.refreshToken || session.role === "child") {
    return NextResponse.json({ error: "Nur für Admin zugänglich" }, { status: 401 });
  }

  return NextResponse.json({ refreshToken: session.refreshToken });
}
