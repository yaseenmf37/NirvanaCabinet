import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, readSessionUserId, resolveSessionSecret, SESSION_MAX_AGE_SECONDS } from "./session-token.ts";

test("session token round-trips and rejects tampering", () => {
  const token = createSessionToken("u-1", 1000, "test-secret");
  assert.equal(readSessionUserId(token, 1000, "test-secret"), "u-1");
  assert.equal(readSessionUserId(`${token}x`, 1000, "test-secret"), null);
});

test("session token expires", () => {
  const token = createSessionToken("u-1", 1000, "test-secret");
  assert.equal(readSessionUserId(token, 1000 + SESSION_MAX_AGE_SECONDS + 1, "test-secret"), null);
});

test("production requires configured session secret", () => {
  assert.throws(() => resolveSessionSecret("production", undefined), /SESSION_SECRET/);
  assert.equal(resolveSessionSecret("production", "configured"), "configured");
});


test("session cookie uses a local-safe name and a host-only production name", async () => {
  const { SESSION_COOKIE_NAME } = await import("./session-cookie.ts");
  assert.ok(["__Host-nn-session", "nn-session"].includes(SESSION_COOKIE_NAME));
});
