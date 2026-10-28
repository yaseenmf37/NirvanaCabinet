"use client";

import { useState } from "react";
import { FileUp, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { useAppStore } from "@/src/services/store/app-store";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

export default function AnalysisPage() {
  const projects = useAppStore((state) => state.projects);
  const platform = useAppStore((state) => state.platform);
  const hydrate = useAppStore((state) => state.hydrate);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const currentFile = (platform.skpFiles ?? []).find((item) => item.projectId === projectId);
  const selectedProject = projects.find((item) => item.id === projectId);
  const components = (platform.componentItems ?? []).filter((item) => item.projectId === projectId);

  const upload = async () => {
    if (!projectId || !file) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const body = new FormData(); body.set("projectId", projectId); body.set("file", file);
      const response = await fetch("/api/analysis/input", { method: "POST", body });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "آپلود انجام نشد.");
      await hydrate(); setFile(null); setMessage("فایل پروژه ثبت شد و ورودی مشترک مونتاژ و نصب به‌روزرسانی شد.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "خطای نامشخص"); } finally { setSaving(false); }
  };

  return <div className="planning-page space-y-6"><header className="module-header"><div><div className="module-kicker"><Database aria-hidden="true" /> ورودی تحلیل</div><h1>بارگذاری مدل پروژه</h1><p>فایل SKP را به همان پروژه‌ای وصل کنید که اندازه‌گیری آن در برنامه‌ریزی ثبت شده است.</p></div><Badge variant="outline">{projects.length} پروژه قابل دسترسی</Badge></header>{message ? <div className="feedback feedback--success" role="status"><CheckCircle2 aria-hidden="true" />{message}</div> : null}{error ? <div className="feedback feedback--error" role="alert"><AlertCircle aria-hidden="true" />{error}</div> : null}<Card className="border-primary/20 p-6"><div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="grid gap-2 text-sm font-semibold">پروژه<select className="h-11 rounded-md border border-input bg-background px-3" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="" disabled>انتخاب پروژه</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.client}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">فایل SketchUp (.skp)<input className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm" type="file" accept=".skp,application/octet-stream" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><Button className="min-h-11 gap-2" disabled={!file || !projectId || saving} onClick={() => void upload()}><FileUp className="h-4 w-4" />{saving ? "در حال بارگذاری..." : "ثبت ورودی پروژه"}</Button></div><p className="mt-4 text-xs text-muted-foreground">فقط فایل واقعی با پسوند SKP تا سقف ۲۵ مگابایت پذیرفته می‌شود. پروژه انتخاب‌شده: <strong>{selectedProject?.name ?? "انتخاب نشده"}</strong></p></Card><Card className="p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">ورودی فعلی پروژه</h2><p className="mt-1 text-sm text-muted-foreground">این ورودی بین مونتاژکار و نصاب مشترک است.</p></div>{currentFile ? <Badge variant="success">فایل ثبت شده</Badge> : <Badge variant="outline">بدون فایل</Badge>}</div>{currentFile ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4"><div><p className="font-medium">{currentFile.originalName}</p><p className="mt-1 text-xs text-muted-foreground">{Math.round(currentFile.sizeBytes / 1024)} کیلوبایت · {new Date(currentFile.uploadedAt).toLocaleString("fa-IR")}</p></div><a className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-background" href={`/api/analysis/input?fileId=${encodeURIComponent(currentFile.id)}`}>دریافت فایل</a></div> : <p className="mt-5 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">برای این پروژه هنوز فایل SKP ثبت نشده است.</p>}{components.length ? <div className="mt-5"><h3 className="text-sm font-semibold">آیتم‌های مشترک عملیات</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{components.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><strong>{item.title}</strong><span className="mt-1 block text-xs text-muted-foreground">مونتاژ: {item.assemblyStatus === "pending" ? "در انتظار" : item.assemblyStatus} · نصب: {item.installationStatus === "pending" ? "در انتظار" : item.installationStatus}</span></div>)}</div></div> : null}</Card></div>;
}
