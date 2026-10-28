"use client";

import { FormEvent, useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import type { Project } from "@/src/core/types";

export default function TaskForm({ onCreated }: { onCreated?: () => void }) {
  const projects = useAppStore((state) => state.projects);
  const platform = useAppStore((state) => state.platform);
  const hydrate = useAppStore((state) => state.hydrate);
  const employees = platform.employees ?? [];
  const [form, setForm] = useState({ title: "", projectId: projects[0]?.id ?? "", assigneeId: "", kind: "assembly" as "assembly" | "installation" });
  const selectedProject = projects.find((project) => project.id === form.projectId) ?? projects[0];
  const projectEmployees = employees.filter((employee) => selectedProject?.memberIds.includes(employee.id));
  const effectiveProjectId = form.projectId || projects[0]?.id || "";
  const effectiveAssigneeId = projectEmployees.some((employee) => employee.id === form.assigneeId) ? form.assigneeId : (projectEmployees[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !effectiveProjectId || !effectiveAssigneeId) { setFeedback("عنوان، پروژه و مسئول الزامی هستند."); return; }
    setSaving(true); setFeedback("");
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "create_workflow", ...form, projectId: effectiveProjectId, assigneeId: effectiveAssigneeId }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "ایجاد وظیفه انجام نشد.");
      setForm((current) => ({ ...current, title: "" })); setFeedback("وظیفه ایجاد شد."); await hydrate(); onCreated?.();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "خطای نامشخص"); } finally { setSaving(false); }
  };

  return <form className="panel form-panel" onSubmit={submit}><div className="panel__header"><h2>ایجاد وظیفه عملیاتی</h2></div><div className="form-grid"><label>عنوان وظیفه<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label><label>پروژه<select value={effectiveProjectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, assigneeId: "" }))}>{projects.map((project: Project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>مسئول<select value={effectiveAssigneeId} onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}>{projectEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label>مرحله<select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as "assembly" | "installation" }))}><option value="assembly">مونتاژ</option><option value="installation">نصب</option></select></label></div>{feedback ? <p className={`feedback feedback--${feedback === "وظیفه ایجاد شد." ? "success" : "error"}`} role="status">{feedback}</p> : null}<button type="submit" className="primary-btn" disabled={saving}>{saving ? "در حال ثبت..." : "ذخیره وظیفه"}</button></form>;
}
