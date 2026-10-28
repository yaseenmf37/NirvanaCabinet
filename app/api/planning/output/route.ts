import { NextResponse } from "next/server";
import { canAccessProject, hasModule } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import { structuredRoomOutput } from "@/src/lib/planning-geometry";
import type { RoomModel } from "@/src/core/types";
import { readPlatform } from "@/src/services/store/platform-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!hasModule(user, "planning")) return NextResponse.json({ error: "ماژول برنامه‌ریزی برای این حساب فعال نیست." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "شناسه پروژه الزامی است." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const state = readPlatform();
  const project = state.projects.find((item) => item.id === projectId);
  if (!project || !canAccessProject(user, project)) return NextResponse.json({ error: "دسترسی به این پروژه مجاز نیست." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const room = state.rooms.find((item) => item.projectId === projectId);
  if (!room) return NextResponse.json({ error: "برای این پروژه مدل اتاقی ثبت نشده است." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(structuredRoomOutput(room as RoomModel), { headers: { "Cache-Control": "no-store" } });
}
