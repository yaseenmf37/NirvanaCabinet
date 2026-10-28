"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setIsSubmitting(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phone.trim(), password }) });
      const data = (await response.json()) as { user?: { name: string; phone: string; role: string }; error?: string };
      if (!response.ok || !data.user) { setError(data.error ?? "اطلاعات ورود نامعتبر است."); return; }
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"); router.refresh();
    } catch { setError("خطا در اتصال به سرور احراز هویت. لطفاً دوباره تلاش کنید."); } finally { setIsSubmitting(false); }
  };
  return <main className="auth-shell"><div className="auth-layout"><aside className="auth-brand-panel"><div className="auth-brand"><span className="auth-brand__mark">N</span><span><strong>New Nirvana</strong><small>Cabinet OS</small></span></div><div className="auth-brand-copy"><span className="auth-kicker"><ShieldCheck className="h-4 w-4" /> فضای عملیاتی امن</span><h1>از اندازه‌گیری تا تحویل، یک مسیر روشن.</h1><p>پروژه‌ها، تیم اجرا و وضعیت عملیات کابینت‌سازی را از یک پنل کنترل کنید.</p></div><div className="auth-brand-note"><span className="h-2 w-2 rounded-full bg-emerald-400" /> سامانه آماده به‌کار است</div></aside><section className="auth-form-panel"><div className="auth-card"><span className="auth-kicker">ورود به سامانه</span><h2>ورود به پنل عملیاتی</h2><p className="auth-subtitle">برای ادامه، شماره تماس و رمز عبور خود را وارد کنید.</p><form className="auth-form" onSubmit={handleSubmit}><label className="auth-field"><span>شماره تماس</span><span className="auth-input-wrap"><Phone className="h-4 w-4" /><input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09120000001" /></span></label><label className="auth-field"><span>رمز عبور</span><span className="auth-input-wrap"><LockKeyhole className="h-4 w-4" /><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="رمز عبور" /></span></label>{error ? <div className="feedback feedback--error" role="alert">{error}</div> : null}<Button type="submit" size="lg" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? "در حال ورود..." : <>ورود به پنل <ArrowLeft className="h-4 w-4" /></>}</Button></form></div></section></div></main>;
}
