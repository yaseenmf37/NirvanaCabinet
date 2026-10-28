"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Database, Download, Ruler, Scissors } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { ProjectStatus, RoomModel } from "@/src/core/types";
import { roomBounds, validateRoom } from "@/src/lib/planning-geometry";
import { useAppStore } from "@/src/services/store/app-store";

type PreparationMode = "analysis" | "cutting";

const labels: Record<PreparationMode, { title: string; kicker: string; description: string }> = {
  analysis: { title: "آماده‌سازی تحلیل", kicker: "ماژول تحلیل", description: "مدل اتاق و خروجی ساخت‌یافته پروژه را پیش از تحلیل بررسی کنید." },
  cutting: { title: "آماده‌سازی برش", kicker: "ماژول برش", description: "ورودی ساخت‌یافته پروژه را برای تصمیم‌گیری‌های بعدی برش مشاهده و وضعیت آن را تأیید کنید." },
};

const projectStatusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "review", label: "در حال بررسی" },
  { value: "active", label: "در جریان" },
  { value: "waiting_approval", label: "در انتظار تأیید" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "paused", label: "متوقف‌شده" },
];

function equipmentCount(room: RoomModel) {
  return [room.equipment.refrigerator !== "none", room.equipment.washingMachine, room.equipment.dishwasher, room.equipment.oven, room.equipment.cooktop, room.equipment.microwave, room.equipment.extractorHood].filter(Boolean).length;
}

