"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useAppStore } from "@/src/services/store/app-store";
import { stageLabels, statusLabels } from "@/src/core/types";
import type { Project, WorkflowItem } from "@/src/core/types";

export type ProjectItem = { id: string; name: string; stage: string; owner: string; status: string; progress: number };
export type TaskItem = { id: string; title: string; project: string; assignee: string; priority: "بالا" | "متوسط" | "کم"; status: string; kind: "assembly" | "installation" };

type AppStateContextValue = {
  projects: ProjectItem[];
  tasks: TaskItem[];
  addProject: (project: Omit<ProjectItem, "id" | "progress"> & { progress?: number }) => void;
  addTask: (task: Omit<TaskItem, "id">) => void;
  updateProject: (id: string, updater: (project: ProjectItem) => ProjectItem) => void;
  updateTask: (id: string, updater: (task: TaskItem) => TaskItem) => void;
  setProjects: (items: ProjectItem[]) => void;
  setTasks: (items: TaskItem[]) => void;
  getProjectById: (id: string) => ProjectItem | undefined;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const platform = useAppStore((state) => state.platform);
  const hydrate = useAppStore((state) => state.hydrate);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  useEffect(() => {
    void hydrate();
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, [hydrate]);
  const projects = useMemo(() => (platform.projects ?? []).map((project: Project) => ({ id: project.id, name: project.name, stage: stageLabels[project.stage], owner: project.ownerId, status: statusLabels[project.status], progress: project.progress })), [platform.projects]);
  const tasks = useMemo<TaskItem[]>(() => {
    const toTask = (item: WorkflowItem, kind: TaskItem["kind"]): TaskItem => ({ id: item.id, title: item.title, project: item.projectId, assignee: item.assigneeId, priority: item.status === "problem" ? "بالا" : "متوسط", status: item.status === "completed" ? "تکمیل‌شده" : item.status === "problem" ? "دارای مشکل" : "در انتظار", kind });
    return [...((platform.assemblyItems ?? []) as WorkflowItem[]).map((item) => toTask(item, "assembly")), ...((platform.installationItems ?? []) as WorkflowItem[]).map((item) => toTask(item, "installation"))];
  }, [platform.assemblyItems, platform.installationItems]);
  const value = useMemo<AppStateContextValue>(() => ({
    projects,
    tasks,
    addProject: () => { throw new Error("ایجاد پروژه باید از /api/platform/actions انجام شود."); },
    addTask: () => { throw new Error("ایجاد وظیفه باید از /api/platform/actions انجام شود."); },
    updateProject: () => { throw new Error("به‌روزرسانی پروژه باید از /api/platform/actions انجام شود."); },
    updateTask: () => { throw new Error("به‌روزرسانی وظیفه باید از /api/platform/actions انجام شود."); },
    setProjects: () => { throw new Error("جایگزینی پروژه‌ها پشتیبانی نمی‌شود؛ از actionهای scoped استفاده کنید."); },
    setTasks: () => { throw new Error("جایگزینی وظایف پشتیبانی نمی‌شود؛ از actionهای scoped استفاده کنید."); },
    getProjectById: (id) => projects.find((project) => project.id === id),
  }), [projects, tasks]);
  return <AppStateContext.Provider value={value}>{isLoading ? <div className="app-state">در حال بارگذاری اطلاعات سامانه...</div> : error ? <div className="app-state app-state--error" role="alert">{error}</div> : children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
