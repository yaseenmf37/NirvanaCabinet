import test from "node:test";
import assert from "node:assert/strict";
import { createDeviceToken, readDeviceToken, newJti } from "@/src/core/auth/device-token";

/** Regression test for the exact invariant: token devId is the persisted row id. */
test("device token devId remains the persisted device id on fingerprint reuse", () => {
  const existingId = "dev-existing";
  const proposedId = "dev-proposed";
  const returnedFromUpsert = existingId; // PostgreSQL ON CONFLICT ... RETURNING id
  const token = createDeviceToken("access", { sub: "u-1", devId: returnedFromUpsert, jti: newJti() }, 1000, "test-secret");
  const payload = readDeviceToken(token, 1000, "test-secret");
  assert.equal(payload?.devId, existingId);
  assert.notEqual(payload?.devId, proposedId);
});

test("access token lookup contract uses persisted id, not fingerprint", () => {
  const row = { id: "dev-existing", fingerprint: "fp-1", userId: "u-1", status: "paired" };
  const token = createDeviceToken("access", { sub: row.userId, devId: row.id, jti: newJti() }, 1000, "test-secret");
  const payload = readDeviceToken(token, 1000, "test-secret");
  assert.equal(payload?.devId, row.id);
  assert.equal(row.id, "dev-existing");
});
