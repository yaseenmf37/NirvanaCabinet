"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { BarChart3, FileText, Download, TrendingUp, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import { stageLabels, type Project, type Shipment, type WorkflowItem } from "@/src/core/types";
import { downloadCsvFile, downloadTextFile } from "@/src/lib/export-text";

export default function ReportsPage() {
  const platform = useAppStore((state) => state.platform);
  const projects = (platform.projects ?? []) as Project[];
  const assembly = (platform.assemblyItems ?? []) as WorkflowItem[];
  const installation = (platform.installationItems ?? []) as WorkflowItem[];
  const shipments = (platform.shipments ?? []) as Shipment[];
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [range, setRange] = useState("all");
  const [reportNow] = useState(() => Date.now());
  const visibleProjects = useMemo(() => {
    if (range === "all") return projects;
    const days = range === "month" ? 30 : 90;
    const cutoff = reportNow - days * 24 * 60 * 60 * 1000;
    return projects.filter((project) => Date.parse(project.updatedAt || project.createdAt) >= cutoff);
  }, [projects, range, reportNow]);
  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);
  const reportStats = useMemo(() => ({ total: visibleProjects.length, completed: visibleProjects.filter((p) => p.status === "completed").length, waiting: visibleProjects.filter((p) => p.status === "waiting_approval").length, avgProgress: visibleProjects.length ? Math.round(visibleProjects.reduce((sum, p) => sum + p.progress, 0) / visibleProjects.length) : 0 }), [visibleProjects]);
  const workflow = [...assembly, ...installation].filter((item) => visibleProjectIds.has(item.projectId));
  const performance = ["planning", "analysis", "cutting", "assembly", "logistics", "installation"].map((stage) => { const related = visibleProjects.filter((p) => p.stage === stage); const progress = related.length ? Math.round(related.reduce((sum, p) => sum + p.progress, 0) / related.length) : 0; return { stage: stageLabels[stage as keyof typeof stageLabels], value: progress }; });
  const alerts = [...workflow.filter((item) => item.status === "problem").map((item) => ({ title: item.title, detail: item.problemReason ?? "مشکل ثبت‌شده در workflow" })), ...shipments.filter((item) => visibleProjectIds.has(item.projectId) && item.discrepancies.length).map((item) => ({ title: `محموله ${item.trackingCode}`, detail: `${item.discrepancies.length} مغایرت ثبت شده` }))];

  return <div className="space-y-8"><header className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg text-primary"><BarChart3 className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold tracking-tight">گزارشات و تحلیل‌ها</h1><p className="text-muted-foreground">شاخص‌های محاسبه‌شده از داده‌های واقعی پروژه و workflow</p></div></div><div className="flex items-center gap-3"><select aria-label="بازه زمانی گزارش" value={range} onChange={(event) => setRange(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">همه داده‌ها</option><option value="month">۳۰ روز اخیر</option><option value="quarter">۹۰ روز اخیر</option></select><Button className="gap-2" onClick={() => downloadCsvFile("new-nirvana-report.csv", [["شاخص", "مقدار"], ["کل پروژه‌ها", reportStats.total], ["تکمیل‌شده", reportStats.completed], ["در انتظار تأیید", reportStats.waiting], ["میانگین پیشرفت", `${reportStats.avgProgress}%`], ...performance.map((item) => [item.stage, `${item.value}%`])])}><Download className="h-4 w-4" /> خروجی Excel/CSV</Button></div></header>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[{label:"کل پروژه‌ها",value:reportStats.total,icon:TrendingUp},{label:"تکمیل‌شده",value:reportStats.completed,icon:CheckCircle2},{label:"در انتظار تأیید",value:reportStats.waiting,icon:AlertCircle},{label:"میانگین پیشرفت",value:`${reportStats.avgProgress}%`,icon:TrendingUp}].map((stat) => <Card key={stat.label} className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div><div className="p-2 bg-muted rounded-lg"><stat.icon className="h-5 w-5 text-primary" /></div></div></Card>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><Card className="lg:col-span-2"><div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">پیشرفت پروژه‌ها بر اساس مرحله</h2></div><div className="p-6 space-y-6">{performance.map((item) => <div key={item.stage} className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium">{item.stage}</span><span className="font-bold">{item.value}%</span></div><div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${item.value}%` }} /></div></div>)}</div></Card><Card><div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">موارد نیازمند پیگیری</h2></div><div className="p-6 space-y-4">{alerts.length === 0 ? <div className="text-center py-8"><CheckCircle2 className="mx-auto h-8 w-8 text-green-600" /><p className="mt-2 text-sm text-muted-foreground">مورد بحرانی ثبت نشده است.</p></div> : alerts.map((alert) => <div key={`${alert.title}-${alert.detail}`} className="p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-3"><AlertCircle className="h-4 w-4 mt-1 text-amber-600" /><div><p className="text-sm font-medium">{alert.title}</p><p className="text-xs text-muted-foreground">{alert.detail}</p></div></div>)}<Button variant="outline" className="w-full mt-4 gap-2" onClick={() => setShowWorkflow((visible) => !visible)}><FileText className="h-4 w-4" /> {showWorkflow ? "بستن گزارش workflow" : "مشاهده گزارش‌های workflow"}</Button>{showWorkflow ? <div className="mt-4 space-y-2" role="region" aria-label="گزارش workflow">{workflow.length ? workflow.map((item) => <div key={item.id} className="text-sm flex justify-between border-b border-border pb-2"><span>{item.title}</span><Badge variant={item.status === "problem" ? "warning" : "outline"}>{item.status}</Badge></div>) : <p className="text-sm text-muted-foreground">workflow ثبت نشده است.</p>}</div> : null}</div></Card></div></div>;
}
