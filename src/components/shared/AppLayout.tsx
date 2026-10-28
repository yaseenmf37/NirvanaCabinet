"use client";

import React from "react";
import Sidebar from "@/src/components/shared/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell" dir="rtl"><Sidebar /><main id="main-content" className="app-main" tabIndex={-1}>{children}</main></div>;
}
