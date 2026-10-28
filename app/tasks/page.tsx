"use client";

import { useMemo, useState } from "react";
import { ListChecks, Search, Plus, ClipboardList } from "lucide-react";
import { useAppState } from "../components/AppStateProvider";
import AuthGuard from "../components/AuthGuard";
import RoleGate from "../components/RoleGate";
import TaskActions from "../components/TaskActions";
import TaskForm from "../components/TaskForm";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

export default function TasksPage() {
  const { tasks } = useAppState();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filteredTasks = useMemo(() => { const query = search.trim().toLowerCase(); return query ? tasks.filter((task) => [task.title, task.project, task.assignee, task.status, task.priority].some((value) => value.toLowerCase().includes(query))) : tasks; }, [tasks, search]);
  return <AuthGuard><RoleGate allowedRoles={["مدیر پروژه", "مدیر تولید", "نصاب"]}><div className="space-y-6"><header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-l from-primary/10 via-card to-card p-6 shadow-sm"><div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><ListChecks className="h-7 w-7" /></div><div><p className="text-sm font-semibold text-primary">مرکز پیگیری کارها</p><h1 className="text-3xl font-bold tracking-tight">لیست وظایف</h1><p className="mt-1 text-muted-foreground">وظایف تخصیص‌یافته را جست‌وجو و وضعیتشان را مدیریت کنید.</p></div></div><div className="flex flex-wrap items-center gap-3"><Badge variant="outline">{filteredTasks.length} وظیفه</Badge><Button onClick={() => setShowForm((visible) => !visible)} className="min-h-11 gap-2"><Plus className="h-4 w-4" />{showForm ? "بستن فرم" : "وظیفه جدید"}</Button></div></div><div className="relative mt-5 max-w-xl"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-lg border border-border bg-background/90 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجو در وظایف، پروژه یا مسئول..." /></div></header>{showForm ? <TaskForm onCreated={() => setShowForm(false)} /> : null}<Card className="overflow-hidden"><div className="border-b border-border bg-muted/30 p-5"><h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" />وظایف پروژه‌ها</h2></div><div className="space-y-3 p-5">{filteredTasks.map((task) => <div key={task.id} className="grid gap-4 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-muted/30 md:grid-cols-[1.5fr_1fr_auto_auto_auto] md:items-center"><div><strong className="block">{task.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{task.project}</span></div><span className="text-sm text-muted-foreground">{task.assignee}</span><Badge variant={task.priority === "بالا" ? "danger" : task.priority === "متوسط" ? "warning" : "outline"}>{task.priority}</Badge><Badge variant="outline">{task.status}</Badge><TaskActions taskId={task.id} /></div>)}{filteredTasks.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center"><p className="font-medium">هیچ وظیفه‌ای پیدا نشد.</p><p className="mt-1 text-sm text-muted-foreground">جست‌وجو را تغییر دهید یا وظیفه جدید بسازید.</p></div> : null}</div></Card></div></RoleGate></AuthGuard>;
}
