"use client";

import Link from "next/link";
import { ArrowLeft, HelpCircle, MessageSquare, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FaqEntry } from "@/src/core/types";
import "../page.css";

const searchText = (entry: FaqEntry) => `${entry.question} ${entry.answer} ${entry.keywords.join(" ")}`.toLowerCase();

export default function FaqPage() {
  const [faq, setFaq] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => { fetch("/api/public/catalog", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error("دریافت پرسش‌ها انجام نشد."); return response.json() as Promise<{ faq: FaqEntry[] }>; }).then((data) => setFaq(data.faq)).catch(() => setError("اطلاعات پرسش‌های متداول فعلاً در دسترس نیست.")).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => { const query = question.trim().toLowerCase(); return query ? faq.filter((entry) => searchText(entry).includes(query)) : faq; }, [faq, question]);
  const submit = async () => { if (question.trim().length < 3) return; const response = await fetch("/api/public/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) }); if (response.ok) { setSent(true); setQuestion(""); } };
  return <main className="public-shell">
    <nav className="public-nav" aria-label="ناوبری اصلی"><Link href="/" className="public-brand"><span className="public-brand__mark">N</span><span><strong>New Nirvana</strong><small>مدیریت عملیات کابینت</small></span></Link><div className="public-nav__links"><Link href="/#workflow">جریان کار</Link><Link href="/#modules">ماژول‌ها</Link><Link href="/plans">پلن‌ها</Link></div><div className="public-nav__actions"><Link href="/auth" className="public-button public-button--quiet">ورود</Link><Link href="/plans" className="public-button public-button--solid">دیدن پلن‌ها <ArrowLeft size={16} /></Link></div></nav>
    <section className="public-hero public-hero--compact"><div><span className="public-kicker"><span className="public-kicker__dot" />پرسش‌های متداول</span><h1 className="public-hero__copy" style={{marginTop:"0.9rem"}}>سؤالات شما دربارهٔ ماژول‌ها، دسترسی و جریان پروژه.</h1><p>پاسخ‌ها از داده واقعی محصول آمده‌اند؛ اگر سؤال جدید دارید، برای تیم پشتیبانی ثبت کنید.</p></div></section>
    <section className="public-section"><div className="public-section__heading"><span className="public-kicker"><Search size={15} />جست‌وجوی سریع</span><div className="public-search"><input type="text" value={question} onChange={(event) => { setQuestion(event.target.value); setSent(false); }} placeholder="مثلاً ماژول مونتاژ، پلن متخصص یا خروجی SKP..." /><button type="button" className="public-button public-button--solid" onClick={() => void submit()} disabled={question.trim().length < 3}><MessageSquare size={16} /> ثبت سؤال</button></div>{sent ? <p className="public-kicker" style={{marginTop:"0.8rem"}}>سؤال شما ثبت شد و برای بررسی در صف قرار گرفت.</p> : null}</div>{loading ? <p className="public-empty">در حال بارگذاری پرسش‌ها...</p> : error ? <p className="public-empty public-empty--error" role="alert">{error}</p> : filtered.length ? <div className="faq-list">{filtered.map((entry) => <article className="faq-item" key={entry.id}><h3><HelpCircle size={18} />{entry.question}</h3><p>{entry.answer}</p></article>)}</div> : <p className="public-empty">پرسشی مطابق جست‌وجوی شما پیدا نشد.</p>}</section>
    <footer className="public-footer"><Link href="/" className="public-brand"><span className="public-brand__mark">N</span><span><strong>New Nirvana</strong><small>مدیریت عملیات کابینت</small></span></Link><span>پاسخ‌های شفاف برای پروژه‌های عملیاتی.</span><div><Link href="/plans">پلن‌ها</Link><Link href="/auth">ورود</Link></div></footer>
  </main>;
}
