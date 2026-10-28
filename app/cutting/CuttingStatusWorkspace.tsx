"use client";

import { useState } from "react";
import { CheckCircle2, Scissors } from "lucide-react";
import { useAppStore } from "@/src/services/store/app-store";
import type { ProjectStatus } from "@/src/core/types";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "review", label: "در حال بررسی" },
  { value: "active", label: "در جریان" },
  { value: "waiting_approval", label: "در انتظار تأیید" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "paused", label: "متوقف‌شده" },
];

export default function CuttingStatusWorkspace() {
  const projects = useAppStore((state) => state.projects);
  const hydrate = useAppStore((state) => state.hydrate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = projects.find((project) => project.id === selectedId);

  const selectProject = (id: string) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    setSelectedId(id);
    setStatus(project.status);
    setProgress(project.progress);
    setError("");
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/platform/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update_project", projectId: selectedId, patch: { stage: "cutting", status, progress } }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "وضعیت پروژه ذخیره نشد.");
      await hydrate();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "خطای نامشخص");
    } finally {
      setSaving(false);
    }
  };

  return <div className="planning-page space-y-6">
    <header className="module-header"><div><div className="module-kicker"><Scissors aria-hidden="true" /> ماژول برش</div><h1>وضعیت پروژه‌ها</h1><p>وضعیت مرحله برش را برای هر پروژه ثبت و پیگیری کنید.</p></div><Badge variant="outline">{projects.length} پروژه</Badge></header>
    <section className="surface p-5" aria-labelledby="cutting-project-status"><div className="surface-heading"><div><span className="eyebrow">صف برش</span><h2 id="cutting-project-status">پروژه‌ها</h2></div><span className="text-xs text-muted-foreground">یک پروژه را برای ثبت وضعیت انتخاب کنید</span></div><div className="cutting-project-grid">{projects.map((project) => <button type="button" className={`cutting-project-card ${selectedId === project.id ? "cutting-project-card--selected" : ""}`} key={project.id} onClick={() => selectProject(project.id)} aria-pressed={selectedId === project.id}><span><strong>{project.name}</strong><p>{project.client}</p></span><Badge variant={project.stage === "cutting" && project.status === "completed" ? "success" : project.stage === "cutting" ? "warning" : "outline"}>{project.stage === "cutting" ? project.status === "completed" ? "برش انجام شد" : "در انتظار برش" : "آماده‌سازی"}</Badge></button>)}</div>{selected ? <div className="cutting-status-editor" aria-label="ثبت وضعیت برش"><div><p className="text-sm font-medium">ثبت وضعیت {selected.name}</p><p className="text-xs text-muted-foreground">با ذخیره، مرحله پروژه روی «برش» قرار می‌گیرد.</p></div><label>وضعیت<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>پیشرفت: {progress}%<input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></label><Button onClick={() => void save()} disabled={saving}>{saving ? "در حال ذخیره..." : "تأیید و ذخیره"}</Button>{error ? <p className="feedback feedback--error" role="alert">{error}</p> : <p className="feedback feedback--success"><CheckCircle2 aria-hidden="true" />تغییرات فقط پس از ذخیره ثبت می‌شوند.</p>}</div> : <p className="mt-4 text-sm text-muted-foreground">برای شروع، یکی از پروژه‌ها را انتخاب کنید.</p>}</section>
  </div>;
}
