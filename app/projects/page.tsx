"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";
import AuthGuard from "../components/AuthGuard";
import RoleGate from "../components/RoleGate";
import { useAppState } from "../components/AppStateProvider";
import { useAppStore } from "@/src/services/store/app-store";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

export default function ProjectsPage() {
  const { projects } = useAppState();
  const hydrate = useAppStore((state) => state.hydrate);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const filteredProjects = useMemo(() => { const query = search.trim().toLowerCase(); return query ? projects.filter((project) => [project.name, project.owner, project.stage, project.status].some((value) => value.toLowerCase().includes(query))) : projects; }, [projects, search]);
  const createProject = async () => { if (!name.trim() || !client.trim()) { setError("نام پروژه و مشتری الزامی است."); return; } setSaving(true); setError(""); try { const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "create_project", name, client }) }); if (!response.ok) throw new Error((await response.json()).error ?? "ایجاد پروژه انجام نشد."); setName(""); setClient(""); await hydrate(); } catch (e) { setError(e instanceof Error ? e.message : "خطای نامشخص"); } finally { setSaving(false); } };

  return <AuthGuard><RoleGate allowedRoles={["مدیر پروژه", "مدیر تولید", "متخصص اندازه‌گیری", "متخصص مستقل", "نصاب"]}><div className="space-y-8"><header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FolderKanban className="h-7 w-7" /></div><div><h1 className="text-3xl font-bold tracking-tight">مدیریت پروژه‌ها</h1><p className="mt-1 text-muted-foreground">ثبت، جست‌وجو و پیگیری وضعیت کلی پروژه‌های شرکت</p></div></div><Badge variant="outline">{filteredProjects.length} پروژه</Badge></header>
  <Card className="border-primary/15 bg-gradient-to-l from-card via-card to-primary/5 shadow-sm"><div className="p-6"><div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">ایجاد پروژه</h2></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">نام پروژه<input className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary" value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً نوسازی آشپزخانه" /></label><label className="grid gap-2 text-sm font-medium">مشتری<input className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary" value={client} onChange={(event) => setClient(event.target.value)} placeholder="نام مشتری یا واحد سازمانی" /></label></div><div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={() => void createProject()} disabled={saving}>{saving ? "در حال ایجاد..." : "ایجاد پروژه"}</Button>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}</div></div></Card>
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-md border border-input bg-background pr-10 pl-4 text-sm outline-none transition focus:ring-2 focus:ring-primary" placeholder="جست‌وجو بر اساس نام، مالک، مرحله یا وضعیت..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
  <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group block"><Card className="h-full p-6 transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{project.stage}</p><h3 className="mt-2 text-lg font-semibold leading-8">{project.name}</h3></div><Badge variant={project.status === "تکمیل‌شده" ? "success" : "outline"}>{project.status}</Badge></div><div className="mt-6 rounded-lg border border-border bg-muted/40 p-4"><span className="text-xs text-muted-foreground">مالک پروژه</span><strong className="mt-1 block text-sm">{project.owner}</strong></div><p className="mt-4 text-sm text-primary">مشاهده جزئیات پروژه</p></Card></Link>)}{filteredProjects.length === 0 ? <Card className="col-span-full p-12 text-center text-muted-foreground">هیچ پروژه‌ای با این جست‌وجو پیدا نشد.</Card> : null}</section></div></RoleGate></AuthGuard>;
}
