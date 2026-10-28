import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const platformPath = resolve(root, "app/data/platform.json");
const buildIdPath = resolve(root, ".next/BUILD_ID");
const host = "127.0.0.1";
const sessionSecret = "new-nirvana-authorization-smoke-only-secret";
const sessionCookie = process.env.NODE_ENV === "production" ? "__Host-nn-session" : "nn-session";
const sessionMaxAgeSeconds = 60 * 60 * 12;
const nextBin = resolve(root, "node_modules/next/dist/bin/next");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function encode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sessionToken(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  const payload = `${encode(userId)}.${expiresAt}`;
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not select a local port.")));
        return;
      }
      server.close((error) => (error ? reject(error) : resolvePort(address.port)));
    });
  });
}

async function request(baseUrl, pathname, userId) {
  const headers = userId ? { cookie: `${sessionCookie}=${sessionToken(userId)}` } : undefined;
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  });
  const status = response.status;
  const location = response.headers.get("location");
  let json = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    json = await response.json();
  } else {
    await response.body?.cancel();
  }
  return { status, location, json };
}

function assertStatus(result, expected, label) {
  if (result.status !== expected) throw new Error(`${label}: unexpected status`);
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

async function waitForServer(child, baseUrl) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error("Production server exited before becoming ready.");
    try {
      const result = await request(baseUrl, "/api/health");
      if (result.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(lastError ? "Production server did not become ready." : "Production server did not become ready.");
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolveStop) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolveStop();
    }, 3000);
    child.once("close", () => {
      clearTimeout(timer);
      resolveStop();
    });
  });
}

if (!readFileSync(buildIdPath, "utf8").trim()) {
  throw new Error("No production build found. Run npm run build, then invoke npm run auth:smoke.");
}

const before = readFileSync(platformPath);
const beforeDigest = digest(before);
let child;
let failure;

try {
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}`;
  child = spawn(process.execPath, [nextBin, "start", "--hostname", host, "--port", String(port)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", SESSION_SECRET: sessionSecret },
    stdio: "ignore",
    windowsHide: true,
  });

  await waitForServer(child, baseUrl);

  const unauthenticated = await request(baseUrl, "/api/projects");
  assertStatus(unauthenticated, 401, "unauthenticated API access");

  const unauthenticatedDashboard = await request(baseUrl, "/dashboard");
  assert([307, 308].includes(unauthenticatedDashboard.status), "unauthenticated dashboard is not redirected");
  assert(unauthenticatedDashboard.location?.includes("/auth?next=%2Fdashboard"), "dashboard redirect target is unexpected");

  const saeidProjects = await request(baseUrl, "/api/projects", "u-saeid");
  assertStatus(saeidProjects, 200, "authenticated project access");
  assert(Array.isArray(saeidProjects.json), "authenticated project response is not a list");
  assert(saeidProjects.json.every((project) => project.companyId === "co-nirvana"), "authenticated projects cross the tenant boundary");
  assert(!saeidProjects.json.some((project) => project.id === "proj-4"), "authenticated projects expose another tenant");

  const ariaProjects = await request(baseUrl, "/api/projects", "u-aria");
  assertStatus(ariaProjects, 200, "second-tenant project access");
  assert(ariaProjects.json.length === 1 && ariaProjects.json[0].id === "proj-4", "second-tenant scope is not isolated");

  const crossTenantProject = await request(baseUrl, "/api/projects/proj-1", "u-aria");
  assertStatus(crossTenantProject, 404, "cross-tenant project access");

  const employeesWithoutModule = await request(baseUrl, "/api/employees", "u-leila");
  assertStatus(employeesWithoutModule, 403, "module-gated employees access");

  const planningWithoutModule = await request(baseUrl, "/api/planning/output?projectId=proj-1", "u-leila");
  assertStatus(planningWithoutModule, 403, "module-gated planning access");

  const authenticatedDashboard = await request(baseUrl, "/dashboard", "u-saeid");
  assertStatus(authenticatedDashboard, 200, "authenticated dashboard access");

  console.log("Authorization smoke checks passed.");
} catch (error) {
  failure = error instanceof Error ? error.message : "Authorization smoke failed.";
} finally {
  if (child) await stopServer(child);
  const after = readFileSync(platformPath);
  if (digest(after) !== beforeDigest || !after.equals(before)) {
    failure ??= "app/data/platform.json changed during authorization smoke checks.";
  }
}

if (failure) {
  console.error(`Authorization smoke failed: ${failure}`);
  process.exitCode = 1;
}
