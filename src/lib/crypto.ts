import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? "proposalfast";
  return sha256(`${salt}:${ip}`);
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
