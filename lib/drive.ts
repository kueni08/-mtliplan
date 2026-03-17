"use server";

import { auth } from "@/auth";
import type { AppData } from "./types";
import { getDefaultData } from "./defaultData";

const FILENAME = "amtliplan-data.json";

/** Exchange any Google refresh token for a short-lived access token. */
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

async function getAccessToken(): Promise<string> {
  const session = await auth();

  // Admin session: use access token if still valid, otherwise refresh proactively
  if (session?.accessToken) {
    const expired =
      session.expiresAt != null &&
      Date.now() > (session.expiresAt * 1000) - 60_000;

    if (!expired) return session.accessToken;

    // Access token expired – use refresh token to get a new one
    if (session.refreshToken) {
      return exchangeRefreshToken(session.refreshToken);
    }
    // No refresh token (shouldn't happen for Google OAuth) – fall through
  }

  // Admin with no access token but with refresh token
  if (session?.refreshToken && !session.householdRefreshToken) {
    return exchangeRefreshToken(session.refreshToken);
  }

  // Child session: use the household refresh token stored in the JWT
  if (session?.householdRefreshToken) {
    return exchangeRefreshToken(session.householdRefreshToken);
  }

  // Backward compat: env var (single-household deployments)
  if (process.env.HOUSEHOLD_REFRESH_TOKEN) {
    return exchangeRefreshToken(process.env.HOUSEHOLD_REFRESH_TOKEN);
  }

  throw new Error("Nicht angemeldet");
}

async function findFileId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${FILENAME}'+and+trashed%3Dfalse&fields=files(id)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.files?.[0]?.id as string) ?? null;
}

/** Migrate older data structures to current schema */
function migrateData(raw: AppData): AppData {
  return {
    ...raw,
    assignments: raw.assignments ?? [],
    settings: {
      ...raw.settings,
      children: (raw.settings.children ?? []).map((c) => ({
        ...c,
        role: c.role ?? "child",
      })),
    },
  };
}

/** Read AppData using a specific access token (used in auth.ts CredentialsProvider) */
export async function readAppDataWithToken(accessToken: string): Promise<AppData> {
  const fileId = await findFileId(accessToken);
  if (!fileId) return getDefaultData();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) return getDefaultData();
  return migrateData((await res.json()) as AppData);
}

export async function readAppData(): Promise<AppData> {
  const token = await getAccessToken();
  const fileId = await findFileId(token);

  if (!fileId) {
    return getDefaultData();
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return getDefaultData();
  }

  const data = await res.json();
  return migrateData(data as AppData);
}

export async function writeAppData(data: AppData): Promise<void> {
  const token = await getAccessToken();
  const fileId = await findFileId(token);
  const body = JSON.stringify(data);

  if (!fileId) {
    const metadata = JSON.stringify({ name: FILENAME });
    const form = new FormData();
    form.append("metadata", new Blob([metadata], { type: "application/json" }));
    form.append("file", new Blob([body], { type: "application/json" }));

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Drive create failed: ${err}`);
    }
  } else {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Drive update failed: ${err}`);
    }
  }
}
