import { NextResponse } from "next/server";
import { clearSession, writeSession } from "@/src/core/auth/session";
import { hashPassword, verifyPassword } from "@/src/core/auth/password";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/src/core/auth/rate-limit";
import { findUserByPhone, mutatePlatform, publicUser } from "@/src/services/store/platform-db";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست معتبر نیست." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "بدنه درخواست معتبر نیست." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const candidate = body as { phone?: unknown; password?: unknown };
  const password = typeof candidate.password === "string" ? candidate.password : "";
  const phone = typeof candidate.phone === "string" ? candidate.phone.trim() : "";
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const accountKey = phone.replace(/\D/g, "");
  const clientKey = `${clientIp}:${accountKey}`;
  const accountLimit = checkLoginRateLimit(`account:${accountKey}`);
  const clientLimit = checkLoginRateLimit(`client:${clientKey}`);
  const limit = !accountLimit.allowed ? accountLimit : clientLimit;
  if (!limit.allowed) {
    return NextResponse.json({ error: "تعداد تلاش‌ها زیاد است. بعداً دوباره تلاش کنید." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  }
  const user = findUserByPhone(phone);

  if (!user || !password || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "اطلاعات ورود نادرست است." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  resetLoginRateLimit(`account:${accountKey}`);
  resetLoginRateLimit(`client:${clientKey}`);

  if (!user.password.startsWith("scrypt$")) {
    mutatePlatform((state) => ({ ...state, users: state.users.map((item) => (item.id === user.id ? { ...item, password: hashPassword(password) } : item)) }));
  }

  await writeSession(user.id);
  return NextResponse.json({ user: publicUser(user) }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
