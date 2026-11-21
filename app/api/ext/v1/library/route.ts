import { NextResponse } from "next/server";
import { requireDeviceAuth, NO_STORE } from "@/src/core/auth/ext-auth";
import { listTemplates } from "@/src/domain/library/index";
import { createHash } from "crypto";

const NO_STORE_HEADERS = { ...NO_STORE, ETag: "" } as Record<string, string>;

/** GET /api/ext/v1/library — full catalogue manifest for the extension. */
export async function GET(request: Request) {
  const ctx = await requireDeviceAuth(request);
  if (ctx instanceof Response) return ctx;

  const templates = listTemplates();
  // Manifest strips build fns (not serializable) — the extension renders the
  // form from params and calls /library/resolve for geometry.
  const manifest = templates.map((t) => ({
    id: t.id,
    nameFa: t.nameFa,
    category: t.category,
    description: t.description ?? "",
    schemaVersion: t.schemaVersion,
    defaults: t.defaults,
    materials: t.materials,
  }));
  const body = JSON.stringify({ catalogVersion: manifestVersion(manifest), units: manifest });
  const etag = `"${createHash("sha256").update(body).digest("hex").slice(0, 16)}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ...NO_STORE, ETag: etag } });
  }
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE, ETag: etag },
  });
}

function manifestVersion(manifest: unknown[]): string {
  return `v${createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex")
    .slice(0, 16)}`;
}

export const dynamic = "force-dynamic";
void NO_STORE_HEADERS;
