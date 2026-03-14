"use server";

import { auth } from "@/auth";
import type { AppData } from "./types";
import { getDefaultData } from "./defaultData";

const FILENAME = "amtliplan-data.json";

async function getAccessToken(): Promise<string> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Nicht angemeldet");
  }
  return session.accessToken;
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
  return data as AppData;
}

export async function writeAppData(data: AppData): Promise<void> {
  const token = await getAccessToken();
  const fileId = await findFileId(token);
  const body = JSON.stringify(data);

  if (!fileId) {
    // Create new file in Drive root
    const metadata = JSON.stringify({
      name: FILENAME,
    });

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([metadata], { type: "application/json" })
    );
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
    // Update existing file
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
