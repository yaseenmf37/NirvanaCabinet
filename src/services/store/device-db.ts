export class DeviceStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DeviceStorageError";
  }
}

import { randomBytes, createHash } from "crypto";
import { eq, and, gt, isNull, sql } from "drizzle-orm";
import { getSqlRepository } from "@/src/services/store/sql-repository";
import { devices, pairingIntents } from "@/src/db/schema";

export interface DeviceInput { name: string; fingerprint: string; sketchupVersion: string; os: string; extensionVersion: string }
export interface DbDevice { id: string; companyId: string; userId: string; name: string; fingerprint: string; sketchupVersion: string; os: string; extensionVersion: string; pairedAt: string; lastSeenAt: string; status: string; revokedAt?: string; revokeReason?: string; refreshHash: string; refreshJti: string; rotationCount: number }

function productionDatabaseUrl() {
  const value = process.env.STAGING_DATABASE_URL || process.env.STAGING_POSTGRES_URL;
  if (!value) throw new DeviceStorageError("STAGING_DATABASE_URL or STAGING_POSTGRES_URL is required for device persistence.");
  return value;
}
export function assertDeviceDatabaseConfigured() { productionDatabaseUrl(); }
function db() { productionDatabaseUrl(); return getSqlRepository(); }
function now() { return new Date().toISOString(); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function createPairingCode() { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let output = ""; for (let i = 0; i < 8; i++) output += alphabet[randomBytes(4).readUInt32BE(0) % alphabet.length]; return output; }

export async function createIntentDb(userId: string, companyId: string, ttlSeconds = 600) {
  const code = createPairingCode(); const createdAt = new Date(); const expiresAt = new Date(createdAt.getTime() + ttlSeconds * 1000);
  await db().insert(pairingIntents).values({ codeHash: hashToken(code), userId, companyId, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() });
  return { code, expiresAt: expiresAt.toISOString(), expiresInSec: ttlSeconds };
}

export async function consumeIntentDb(code: string, input: DeviceInput) {
  const database = db();
  const hash = hashToken(code.trim().toUpperCase());
  const nowDate = new Date();
  return database.transaction(async (tx) => {
    const intent = await tx.select().from(pairingIntents).where(and(eq(pairingIntents.codeHash, hash), isNull(pairingIntents.consumedAt), gt(pairingIntents.expiresAt, nowDate.toISOString()))).limit(1);
    if (!intent[0]) throw new DeviceStorageError("pairing code invalid, expired, or already consumed");
    const row = intent[0];
    const proposedDeviceId = `dev-${randomBytes(8).toString("hex")}`;
    const pairedAt = now();
    const consumed = await tx.update(pairingIntents).set({ consumedAt: pairedAt, deviceId: proposedDeviceId }).where(and(eq(pairingIntents.codeHash, hash), isNull(pairingIntents.consumedAt), gt(pairingIntents.expiresAt, nowDate.toISOString()))).returning({ codeHash: pairingIntents.codeHash });
    if (consumed.length !== 1) throw new DeviceStorageError("pairing code was consumed concurrently");

    const refreshJti = randomBytes(12).toString("hex");
    // On fingerprint conflict, PostgreSQL returns the existing row's id. The
    // token must use that returned id, never the proposed id that lost the
    // conflict.
    const stored = await tx.insert(devices).values({ id: proposedDeviceId, companyId: row.companyId, userId: row.userId, ...input, pairedAt, lastSeenAt: pairedAt, status: "paired", refreshHash: "", refreshJti, rotationCount: 0 }).onConflictDoUpdate({ target: devices.fingerprint, set: { companyId: row.companyId, userId: row.userId, name: input.name, sketchupVersion: input.sketchupVersion, os: input.os, extensionVersion: input.extensionVersion, pairedAt, lastSeenAt: pairedAt, status: "paired", revokedAt: null, revokeReason: null, refreshHash: "", refreshJti, rotationCount: 0 } }).returning({ id: devices.id });
    const actualDeviceId = stored[0]?.id;
    if (!actualDeviceId) throw new DeviceStorageError("device upsert did not return an id");
    await tx.update(pairingIntents).set({ deviceId: actualDeviceId }).where(eq(pairingIntents.codeHash, hash));
    return { deviceId: actualDeviceId, userId: row.userId, companyId: row.companyId };
  });
}

export async function findDeviceDb(deviceId: string) { return (await db().select().from(devices).where(eq(devices.id, deviceId)).limit(1))[0]; }
export async function listDevicesDb(userId: string) { return db().select().from(devices).where(eq(devices.userId, userId)); }
export async function setRefreshTokenDb(deviceId: string, token: string, jti: string) { await db().update(devices).set({ refreshHash: hashToken(token), refreshJti: jti, rotationCount: sql`rotation_count + 1` }).where(eq(devices.id, deviceId)); }
export async function touchDeviceDb(deviceId: string) { await db().update(devices).set({ lastSeenAt: now() }).where(eq(devices.id, deviceId)); }
export async function revokeDeviceDb(deviceId: string, reason: string) { await db().update(devices).set({ status: "revoked", revokedAt: now(), revokeReason: reason }).where(eq(devices.id, deviceId)); }
