import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Returns a 32-byte key derived from AUTH_SECRET.
 * AUTH_SECRET is a base64-encoded random string (from `openssl rand -base64 32`).
 */
function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "";
  // Try base64 first (standard openssl rand -base64 32 output)
  try {
    const decoded = Buffer.from(secret, "base64");
    if (decoded.length >= 32) return decoded.subarray(0, 32);
  } catch {}
  // Fallback: use UTF-8 bytes padded to 32
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32));
}

/**
 * Encrypts a Google refresh token into a shareable household code.
 * Format (base64url): IV(12) + AuthTag(16) + CipherText
 */
export function encryptHouseholdToken(refreshToken: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

/**
 * Decrypts a household code back to the Google refresh token.
 * Returns null if the token is invalid or tampered with.
 */
export function decryptHouseholdToken(token: string): string | null {
  try {
    const key = getKey();
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 29) return null; // min: 12 IV + 16 tag + 1 byte data
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
