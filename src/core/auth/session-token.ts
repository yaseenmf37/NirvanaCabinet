import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function resolveSessionSecret(nodeEnv = process.env.NODE_ENV, configured = process.env.SESSION_SECRET) {
  if (configured) return configured;
  if (nodeEnv === "production") throw new Error("SESSION_SECRET is required in production.");
  return "new-nirvana-development-session-secret";
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, nowSeconds = Math.floor(Date.now() / 1000), secret = resolveSessionSecret()) {
  const payload = `${encode(userId)}.${nowSeconds + SESSION_MAX_AGE_SECONDS}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionUserId(token: string, nowSeconds = Math.floor(Date.now() / 1000), secret = resolveSessionSecret()) {
  const [encodedUserId, expiresAt, providedSignature] = token.split(".");
  const expiry = Number(expiresAt);
  if (!encodedUserId || !Number.isFinite(expiry) || !providedSignature || expiry < nowSeconds) return null;
  const expected = Buffer.from(sign(`${encodedUserId}.${expiresAt}`, secret));
  const actual = Buffer.from(providedSignature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return decode(encodedUserId);
}
