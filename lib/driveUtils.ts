import type { AppData } from "./types";
import { getDefaultData } from "./defaultData";

const FILENAME = "amtliplan-data.json";

/** Migrate older data structures to current schema */
export function migrateData(raw: AppData): AppData {
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

async function findFileId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${FILENAME}'+and+trashed%3Dfalse&fields=files(id)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  // Throw on auth/server errors so callers get a real error instead of empty data
  if (!res.ok) throw new Error(`Drive API Fehler: ${res.status}`);
  const data = await res.json();
  return (data.files?.[0]?.id as string) ?? null;
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
