"use client";

import { useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import { useAppState } from "./AppStateProvider";

export default function TaskActions({ taskId }: { taskId: string }) {
  const { tasks } = useAppState();
  const hydrate = useAppStore((state) => state.hydrate);
  const task = tasks.find((item) => item.id === taskId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const complete = async () => {
    if (!task || task.status === "تکمیل‌شده") return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/platform/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "set_workflow", kind: task.kind, id: task.id, status: "completed" }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "ثبت انجام نشد.");
      await hydrate();
    } catch (e) { setError(e instanceof Error ? e.message : "خطای نامشخص"); } finally { setSaving(false); }
  };

  return <div className="action-row compact"><button type="button" className="primary-btn" onClick={() => void complete()} disabled={saving || task?.status === "تکمیل‌شده"}>تکمیل</button>{error ? <small role="alert">{error}</small> : null}</div>;
}
