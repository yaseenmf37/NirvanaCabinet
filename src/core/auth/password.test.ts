import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("password hashes verify without storing plaintext", () => {
  const password = "correct-password";
  const hash = hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^scrypt\$[^$]+\$[0-9a-f]+$/);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);
});

test("legacy plaintext passwords remain verifiable for migration", () => {
  assert.equal(verifyPassword("legacy-password", "legacy-password"), true);
  assert.equal(verifyPassword("wrong-password", "legacy-password"), false);
});
