"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, FileUp, Hammer, ClipboardCheck, PackageSearch, Layers3, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useAppStore } from "@/src/services/store/app-store";
import type { ComponentItem, ComponentStatus, RoomModel } from "@/src/core/types";
import RoomViewer3D from "@/app/components/RoomViewer3D";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

type Kind = "assembly" | "installation";

const copy: Record<Kind, { verb: string; noun: string; icon: typeof Hammer; moduleLabel: string }> = {
  assembly: { verb: "تأیید مونتاژ", noun: "مونتاژ", icon: Hammer, moduleLabel: "ماژول مونتاژ" },
  installation: { verb: "تأیید نصب", noun: "نصب", icon: ClipboardCheck, moduleLabel: "ماژول نصب" },
};

const statusLabel: Record<ComponentStatus, string> = { pending: "در انتظار", completed: "انجام‌شده", problem: "دارای مشکل" };
const statusVariant: Record<ComponentStatus, "outline" | "success" | "danger"> = { pending: "outline", completed: "success", problem: "danger" };

export default function WorkflowWorkspace({ kind }: { kind: Kind }) {
  const platform = useAppStore((state) => state.platform);
  const projects = useAppStore((state) => state.projects);
  const hydrate = useAppStore((state) => state.hydrate);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewRotation, setViewRotation] = useState(20);
  const [viewPitch, setViewPitch] = useState(18);
  const [viewZoom, setViewZoom] = useState(1);
  const labels = copy[kind];
  const Icon = labels.icon;
  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const components = useMemo(() => ((platform.componentItems ?? []) as ComponentItem[]).filter((item) => item.projectId === project?.id), [platform.componentItems, project?.id]);
  const file = useMemo(() => (platform.skpFiles ?? []).find((item) => item.projectId === project?.id), [platform.skpFiles, project?.id]);

  const storedRoom = useMemo(() => ((platform.rooms ?? []) as RoomModel[]).find((item) => item.projectId === project?.id), [platform.rooms, project?.id]);
  const [viewHiddenWalls, setViewHiddenWalls] = useState<Record<string, number[]>>({});
  const [viewCeilings, setViewCeilings] = useState<Record<string, boolean>>({});
  const storedHidden = storedRoom?.hiddenWalls ?? [];
  const ceilingHidden = viewCeilings[project?.id ?? ""] ?? storedRoom?.ceilingHidden ?? false;
  const hiddenWalls = viewHiddenWalls[project?.id ?? ""] ?? storedHidden;
  const room = useMemo(() => storedRoom ? { ...storedRoom, ceilingHidden, hiddenWalls } : storedRoom, [storedRoom, ceilingHidden, hiddenWalls]);
  const selected = components.find((item) => item.id === selectedComponentId) ?? null;
  const myStatus = (item: ComponentItem): ComponentStatus => kind === "assembly" ? item.assemblyStatus : item.installationStatus;
  const completedCount = components.filter((item) => myStatus(item) === "completed").length;

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    setSelectedComponentId(null);
    setReason("");
    setError("");
  };

  const submit = async (status: ComponentStatus) => {
    if (!selected) return;
    if (status === "problem" && !reason.trim()) { setError("برای وضعیت مشکل باید دلیل ثبت شود."); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "set_component_status", componentId: selected.id, stage: kind, status, reason }) });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "ثبت انجام نشد.");
      setReason(""); await hydrate();
    } catch (e) { setError(e instanceof Error ? e.message : "خطای نامشخص"); } finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <header className="module-header"><div><div className="module-kicker"><Icon aria-hidden="true" /> {labels.moduleLabel}</div><h1>{labels.noun} قطعات</h1><p>ورودی مشترک تحلیل پروژه، همان مدل و فهرست برای مونتاژکار و نصاب است؛ فقط وضعیت {labels.noun} جداگانه ثبت می‌شود.</p></div><div className="header-actions"><select aria-label="پروژه فعال" value={project?.id ?? ""} onChange={(event) => selectProject(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Badge variant="outline">{completedCount} از {components.length} قطعه {labels.noun}‌شده</Badge></div></header>
    {error ? <div className="feedback feedback--error" role="alert"><AlertTriangle aria-hidden="true" />{error}</div> : null}
    <section className="surface p-5"><div className="surface-heading"><div><span className="eyebrow">ورودی مشترک پروژه</span><h2>{project?.name ?? "پروژه‌ای انتخاب نشده"}</h2></div>{file ? <Badge variant="success">فایل SKP ثبت‌شده</Badge> : <Badge variant="warning">فایل SKP ثبت نشده</Badge>}</div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">فایل مدل</p>{file ? <><p className="mt-1 font-medium">{file.originalName}</p><a className="mt-2 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm hover:bg-background" href={`/api/analysis/input?fileId=${encodeURIComponent(file.id)}`}><FileUp className="ml-1 h-4 w-4" /> دریافت فایل</a></> : <p className="mt-1 text-sm text-muted-foreground">هنوز فایلی از بخش تحلیل دریافت نشده است.</p>}</div><div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">قطعات مشترک</p><p className="mt-1 text-2xl font-bold tabular-nums">{components.length}</p><p className="mt-1 text-xs text-muted-foreground">آیتم یکسان برای مونتاژ و نصب</p></div><div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">پیشرفت {labels.noun}</p><p className="mt-1 text-2xl font-bold tabular-nums">{completedCount} / {components.length}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${components.length ? Math.round((completedCount / components.length) * 100) : 0}%` }} /></div></div></div></section>
        <section className="surface p-5"><div className="surface-heading"><div><span className="eyebrow">نمایش مدل</span><h2>کنترل دیوار و سقف</h2></div><span className="text-xs text-muted-foreground">فقط برای دید بهتر مدل همین صفحه</span></div><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={ceilingHidden} onChange={(event) => setViewCeilings((current) => ({ ...current, [project?.id ?? ""]: event.target.checked }))} /> سقف نمایش داده نشود</label><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">{room ? room.vertices.map((_, index) => <label key={index} className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm"><input type="checkbox" checked={!hiddenWalls.includes(index)} onChange={(event) => { const key = project?.id ?? ""; setViewHiddenWalls((current) => { const base = current[key] ?? storedHidden; const next = event.target.checked ? base.filter((wall) => wall !== index) : [...new Set([...base, index])]; return { ...current, [key]: next }; }); }} /> دیوار {index + 1}</label>) : <p className="col-span-full text-sm text-muted-foreground">مدلی برای کنترل وجود ندارد.</p>}</div></section>
    <section className="surface p-5" aria-label="مدل سه‌بعدی پروژه"><div className="surface-heading"><div><span className="eyebrow">مدل واحد پروژه</span><h2>نمای سه‌بعدی اتاق {project?.name ?? ""}</h2></div><span className="text-xs text-muted-foreground">{room ? `${room.vertices.length} دیوار · ${room.openings.length} بازشو` : "مدل اندازه‌گیری ثبت نشده"}</span></div>{room ? <><div className="room-3d-wrap"><RoomViewer3D room={room} rotation={viewRotation} pitch={viewPitch} zoom={viewZoom} onRotationChange={setViewRotation} onPitchChange={setViewPitch} onZoomChange={setViewZoom} /></div><div className="room-3d-toolbar"><Button variant="outline" size="sm" onClick={() => setViewRotation((value) => value - 15)}>چرخش چپ</Button><Button variant="outline" size="sm" onClick={() => setViewPitch((value) => Math.min(75, value + 15))}>نمایش از بالا</Button><Button variant="outline" size="sm" onClick={() => setViewPitch((value) => Math.max(-75, value - 15))}>نمایش از پایین</Button><Button variant="outline" size="sm" onClick={() => setViewZoom((value) => Math.min(1.8, value + 0.15))}>بزرگ‌نمایی</Button><Button variant="outline" size="sm" onClick={() => setViewZoom((value) => Math.max(0.6, value - 0.15))}>کوچک‌نمایی</Button><Button variant="ghost" size="sm" onClick={() => { setViewRotation(20); setViewPitch(18); setViewZoom(1); }}><RotateCcw className="h-4 w-4" /> بازنشانی</Button></div></> : <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">مدل اندازه‌گیری این پروژه در برنامه‌ریزی ثبت نشده است.</p>}</section>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><div className="border-b border-border p-5"><h2 className="flex items-center gap-2 font-semibold"><Layers3 className="h-4 w-4 text-primary" /> قطعات پروژه</h2><p className="mt-1 text-xs text-muted-foreground">فهرست واحد تولیدشده از ورودی تحلیل؛ برای هر دو مرحله یکسان است.</p></div><div className="space-y-3 p-5">{components.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">برای این پروژه هنوز آیتمی از ورودی تحلیل ساخته نشده است.</p> : null}{components.map((item) => { const status = myStatus(item); return <button type="button" key={item.id} onClick={() => { setSelectedComponentId(item.id); setReason(""); setError(""); }} aria-pressed={selectedComponentId === item.id} className={cn("w-full rounded-xl border p-4 text-right transition hover:border-primary/40 hover:bg-muted/40", selectedComponentId === item.id ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border")}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={cn("grid h-10 w-10 place-items-center rounded-full", status === "completed" ? "bg-green-500/15 text-green-600" : status === "problem" ? "bg-red-500/15 text-red-600" : "bg-muted text-muted-foreground")}>{status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : status === "problem" ? <AlertTriangle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span><div><p className="font-medium">{item.title}</p>{item.location ? <p className="mt-0.5 text-xs text-muted-foreground">{item.location}</p> : null}</div></div><Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge></div>{status === "problem" ? <p className="mt-2 text-xs text-red-600">{(kind === "assembly" ? item.assemblyHistory : item.installationHistory).at(-1)?.detail ?? "دارای مشکل"}</p> : null}</button>; })}</div></Card>
      <div className="space-y-6">{selected ? <Card><div className="border-b border-border p-5"><h2 className="font-semibold">ثبت وضعیت {labels.noun}</h2><p className="mt-1 text-xs text-muted-foreground">قطعه: {selected.title}</p></div><div className="space-y-4 p-5"><Button className="w-full gap-2" disabled={saving} onClick={() => void submit("completed")}><CheckCircle2 className="h-4 w-4" /> {labels.verb}</Button><div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">یا گزارش مشکل</span></div></div><textarea aria-label="دلیل مشکل" value={reason} onChange={(e) => setReason(e.target.value)} className="h-24 w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="توضیح مشکل یا قطعه مفقود..." /><Button variant="destructive" className="w-full" disabled={!reason.trim() || saving} onClick={() => void submit("problem")}><AlertTriangle className="h-4 w-4" /> ثبت مشکل {labels.noun}</Button>{myStatus(selected) !== "pending" ? <Button variant="ghost" className="w-full" disabled={saving} onClick={() => void submit("pending")}>بازگرداندن به حالت انتظار</Button> : null}</div></Card> : <Card className="flex h-full min-h-64 flex-col items-center justify-center border-dashed bg-muted/20 p-8 text-center"><div className="rounded-full bg-muted p-4 text-muted-foreground"><Icon className="h-8 w-8" /></div><h3 className="mt-4 font-medium">قطعه‌ای انتخاب نشده</h3><p className="mt-1 text-sm text-muted-foreground">برای {labels.verb} یا ثبت مشکل، یک قطعه را انتخاب کنید.</p></Card>}<Card className="border-blue-200 bg-blue-50/60 dark:border-blue-800/30 dark:bg-blue-900/10"><div className="space-y-2 p-5"><div className="flex items-center gap-2 text-blue-700 dark:text-blue-400"><PackageSearch className="h-4 w-4" /><h3 className="text-sm font-bold">ورودی یکسان برای {labels.noun}</h3></div><p className="text-xs leading-relaxed text-blue-600 dark:text-blue-500">این فهرست همان ورودی‌ای است که از فایل SKP پروژه ساخته شده و برای مونتاژکار و نصاب مشترک است؛ فقط وضعیت هر مرحله جداگانه ثبت می‌شود.</p></div></Card></div></div>
  </div>;
}
