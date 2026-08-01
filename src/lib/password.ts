import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const passwordPrefix = "scrypt";
const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `${passwordPrefix}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, salt, hash] = storedHash.split("$");

  if (prefix !== passwordPrefix || salt == null || hash == null) {
    return false;
  }

  const stored = Buffer.from(hash, "hex");
  const computed = scryptSync(password, salt, stored.length);

  return stored.length === computed.length && timingSafeEqual(stored, computed);
}
