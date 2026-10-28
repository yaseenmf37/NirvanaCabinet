import test from "node:test";
import assert from "node:assert/strict";
import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limit.ts";

test("login rate limit blocks after five attempts and resets", () => {
  const key = `test-${Date.now()}`;
  for (let index = 0; index < 5; index += 1) assert.equal(checkLoginRateLimit(key, 1000).allowed, true);
  const blocked = checkLoginRateLimit(key, 1000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
  resetLoginRateLimit(key);
  assert.equal(checkLoginRateLimit(key, 1000).allowed, true);
});
