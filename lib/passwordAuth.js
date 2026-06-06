import crypto from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, originalKeyHex] = storedHash.split(":");
  if (!salt || !originalKeyHex) return false;

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const originalKey = Buffer.from(originalKeyHex, "hex");
  if (derivedKey.length !== originalKey.length) return false;

  return crypto.timingSafeEqual(derivedKey, originalKey);
}
