import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Device credentials for the SketchUp extension.
 *
 * Separate from the browser session layer: these tokens are issued to a
 * registered device after a pairing-code exchange, are scoped, and can be
 * revoked server-side. They are signed with the same technique as the session
 * token (HMAC-SHA256, base64url) but use a distinct secret and payload shape,
 * and carry a unique jti so refresh rotation / revocation can be detected.
 */

export const DEVICE_ACCESS_TTL_SECONDS = 15 * 60; // 15 min
export const DEVICE_REFRESH_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
export const DEVICE_MAX_REFRESH_ROTATIONS = 30;

export function resolveDeviceSecret(nodeEnv = process.env.NODE_ENV, configured = process.env.DEVICE_TOKEN_SECRET) {
  if (configured) return configured;
  if (nodeEnv === "production") throw new Error("DEVICE_TOKEN_SECRET is required in production.");
  return "new-nirvana-device-development-secret";
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

export interface DeviceTokenPayload {
  sub: string; // user id
  devId: string; // device id
  jti: string; // unique token id (rotation/revocation tracking)
  scope: string; // "device"
  kind: "access" | "refresh";
}

/** The caller supplies only the identity; kind/scope/iat/exp are derived. */
export type DeviceTokenClaims = Pick<DeviceTokenPayload, "sub" | "devId" | "jti">;

export function createDeviceToken(
  kind: DeviceTokenPayload["kind"],
  payload: DeviceTokenClaims,
  nowSeconds = Math.floor(Date.now() / 1000),
  secret = resolveDeviceSecret(),
) {
  const ttl = kind === "access" ? DEVICE_ACCESS_TTL_SECONDS : DEVICE_REFRESH_TTL_SECONDS;
  const body = {
    sub: payload.sub,
    devId: payload.devId,
    jti: payload.jti,
    scope: "device",
    kind,
    iat: nowSeconds,
    exp: nowSeconds + ttl,
  };
  const raw = `${encode(JSON.stringify(body))}`;
  return `${raw}.${sign(raw, secret)}`;
}

export function newJti() {
  return randomBytes(12).toString("hex");
}

/** Returns parsed payload or null when invalid/expired. */
export function readDeviceToken(token: string, nowSeconds = Math.floor(Date.now() / 1000), secret = resolveDeviceSecret()): DeviceTokenPayload & { iat: number; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [raw, providedSignature] = parts;
  const expected = Buffer.from(sign(raw, secret));
  const actual = Buffer.from(providedSignature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(decode(raw));
  } catch {
    return null;
  }
  if (typeof body.sub !== "string" || typeof body.devId !== "string" || typeof body.jti !== "string") return null;
  if (body.scope !== "device") return null;
  if (body.kind !== "access" && body.kind !== "refresh") return null;
  if (!Number.isFinite(Number(body.exp)) || !Number.isFinite(Number(body.iat))) return null;
  if (Number(body.exp) < nowSeconds) return null;
  return {
    sub: body.sub,
    devId: body.devId,
    jti: body.jti,
    scope: "device",
    kind: body.kind as "access" | "refresh",
    iat: Number(body.iat),
    exp: Number(body.exp),
  };
}
