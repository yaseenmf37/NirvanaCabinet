"use client";

import React, { useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Truck, PackageCheck, PackageX, ArrowLeftRight, FileText, AlertCircle } from "lucide-react";
import type { Shipment } from "@/src/core/types";

type Condition = "good" | "damaged" | "incomplete" | "missing";
const conditionLabels: Record<Condition, string> = { good: "سالم", damaged: "آسیب دیده", incomplete: "ناقص", missing: "مفقود" };

export default function LogisticsPage() {
  const platform = useAppStore((state) => state.platform);
  const hydrate = useAppStore((state) => state.hydrate);
  const shipments = (platform.shipments ?? []) as Shipment[];
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const shipment = shipments.find((item) => item.id === selectedShipmentId) ?? shipments[0];
  const [activeTab, setActiveTab] = useState<"dispatch" | "receipt">("dispatch");
  const [checks, setChecks] = useState<Record<string, { qty: number; condition: Condition }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const phase = activeTab === "dispatch" ? ("dispatch" as const) : ("receipt" as const);
  const confirmed = shipment?.[phase];

  const confirm = async () => {
    if (!shipment) return;
    setSaving(true);
    setError("");
    try {
      const items = shipment.items.map((item) => ({
        id: item.id,
        qty: checks[item.id]?.qty ?? item.listedQty,
        condition: checks[item.id]?.condition ?? "good",
      }));
      const response = await fetch("/api/platform/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "confirm_shipment", shipmentId: shipment.id, phase, check: { items } }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "ثبت تأییدیه انجام نشد.");
      setDone(activeTab === "dispatch" ? "تأیید ارسال ثبت شد." : "تأیید دریافت ثبت شد.");
      await hydrate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Truck className="h-6 w-6" /></div>
          <div><h1 className="text-3xl font-bold tracking-tight">حمل و تحویل</h1><p className="text-muted-foreground">مدیریت انتقال تجهیزات و تاییدیه تحویل دوطرفه</p></div>
          {shipments.length > 1 ? <label className="text-sm">محموله<select className="mr-2 h-10 rounded-md border border-border bg-background px-3" value={shipment?.id ?? ""} onChange={(event) => { setSelectedShipmentId(event.target.value); setChecks({}); setDone(""); }} aria-label="انتخاب محموله">{shipments.map((item) => <option key={item.id} value={item.id}>{item.trackingCode} · {item.projectId}</option>)}</select></label> : null}
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button variant={activeTab === "dispatch" ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab("dispatch")} className="rounded-md">ارسال</Button>
          <Button variant={activeTab === "receipt" ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab("receipt")} className="rounded-md">دریافت</Button>
        </div>
      </header>
      {error ? <div className="feedback feedback--error" role="alert"><AlertCircle aria-hidden="true" />{error}</div> : null}
      {done ? <div className="feedback feedback--success" role="status"><PackageCheck aria-hidden="true" />{done}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === "dispatch" ? <PackageCheck className="h-5 w-5 text-primary" /> : <PackageX className="h-5 w-5 text-primary" />}
              <h2 className="text-lg font-semibold">{activeTab === "dispatch" ? "لیست تایید ارسال" : "لیست تایید دریافت"}</h2>
            </div>
            {confirmed ? <Badge variant="success">تأیید شده توسط {confirmed.actorName}</Badge> : <Badge variant="outline">در انتظار تأیید</Badge>}
          </div>

          <div className="p-6 space-y-6">
            {!shipment ? <p className="text-sm text-muted-foreground text-center py-10">محموله‌ای برای این حساب ثبت نشده است.</p> : (
              <>
                <div className="bg-muted/30 p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">محموله {shipment.trackingCode}</p>
                    <p className="text-xs text-muted-foreground">پروژه {shipment.projectId}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground border-b border-border"><tr><th className="pb-3 font-medium">نام قطعه</th><th className="pb-3 font-medium text-center">فهرست</th><th className="pb-3 font-medium text-center">تعداد واقعی</th><th className="pb-3 font-medium text-center">وضعیت</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {shipment.items.map((item) => {
                        const check = checks[item.id] ?? { qty: item.listedQty, condition: "good" as Condition };
                        return (
                          <tr key={item.id}>
                            <td className="py-4 font-medium">{item.name}</td>
                            <td className="py-4 text-center">{item.listedQty}</td>
                            <td className="py-4 text-center">
                              <input type="number" min={0} value={check.qty} disabled={!!confirmed} aria-label={`تعداد ${item.name}`}
                                onChange={(e) => setChecks((c) => ({ ...c, [item.id]: { ...check, qty: Number(e.target.value) } }))}
                                className="w-16 h-8 text-center rounded border border-input bg-background text-xs" />
                            </td>
                            <td className="py-4 text-center">
                              <select value={check.condition} disabled={!!confirmed} aria-label={`وضعیت ${item.name}`}
                                onChange={(e) => setChecks((c) => ({ ...c, [item.id]: { ...check, condition: e.target.value as Condition } }))}
                                className="h-8 px-2 rounded border border-input bg-background text-xs">
                                {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!confirmed ? (
                  <div className="pt-6 border-t border-border flex justify-end">
                    <Button className="gap-2" onClick={() => void confirm()} disabled={saving}><FileText className="h-4 w-4" /> {saving ? "در حال ثبت..." : "ثبت و ارسال تأییدیه"}</Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-border flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">تاریخچه جابجایی</h2></div>
            <div className="p-6 space-y-6">
              {(shipment?.history ?? []).length === 0 ? <p className="text-sm text-muted-foreground">رویدادی ثبت نشده است.</p> : null}
              {(shipment?.history ?? []).map((log) => (
                <div key={log.id} className="relative border-r-2 border-muted pr-4 space-y-1">
                  <p className="text-sm font-medium">{log.actorName}</p>
                  <p className="text-xs text-muted-foreground">{log.action === "dispatch_confirmed" ? "تأیید ارسال" : "تأیید دریافت"}</p>
                  <p className="text-[10px] text-muted-foreground/60">{new Date(log.at).toLocaleString("fa-IR")}</p>
                </div>
              ))}
            </div>
          </Card>
          {(shipment?.discrepancies?.length ?? 0) > 0 ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-red-600"><AlertCircle className="h-4 w-4" /><h3 className="text-sm font-bold">اختلاف ثبت‌شده</h3></div>
                {shipment?.discrepancies.map((d) => <p key={d} className="text-xs text-red-600 leading-relaxed">{d}</p>)}
              </div>
            </Card>
          ) : (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertCircle className="h-4 w-4" /><h3 className="text-sm font-bold">تذکر سیستمی</h3></div>
                <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">هرگونه اختلاف در تعداد یا وضعیت قطعات به‌صورت خودکار محاسبه و در سابقه محموله ثبت می‌شود. تأییدیه ثبت‌شده بازنویسی نمی‌شود.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
