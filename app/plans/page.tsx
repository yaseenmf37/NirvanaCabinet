"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Layers3 } from "lucide-react";
import "../page.css";

const durations = [
  { title: "۱ ماهه", value: "ماهانه", detail: "برای شروع سریع و آزمایشی" },
  { title: "۳ ماهه", value: "سه‌ماهه", detail: "برای یک فصل کاری منظم" },
  { title: "۶ ماهه", value: "شش‌ماهه", detail: "برای برنامه‌ریزی میان‌مدت" },
  { title: "۱ ساله", value: "سالانه", detail: "برای همکاری پایدار و کامل" },
];

function PlanSection({ type, description, Icon }: { type: "company" | "analyst"; description: string; Icon: typeof Building2 }) {
  return <section className="public-section public-pricing-section"><div className="public-section__heading"><span className="public-kicker"><Icon size={16} />{type === "company" ? "برای مجموعه‌ها و سازمان‌ها" : "برای آنالیزورها"}</span><h2>{type === "company" ? "یک مسیر مشترک برای کل تیم شما." : "تمرکز روی تحلیل دقیق هر پروژه."}</h2><p>{description}</p></div><div className="pricing-grid">{durations.map((duration, index) => <article className={`pricing-card ${index === 1 ? "pricing-card--popular" : ""}`} key={duration.title}>{index === 1 ? <span className="pricing-badge">پیشنهاد محبوب</span> : null}<h3>{duration.title}</h3><p className="pricing-card__detail">{duration.detail}</p><div className="pricing-price"><strong>{type === "company" ? ["۱٬۲۰۰٬۰۰۰", "۳٬۲۰۰٬۰۰۰", "۵٬۸۰۰٬۰۰۰", "۱۰٬۵۰۰٬۰۰۰"][index] : ["۴۰۰٬۰۰۰", "۱٬۱۰۰٬۰۰۰", "۱٬۹۰۰٬۰۰۰", "۳٬۴۰۰٬۰۰۰"][index]}</strong><span>تومان</span></div><ul>{(type === "company" ? ["مدیریت پروژه و اعضای تیم", "برنامه‌ریزی و عملیات اجرا", "گزارش و دسترسی نقش‌محور"] : ["اتصال ورودی پروژه", "تحلیل مدل و ابعاد", "گزارش قابل استفاده برای تیم"] ).map((feature) => <li key={feature}><CheckCircle2 size={15} />{feature}</li>)}</ul><Link className="public-button public-button--solid pricing-cta" href="/auth">انتخاب {duration.value} <ArrowLeft size={16} /></Link></article>)}</div></section>;
}

export default function PlansPage() {
  return <main className="public-shell"><nav className="public-nav" aria-label="ناوبری اصلی"><Link href="/" className="public-brand"><span className="public-brand__mark">N</span><span><strong>New Nirvana</strong><small>مدیریت عملیات کابینت</small></span></Link><div className="public-nav__links"><Link href="/">صفحه اصلی</Link><Link href="/faq">پرسش‌های متداول</Link></div><div className="public-nav__actions"><Link href="/auth" className="public-button public-button--quiet">ورود</Link><Link href="/auth" className="public-button public-button--solid">شروع همکاری <ArrowLeft size={16} /></Link></div></nav><section className="public-hero public-hero--compact"><div><span className="public-kicker"><span className="public-kicker__dot" />پلن‌های ساده و شفاف</span><h1 className="public-hero__copy" style={{ marginTop: ".9rem" }}>دو مسیر، چهار زمان، انتخابی که روشن است.</h1><p>New Nirvana را برای کل مجموعه بخواهید یا فقط برای تحلیل پروژه‌ها شروع کنید. مدل پلن‌ها ساده است؛ تفاوت فقط در مدت همکاری است.</p></div></section><PlanSection type="company" Icon={Building2} description="برای شرکت‌ها، کارگاه‌ها و سازمان‌هایی که می‌خواهند کل پروژه و تیم اجرا را در یک جریان واحد کنترل کنند." /><PlanSection type="analyst" Icon={Layers3} description="برای آنالیزورها و متخصصانی که به ورودی پروژه، مدل، اندازه‌ها و تحلیل ساختاریافته نیاز دارند." /><section className="public-cta"><div><span className="public-kicker">هنوز سؤال دارید؟</span><h2>پاسخ‌های متداول را ببینید.</h2></div><Link href="/faq" className="public-button public-button--outline">رفتن به FAQ <ArrowLeft size={17} /></Link></section><footer className="public-footer"><Link href="/" className="public-brand"><span className="public-brand__mark">N</span><span><strong>New Nirvana</strong><small>مدیریت عملیات کابینت</small></span></Link><span>پلن‌های شفاف برای مسیرهای واقعی کار.</span><div><Link href="/faq">FAQ</Link><Link href="/auth">ورود</Link></div></footer></main>;
}