export default function PreparationWorkspace({ mode }: { mode: PreparationMode }) {
  const user = useAppStore((state) => state.user);
  const projects = useAppStore((state) => state.projects);
  const rooms = (useAppStore((state) => state.platform.rooms) ?? []) as RoomModel[];
  const hydrate = useAppStore((state) => state.hydrate);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [cuttingProjectId, setCuttingProjectId] = useState<string | null>(null);
  const [cuttingStatus, setCuttingStatus] = useState<ProjectStatus>("active");
  const [cuttingProgress, setCuttingProgress] = useState(0);
  const [savingCutting, setSavingCutting] = useState(false);
  const [cuttingError, setCuttingError] = useState("");
  const [updatingPart, setUpdatingPart] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const copy = labels[mode];
  const activeProjectId = projects.some((item) => item.id === selectedProjectId) ? selectedProjectId : (projects[0]?.id ?? "");
  const missingParts = useAppStore((state) => state.platform.missingParts ?? []).filter((item) => item.projectId === activeProjectId);
  const project = projects.find((item) => item.id === activeProjectId);
  const room = project ? rooms.find((item) => item.projectId === project.id) : undefined;

  const issues = useMemo(() => (room ? validateRoom(room) : []), [room]);
  const dimensions = useMemo(() => {
    if (!room || room.vertices.length === 0) return null;
    const bounds = roomBounds(room.vertices);
    return { width: Math.round(bounds.width), depth: Math.round(bounds.depth), height: room.heightCm };
  }, [room]);

  const downloadOutput = async () => {
    if (!project || !room) return;
    setDownloadError("");
    const response = await fetch(`/api/planning/output?projectId=${encodeURIComponent(project.id)}`, { cache: "no-store" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setDownloadError(body?.error ?? "دریافت خروجی ممکن نشد.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.id}-room.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateMissingPart = async (id: string, status: "in_progress" | "resolved") => {
    setUpdatingPart(id);
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update_missing_part", id, status }) });
      if (!response.ok) throw new Error("به‌روزرسانی قطعه انجام نشد.");
      await hydrate();
    } finally {
      setUpdatingPart(null);
    }
  };

  const selectCuttingProject = (id: string) => {
    const selected = projects.find((item) => item.id === id);
    if (!selected) return;
    setCuttingProjectId(id);
    setCuttingStatus(selected.status);
    setCuttingProgress(selected.progress);
    setCuttingError("");
  };

  const saveCuttingStatus = async () => {
    if (!cuttingProjectId) return;
    setSavingCutting(true);
    setCuttingError("");
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update_project", projectId: cuttingProjectId, patch: { stage: "cutting", status: cuttingStatus, progress: cuttingProgress } }) });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "وضعیت پروژه ذخیره نشد.");
      await hydrate();
    } catch (error) {
      setCuttingError(error instanceof Error ? error.message : "خطای نامشخص");
    } finally {
      setSavingCutting(false);
    }
  };

  const Icon = mode === "analysis" ? Ruler : Scissors;
  const readinessLabel = !room ? "مدل ثبت نشده" : issues.length ? "نیازمند بررسی" : "آماده بررسی";
  const readinessVariant = !room || issues.length ? "warning" : "success";

  return (
    <main className="planning-page" aria-labelledby={`${mode}-title`}>
      <header className="module-header"><div><div className="module-kicker"><Icon aria-hidden="true" /> {copy.kicker}</div><h1 id={`${mode}-title`}>{copy.title}</h1><p>{copy.description}</p></div><div className="header-actions"><label className="sr-only" htmlFor={`${mode}-project`}>پروژه فعال</label><select id={`${mode}-project`} aria-label="پروژه فعال" value={activeProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={projects.length === 0}>{projects.length === 0 ? <option value="">پروژه‌ای در دسترس نیست</option> : null}{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{mode === "analysis" ? <Button onClick={() => void downloadOutput()} disabled={!room} className="gap-2"><Download aria-hidden="true" /> دریافت خروجی ساخت‌یافته</Button> : null}</div></header>
      {downloadError ? <div className="feedback feedback--error" role="alert"><AlertCircle aria-hidden="true" />{downloadError}</div> : null}
      <section className="surface p-5" aria-labelledby={`${mode}-readiness-title`}><div className="surface-heading"><div><span className="eyebrow">ورودی مجاز پروژه</span><h2 id={`${mode}-readiness-title`}>{project?.name ?? "پروژه‌ای انتخاب نشده است"}</h2></div><Badge variant={readinessVariant}>{readinessLabel}</Badge></div><p className="text-sm text-muted-foreground">داده‌های این صفحه فقط از مدل اندازه‌گیری ذخیره‌شده و پروژه‌های قابل دسترسی شما خوانده می‌شوند.{user ? ` کاربر فعال: ${user.name}` : ""}</p></section>
      <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="خلاصه مدل اتاق"><Metric label="وضعیت مدل" value={room ? "مدل موجود است" : "مدلی ثبت نشده"} icon={<Database aria-hidden="true" />} /><Metric label="نسخه" value={room ? `نسخه ${room.version}` : "—"} /><Metric label="ابعاد (طول × عمق × ارتفاع)" value={dimensions ? `${dimensions.width} × ${dimensions.depth} × ${dimensions.height} سانتی‌متر` : "—"} /><Metric label="رأس‌ها" value={room ? String(room.vertices.length) : "۰"} /><Metric label="بازشوها" value={room ? String(room.openings.length) : "۰"} /><Metric label="موانع" value={room ? String(room.obstacles.length) : "۰"} /><Metric label="بخش‌بندی‌ها" value={room ? String(room.sections.length) : "۰"} /><Metric label="تجهیزات فعال" value={room ? String(equipmentCount(room)) : "۰"} /></section>
      <section className="surface mt-5 p-5" aria-labelledby={`${mode}-validation-title`}><div className="surface-heading"><div><span className="eyebrow">اعتبارسنجی ورودی</span><h2 id={`${mode}-validation-title`}>موارد بررسی مدل</h2></div>{room && issues.length === 0 ? <CheckCircle2 className="text-green-600" aria-label="مدل بدون خطا است" /> : <AlertCircle className="text-amber-600" aria-label="مدل نیازمند بررسی است" />}</div>{!room ? <p className="text-sm text-muted-foreground">برای این پروژه هنوز مدل اتاقی ثبت نشده است.</p> : issues.length === 0 ? <p className="text-sm text-green-700">مدل بدون خطای اعتبارسنجی است.</p> : <ul className="space-y-2 text-sm text-destructive">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}</section>
      {mode === "cutting" ? <>
        <section className="surface mt-5 p-5" aria-labelledby="cutting-project-status"><div className="surface-heading"><div><span className="eyebrow">وضعیت پروژه‌ها</span><h2 id="cutting-project-status">پروژه‌های در صف برش</h2></div><span className="text-xs text-muted-foreground">برای ثبت وضعیت، پروژه را انتخاب کنید</span></div><div className="cutting-project-grid">{projects.map((item) => <button type="button" className={`cutting-project-card ${cuttingProjectId === item.id ? "cutting-project-card--selected" : ""}`} key={item.id} onClick={() => selectCuttingProject(item.id)} aria-pressed={cuttingProjectId === item.id}><span><strong>{item.name}</strong><p>{item.client}</p></span><Badge variant={item.stage === "cutting" && item.status === "completed" ? "success" : item.stage === "cutting" ? "warning" : "outline"}>{item.stage === "cutting" ? item.status === "completed" ? "برش انجام شد" : "در انتظار برش" : "آماده‌سازی"}</Badge></button>)}</div>{cuttingProjectId ? <div className="cutting-status-editor" aria-label="ثبت وضعیت برش"><div><p className="text-sm font-medium">ثبت وضعیت {projects.find((item) => item.id === cuttingProjectId)?.name}</p><p className="text-xs text-muted-foreground">با ذخیره، مرحله پروژه روی «برش» قرار می‌گیرد.</p></div><label>وضعیت<select value={cuttingStatus} onChange={(event) => setCuttingStatus(event.target.value as ProjectStatus)}>{projectStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>پیشرفت: {cuttingProgress}%<input type="range" min="0" max="100" value={cuttingProgress} onChange={(event) => setCuttingProgress(Number(event.target.value))} /></label><Button onClick={() => void saveCuttingStatus()} disabled={savingCutting}>{savingCutting ? "در حال ذخیره..." : "تأیید و ذخیره وضعیت برش"}</Button>{cuttingError ? <p className="feedback feedback--error" role="alert">{cuttingError}</p> : null}</div> : null}</section>
        <section className="surface mt-5 p-5" aria-labelledby="missing-parts-title"><div className="surface-heading"><div><span className="eyebrow">ورودی عملیاتی</span><h2 id="missing-parts-title">قطعات مفقود ارجاع‌شده از مونتاژ</h2></div><Badge variant={missingParts.filter((item) => item.status !== "resolved").length ? "warning" : "success"}>{missingParts.filter((item) => item.status !== "resolved").length} مورد باز</Badge></div><div className="space-y-3">{missingParts.length ? missingParts.map((part) => <div key={part.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div><p className="text-sm font-medium">{part.description}</p><p className="text-xs text-muted-foreground">وضعیت: {part.status === "reported" ? "گزارش‌شده" : part.status === "in_progress" ? "در حال پیگیری" : "رفع‌شده"}</p></div>{part.status !== "resolved" ? <Button size="sm" variant={part.status === "reported" ? "outline" : "primary"} disabled={updatingPart === part.id} onClick={() => void updateMissingPart(part.id, part.status === "reported" ? "in_progress" : "resolved")}>{part.status === "reported" ? "شروع پیگیری" : "ثبت رفع مشکل"}</Button> : null}</div>) : <p className="text-sm text-muted-foreground">قطعهٔ مفقودی برای پروژه‌های در دسترس ثبت نشده است.</p>}</div></section>
        <section className="surface mt-5 border-amber-200 p-5" aria-labelledby="cutting-scope-title"><div className="surface-heading"><div><span className="eyebrow">دامنه فعلی</span><h2 id="cutting-scope-title">قابلیت‌های تخصصی برش هنوز تعریف نشده‌اند</h2></div><Badge variant="warning">در انتظار نیازمندی</Badge></div><p className="text-sm text-muted-foreground">این صفحه ورودی برش و وضعیت پروژه را مدیریت می‌کند؛ محاسبات تخصصی بعد از تعریف نیازمندی اضافه می‌شوند.</p></section>
      </> : null}
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="surface p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div><strong className="mt-2 block text-lg">{value}</strong></div>; }
