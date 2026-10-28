import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { canAccessProject, hasModule } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import { isSkpFileName, isSkpSize } from "@/src/core/validation/actions";
import { mutatePlatform, readPlatform } from "@/src/services/store/platform-db";
import type { ComponentItem, WorkflowItem } from "@/src/core/types";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function id(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  if (!hasModule(user, "analysis")) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });

  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "").trim();
  const file = form.get("file");
  if (!(file instanceof File) || !projectId) return NextResponse.json({ error: "پروژه و فایل الزامی است." }, { status: 400, headers: NO_STORE });
  if (!isSkpFileName(file.name) || !isSkpSize(file.size) || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "فقط فایل SKP معتبر تا سقف ۲۵ مگابایت پذیرفته می‌شود." }, { status: 400, headers: NO_STORE });

  const bytes = Buffer.from(new Uint8Array(await file.arrayBuffer()));
  const fileId = id("skp");
  const uploadedAt = now();

  try {
    const state = readPlatform();
    const project = state.projects.find((item) => item.id === projectId);
    if (!project || !canAccessProject(user, project)) return NextResponse.json({ error: "دسترسی به این پروژه مجاز نیست." }, { status: 403, headers: NO_STORE });

    const uploadDirectory = path.join(process.cwd(), "app", "data", "uploads");
    fs.mkdirSync(uploadDirectory, { recursive: true });
    const storagePath = path.join("app", "data", "uploads", `${fileId}.skp`);
    fs.writeFileSync(path.join(process.cwd(), storagePath), bytes);

    const result = mutatePlatform((current) => {
      const target = current.projects.find((item) => item.id === projectId);
      if (!target) throw new Error("دسترسی به این پروژه مجاز نیست.");
      const storedFile = { id: fileId, projectId, companyId: target.companyId, originalName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, storagePath, uploadedBy: user.id, uploadedAt };
      const oldItems = [...current.assemblyItems, ...current.installationItems].filter((item) => item.projectId === projectId);
      const room = current.rooms.find((item) => item.projectId === projectId);
      const titles = [...new Map(oldItems.map((item) => [item.title, item])).values()].map((item) => ({ title: item.title, location: item.location }));
      const sourceTitles = titles.length ? titles : room?.sections?.length ? room.sections.map((section) => ({ title: section.label, location: "بخش اندازه‌گیری" })) : [{ title: `مدل ${target.name}`, location: "مدل پروژه" }];
      const assembler = current.users.find((item) => item.companyId === target.companyId && (item.role === "assembler" || item.role === "production_manager"))?.id ?? user.id;
      const installer = current.users.find((item) => item.companyId === target.companyId && (item.role === "installer" || item.role === "project_manager"))?.id ?? user.id;
      const components: ComponentItem[] = sourceTitles.map((source) => ({ id: id("component"), projectId, companyId: target.companyId, sourceFileId: fileId, title: source.title, location: source.location, assemblyStatus: "pending", installationStatus: "pending", assemblyHistory: [], installationHistory: [] }));
      const makeWorkflow = (component: ComponentItem, kind: "assembly" | "installation", assigneeId: string): WorkflowItem => ({ id: id(kind), projectId, companyId: target.companyId, title: component.title, location: component.location, assigneeId, status: "pending", history: [], componentId: component.id, sourceFileId: fileId });
      return { ...current, skpFiles: [storedFile, ...(current.skpFiles ?? []).filter((item) => item.projectId !== projectId)], componentItems: [...(current.componentItems ?? []).filter((item) => item.projectId !== projectId), ...components], assemblyItems: [...current.assemblyItems.filter((item) => item.projectId !== projectId), ...components.map((component) => makeWorkflow(component, "assembly", assembler))], installationItems: [...current.installationItems.filter((item) => item.projectId !== projectId), ...components.map((component) => makeWorkflow(component, "installation", installer))] };
    });
    return NextResponse.json({ ok: true, file: result.skpFiles.find((item) => item.projectId === projectId), components: result.componentItems.filter((item) => item.projectId === projectId) }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "آپلود فایل انجام نشد." }, { status: 403, headers: NO_STORE });
  }
}

export async function GET(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const fileId = new URL(request.url).searchParams.get("fileId") ?? "";
  if (!fileId) return NextResponse.json({ error: "شناسه فایل معتبر نیست." }, { status: 400, headers: NO_STORE });
  const state = readPlatform();
  const file = state.skpFiles.find((item) => item.id === fileId);
  const project = file && state.projects.find((item) => item.id === file.projectId);
  if (!file || !project || !canAccessProject(user, project)) return NextResponse.json({ error: "دسترسی مجاز نیست." }, { status: 403, headers: NO_STORE });
  if (!hasModule(user, "analysis") && !hasModule(user, "assembly") && !hasModule(user, "installation") && !hasModule(user, "planning")) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  const absolute = path.join(process.cwd(), file.storagePath);
  if (!fs.existsSync(absolute)) return NextResponse.json({ error: "فایل ذخیره‌شده پیدا نشد." }, { status: 404, headers: NO_STORE });
  const bytes = fs.readFileSync(absolute);
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`, "Cache-Control": "no-store" } });
}
