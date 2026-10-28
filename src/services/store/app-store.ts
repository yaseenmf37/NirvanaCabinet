"use client";

import { create } from "zustand";
import type { PlatformReadModel, Project, SessionUser } from "@/src/core/types";

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high";
}

type AppState = {
  user: SessionUser | null;
  projects: Project[];
  tasks: Task[];
  platform: Partial<PlatformReadModel>;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  projects: [],
  tasks: [],
  platform: {},
  isLoading: true,
  error: null,
  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/platform", { cache: "no-store" });
      if (response.status === 401) {
        set({ user: null, projects: [], platform: {}, isLoading: false, error: null });
        return;
      }
      if (!response.ok) throw new Error("دریافت اطلاعات سامانه ممکن نشد.");
      const data = (await response.json()) as PlatformReadModel;
      set({ user: data.user, projects: data.projects, platform: data, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "خطای نامشخص", isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
  updateProject: (id, updates) =>
    set((state) => ({ projects: state.projects.map((item) => (item.id === id ? { ...item, ...updates } : item)) })),
  updateTask: (id, updates) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? { ...item, ...updates } : item)) })),
}));
