"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { User as UserIcon, Search, Filter, Phone, ShieldCheck } from "lucide-react";

export default function EmployeesPage() {
  const platform = useAppStore((state) => state.platform);
  const user = useAppStore((state) => state.user);
  const hydrate = useAppStore((state) => state.hydrate);
  const employees = platform.employees ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("همه");
  const [newEmployee, setNewEmployee] = useState({ name: "", phone: "", password: "", role: "installer" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canManage = user?.role === "project_manager" || user?.role === "production_manager";
  const addEmployee = async () => {
    setSaving(true); setFeedback("");
    try { const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "add_employee", ...newEmployee }) }); if (!response.ok) throw new Error((await response.json()).error ?? "افزودن کارمند انجام نشد."); setNewEmployee({ name: "", phone: "", password: "", role: "installer" }); await hydrate(); setFeedback("کارمند اضافه شد."); } catch (error) { setFeedback(error instanceof Error ? error.message : "خطای نامشخص"); } finally { setSaving(false); }
  };
  const removeEmployee = async (id: string) => {
    if (!window.confirm("این کارمند حذف شود؟")) return;
    setSaving(true); setFeedback("");
    try { const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "remove_employee", employeeId: id }) }); if (!response.ok) throw new Error((await response.json()).error ?? "حذف کارمند انجام نشد."); await hydrate(); setFeedback("کارمند حذف شد."); } catch (error) { setFeedback(error instanceof Error ? error.message : "خطای نامشخص"); } finally { setSaving(false); }
  };

  const roles = ["همه", ...Array.from(new Set(employees.map((employee) => employee.roleLabel)))];
  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const query = searchQuery.trim().toLowerCase();
    return (!query || `${employee.name} ${employee.phone}`.toLowerCase().includes(query)) && (filterRole === "همه" || employee.roleLabel === filterRole);
  }), [employees, filterRole, searchQuery]);

  return <div className="space-y-8"><header className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg text-primary"><UserIcon className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold tracking-tight">مدیریت کارکنان</h1><p className="text-muted-foreground">کاربران شرکت، شماره تماس و نقش‌های فعال آن‌ها</p></div></div><Badge variant="outline">{employees.length} کاربر</Badge></header>
<Card className="p-6">{canManage ? <><h2 className="text-lg font-semibold">افزودن کارمند</h2><div className="mt-4 grid gap-4 md:grid-cols-4"><label className="grid gap-2 text-sm font-medium">نام<input className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={newEmployee.name} onChange={(event) => setNewEmployee((current) => ({ ...current, name: event.target.value }))} /></label><label className="grid gap-2 text-sm font-medium">شماره تماس<input type="tel" className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={newEmployee.phone} onChange={(event) => setNewEmployee((current) => ({ ...current, phone: event.target.value }))} /></label><label className="grid gap-2 text-sm font-medium">رمز اولیه<input type="password" className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={newEmployee.password} onChange={(event) => setNewEmployee((current) => ({ ...current, password: event.target.value }))} /></label><label className="grid gap-2 text-sm font-medium">نقش<select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={newEmployee.role} onChange={(event) => setNewEmployee((current) => ({ ...current, role: event.target.value }))}><option value="installer">نصاب</option><option value="assembler">مونتاژکار</option><option value="planner">متخصص اندازه‌گیری</option><option value="cutter">مسئول برش</option><option value="logistics">مسئول حمل</option></select></label></div><div className="mt-4 flex items-center gap-3"><Button type="button" disabled={saving} onClick={() => void addEmployee()}>افزودن کارمند</Button>{feedback ? <p className="text-sm text-muted-foreground" role="status">{feedback}</p> : null}</div></> : <p className="text-sm text-muted-foreground">امکان افزودن کارمند فقط برای مدیران فعال است.</p>}</Card>
    <div className="flex flex-col gap-6"><div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border"><div className="relative w-full md:w-96"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input className="w-full h-10 pr-10 pl-4 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="جستجو بر اساس نام یا شماره تماس..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0"><Filter className="h-4 w-4 text-muted-foreground shrink-0" />{roles.map((role) => <Button key={role} variant={filterRole === role ? "primary" : "outline"} size="sm" className="rounded-full text-xs whitespace-nowrap" onClick={() => setFilterRole(role)}>{role}</Button>)}</div></div>
      <Card><div className="overflow-x-auto"><table className="w-full text-sm text-right"><thead className="text-muted-foreground border-b border-border"><tr><th className="p-4 font-medium">کاربر</th><th className="p-4 font-medium">نقش</th><th className="p-4 font-medium">شماره تماس</th><th className="p-4 font-medium text-center">وضعیت</th></tr></thead><tbody className="divide-y divide-border">{filteredEmployees.map((employee) => <tr key={employee.id} className="hover:bg-muted/50 transition-colors"><td className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{employee.name[0]}</div><span className="font-medium">{employee.name}</span></div></td><td className="p-4"><Badge variant="outline">{employee.roleLabel}</Badge></td><td className="p-4 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{employee.phone}</span></td><td className="p-4 text-center"><div className="flex items-center justify-center gap-2"><Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" />فعال</Badge>{canManage ? <Button size="sm" variant="destructive" onClick={() => void removeEmployee(employee.id)} disabled={saving}>حذف</Button> : null}</div></td></tr>)}</tbody></table>{filteredEmployees.length === 0 ? <div className="p-20 text-center text-muted-foreground">کاربری با این مشخصات یافت نشد.</div> : null}</div></Card></div></div>;
}
