import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Keine Session – nicht eingeloggt" }, { status: 401 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({
        error: "Session vorhanden, aber kein accessToken",
        session: { user: session.user },
      }, { status: 400 });
    }

    // Test Drive API access
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name%3D'amtliplan-data.json'&fields=files(id,name)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    const body = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        error: "Drive API Fehler",
        status: res.status,
        response: body,
      }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      driveResponse: JSON.parse(body),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
