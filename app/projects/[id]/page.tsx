"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, FolderKanban, Save, Users as UsersIcon } from "lucide-react";
import { useAppStore } from "@/src/services/store/app-store";
import { stageLabels, statusLabels, type Project, type ProjectStage, type ProjectStatus } from "@/src/core/types";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { downloadTextFile } from "@/src/lib/export-text";

const stageEntries = Object.entries(stageLabels) as [ProjectStage, string][];
const statusEntries = Object.entries(statusLabels) as [ProjectStatus, string][];

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const { projects, platform, hydrate } = useAppStore();
  const project = projects.find((item) => item.id === params.id) ?? null;
  const users = platform.employees ?? [];
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<Pick<Project, "status" | "stage" | "memberIds">>({ status: "review", stage: "planning", memberIds: [] });
  const draft = draftProjectId === project?.id ? draftState : project ? { status: project.status, stage: project.stage, memberIds: project.memberIds } : draftState;
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const setDraft = (update: Pick<Project, "status" | "stage" | "memberIds"> | ((current: Pick<Project, "status" | "stage" | "memberIds">) => Pick<Project, "status" | "stage" | "memberIds">)) => {
    setDraftProjectId(project?.id ?? null);
    setDraftState((current) => typeof update === "function" ? update(current) : update);
  };
  const owner = useMemo(() => users.find((item) => item.id === project?.ownerId)?.name ?? project?.ownerId ?? "", [users, project?.ownerId]);
  const projectHistory = useMemo(() => {
    if (!project) return [];
    const workflowItems = [...((platform.assemblyItems ?? []) as import("@/src/core/types").WorkflowItem[]), ...((platform.installationItems ?? []) as import("@/src/core/types").WorkflowItem[])];
    const workflowEvents = workflowItems.filter((item) => item.projectId === project.id).flatMap((item) => item.history.map((event) => ({ ...event, subject: item.title })));
    const shipmentEvents = ((platform.shipments ?? []) as import("@/src/core/types").Shipment[]).filter((item) => item.projectId === project.id).flatMap((shipment) => shipment.history.map((event) => ({ ...event, subject: `محموله ${shipment.trackingCode}` })));
    const projectEvents = (project.auditHistory ?? []).map((event) => ({ ...event, subject: "مشخصات پروژه" }));
    return [...projectEvents, ...workflowEvents, ...shipmentEvents].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [platform.assemblyItems, platform.installationItems, platform.shipments, project]);

  if (!project) return <Card className="mx-auto max-w-xl p-12 text-center text-muted-foreground">پروژه موردنظر پیدا نشد یا دسترسی ندارید.</Card>;

  const downloadProjectReport = () => {
    const lines = [`گزارش پروژه: ${project.name}`, `مشتری: ${project.client}`, `مرحله: ${stageLabels[project.stage]}`, `وضعیت: ${statusLabels[project.status]}`, `مالک: ${owner}`, "", "سابقه عملیات:", ...projectHistory.map((event) => `${new Date(event.at).toLocaleString("fa-IR")} | ${event.subject} | ${event.detail ?? event.action} | ${event.actorName}`)];
    downloadTextFile(`${project.id}-report.txt`, lines.join("\n"));
  };
  const save = async () => {
    setSaving(true); setFeedback(null);
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update_project", projectId: project.id, patch: draft }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "ذخیره پروژه انجام نشد.");
      await hydrate(); setFeedback({ kind: "success", text: "وضعیت پروژه ذخیره شد." });
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "خطای نامشخص" }); } finally { setSaving(false); }
  };

  return <div className="space-y-8"><header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FolderKanban className="h-7 w-7" /></div><div><p className="text-sm text-muted-foreground">{project.client}</p><h1 className="text-3xl font-bold tracking-tight">{project.name}</h1></div></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={downloadProjectReport}><FileText className="h-4 w-4" />دریافت گزارش پروژه</Button><Button onClick={() => void save()} disabled={saving}><Save className="h-4 w-4" />{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button></div></header>{feedback ? <div className={`rounded-lg border p-4 text-sm ${feedback.kind === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</div> : null}
    <section className="grid gap-5 md:grid-cols-3"><Card className="p-6"><p className="text-sm text-muted-foreground">مالک پروژه</p><strong className="mt-2 block text-lg">{owner}</strong></Card><Card className="p-6"><p className="text-sm text-muted-foreground">مرحله فعلی</p><strong className="mt-2 block text-lg">{stageLabels[project.stage]}</strong></Card><Card className="p-6"><p className="text-sm text-muted-foreground">وضعیت</p><Badge className="mt-3" variant={project.status === "completed" ? "success" : "outline"}>{statusLabels[project.status]}</Badge></Card></section>
    <Card className="p-6"><div className="mb-5 flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">مدیریت وضعیت و اعضای پروژه</h2></div><div className="grid gap-5 lg:grid-cols-[1fr_16rem_16rem_auto]"><fieldset className="rounded-lg border border-border p-4"><legend className="px-2 text-sm font-semibold">اعضای پروژه</legend><div className="grid gap-2 sm:grid-cols-2">{users.length ? users.map((member) => <label key={member.id} className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted/50"><input type="checkbox" checked={draft.memberIds.includes(member.id)} onChange={(event) => setDraft((current) => ({ ...current, memberIds: event.target.checked ? [...new Set([...current.memberIds, member.id])] : current.memberIds.filter((id) => id !== member.id) }))} /><span>{member.name}<span className="block text-xs text-muted-foreground">{member.roleLabel}</span></span></label>) : <p className="text-sm text-muted-foreground">فهرست اعضای شرکت در دسترس نیست.</p>}</div></fieldset><label className="grid gap-2 text-sm font-medium">مرحله<select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={draft.stage} onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value as ProjectStage }))}>{stageEntries.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">وضعیت<select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ProjectStatus }))}>{statusEntries.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="flex items-end"><Button type="button" onClick={() => void save()} disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button></div></div></Card>
    <Card className="p-6"><h2 className="mb-5 text-lg font-semibold">سابقهٔ عملیات پروژه</h2>{projectHistory.length ? <div className="space-y-3">{projectHistory.map((event) => <div key={event.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><div><p className="font-medium">{event.subject}</p><p className="mt-1 text-sm text-muted-foreground">{event.detail ?? event.action} · {event.actorName}</p></div><time className="shrink-0 text-xs text-muted-foreground" dateTime={event.at}>{new Date(event.at).toLocaleString("fa-IR")}</time></div>)}</div> : <p className="text-sm text-muted-foreground">هنوز رویداد عملیاتی برای این پروژه ثبت نشده است.</p>}</Card></div>;
}
