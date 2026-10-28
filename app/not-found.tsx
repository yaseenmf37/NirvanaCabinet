"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";
import "./not-found.css";

function Cobweb({ className = "" }: { className?: string }) {
  return <svg className={`cobweb-svg ${className}`} viewBox="0 0 180 150" aria-hidden="true"><g><path d="M0 0 Q55 18 180 0 M0 0 Q38 48 180 60 M0 0 Q18 92 126 150 M0 0 Q90 40 180 120 M0 0 Q120 12 145 150" /><path d="M18 12 Q60 18 125 15 Q151 14 166 22 M35 32 Q72 38 122 37 Q145 38 158 48 M54 55 Q88 61 119 62 Q133 63 143 75 M73 80 Q98 86 117 89 Q125 91 128 103" /></g></svg>;
}

export default function NotFound() {
  return <main className="not-found-shell" dir="rtl"><div className="not-found-content"><div className="not-found-copy"><span className="not-found-kicker">خطای ۴۰۴ · مسیر پیدا نشد</span><h1>این مسیر هنوز ساخته نشده.</h1><p>صفحه‌ای که دنبالش هستید داخل این کابینت جا مانده یا دیگر وجود ندارد. از یک مسیر مطمئن‌تر ادامه دهید.</p><div className="not-found-actions"><Link href="/" className="not-found-button not-found-button--primary"><Home size={17} /> صفحهٔ اصلی</Link><Link href="/plans" className="not-found-button not-found-button--quiet"><Search size={17} /> دیدن پلن‌ها</Link></div></div><div className="cabinet-scene" aria-labelledby="cabinet-title"><h2 id="cabinet-title" className="sr-only">کابینت دیواری قدیمی با تار عنکبوت</h2><div className="cabinet-number">۴۰۴</div><div className="cabinet"><div className="cabinet-top" /><div className="cabinet-body"><div className="cabinet-inside"><span className="cabinet-shelf cabinet-shelf--one" /><span className="cabinet-shelf cabinet-shelf--two" /><Cobweb className="cobweb-svg--right" /><Cobweb className="cobweb-svg--left" /></div><div className="cabinet-door cabinet-door--left"><span className="cabinet-panel" /><i /></div><div className="cabinet-door cabinet-door--right"><span className="cabinet-panel" /><i /></div></div><div className="cabinet-base" /></div><span className="cabinet-caption">به نظر می‌رسد مدتی است کسی درِ این کابینت را باز نکرده...</span></div></div></main>;
}
