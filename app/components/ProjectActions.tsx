"use client";

import { useState } from "react";
import { useAppStore } from "@/src/services/store/app-store";

export default function ProjectActions({ projectId }: { projectId: string }) {
  const project = useAppStore((state) => state.projects.find((item) => item.id === projectId));
  const hydrate = useAppStore((state) => state.hydrate);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleProgress = async () => {
    if (!project || saving) return;
    setSaving(true); setFeedback("");
    try {
      const progress = Math.min(project.progress + 10, 100);
      const response = await fetch("/api/platform/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update_project", projectId, patch: { progress, status: progress === 100 ? "completed" : project.status } }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "به‌روزرسانی پروژه انجام نشد.");
      await hydrate(); setFeedback("پیشرفت پروژه ذخیره شد.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "خطای نامشخص"); }
    finally { setSaving(false); }
  };

  return <div className="action-row compact"><button type="button" className="primary-btn" onClick={() => void handleProgress()} disabled={saving || !project}>{saving ? "در حال ذخیره..." : "+۱۰٪ پیشرفت"}</button>{feedback ? <small role="status">{feedback}</small> : null}</div>;
}
