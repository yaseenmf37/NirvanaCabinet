import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkPlatformReadiness, isPlatformState, writePlatform } from "./platform-db.ts";

const dataPath = "app/data/platform.json";

test("platform readiness validates persistence without changing or exposing data", () => {
  const before = fs.existsSync(dataPath)
    ? (() => {
        const stat = fs.statSync(dataPath);
        return { exists: true, bytes: stat.size, mtimeMs: stat.mtimeMs };
      })()
    : { exists: false, bytes: null, mtimeMs: null };
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let stdoutWrites = 0;
  let stderrWrites = 0;

  process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
    stdoutWrites += 1;
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((...args: Parameters<typeof process.stderr.write>) => {
    stderrWrites += 1;
    return true;
  }) as typeof process.stderr.write;

  let result: unknown;
  try {
    result = checkPlatformReadiness();
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  assert.equal(result, true, "readiness result");
  assert.equal(typeof result, "boolean", "readiness result type");
  assert.equal(stdoutWrites, 0, "stdout output");
  assert.equal(stderrWrites, 0, "stderr output");
  assert.equal(JSON.stringify(result), "true", "readiness result contains only a boolean");

  const after = fs.existsSync(dataPath)
    ? (() => {
        const stat = fs.statSync(dataPath);
        return { exists: true, bytes: stat.size, mtimeMs: stat.mtimeMs };
      })()
    : { exists: false, bytes: null, mtimeMs: null };
  assert.equal(after.exists, before.exists, "data file existence");
  assert.equal(after.bytes, before.bytes, "data file byte length");
  assert.equal(after.mtimeMs, before.mtimeMs, "data file modification time");
});


test("platform readiness rejects malformed collection members", () => {
  const valid = {
    companies: [], users: [], projects: [], rooms: [], assemblyItems: [], installationItems: [],
    missingParts: [], shipments: [], faq: [], plans: [], unansweredQuestions: [],
  };
  assert.equal(isPlatformState(valid), true);
  assert.equal(isPlatformState({ ...valid, users: [null] }), false);
  assert.equal(isPlatformState({ ...valid, projects: [{ id: "project" }] }), false);
  assert.equal(isPlatformState({ ...valid, rooms: [{ id: "room", vertices: [null] }] }), false);
});


test("failed platform writes remove the temporary database file", () => {
  const temporaryPath = `${dataPath}.tmp`;
  const originalRenameSync = fs.renameSync;
  const expectedError = new Error("rename failed");

  fs.rmSync(temporaryPath, { force: true });
  fs.renameSync = (() => {
    throw expectedError;
  }) as typeof fs.renameSync;

  try {
    assert.throws(
      () => writePlatform({} as Parameters<typeof writePlatform>[0]),
      (error) => error === expectedError,
    );
    assert.equal(fs.existsSync(temporaryPath), false, "temporary file cleanup");
  } finally {
    fs.renameSync = originalRenameSync;
    fs.rmSync(temporaryPath, { force: true });
  }
});
