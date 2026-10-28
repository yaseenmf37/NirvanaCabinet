import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mutatePlatform, readPlatform } from "@/src/services/store/platform-db";

const questionAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_QUESTIONS = 5;

export async function GET() {
  const state = readPlatform();
  return NextResponse.json({ plans: state.plans, faq: state.faq }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const attempt = questionAttempts.get(key);
  if (attempt && attempt.resetAt > now && attempt.count >= MAX_QUESTIONS) {
    return NextResponse.json({ error: "تعداد درخواست‌ها بیش از حد مجاز است." }, { status: 429, headers: { "Retry-After": String(Math.ceil((attempt.resetAt - now) / 1000)), "Cache-Control": "no-store" } });
  }
  if (!attempt || attempt.resetAt <= now) questionAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else attempt.count += 1;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "بدنه درخواست معتبر نیست." }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  const question = typeof body === "object" && body !== null && "question" in body && typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 3 || question.length > 1000) return NextResponse.json({ error: "سؤال باید بین ۳ تا ۱۰۰۰ نویسه باشد." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  mutatePlatform((state) => ({ ...state, unansweredQuestions: [{ id: `question-${randomUUID()}`, question, at: new Date().toISOString() }, ...state.unansweredQuestions].slice(0, 1000) }));
  return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
