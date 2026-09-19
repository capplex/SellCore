import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";
import { serverEnv } from "@/lib/env";

function key() {
  const raw = serverEnv().ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is required for encrypted inventory and webhook secrets.");
  const buf = Buffer.from(raw, raw.length === 64 ? "hex" : "base64");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return buf;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((x) => x.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((x) => Buffer.from(x, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted payload");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function signHmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function randomToken(prefix = "") {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}
