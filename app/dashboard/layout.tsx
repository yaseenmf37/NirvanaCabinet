"use client";

import AppLayout from "@/src/components/shared/AppLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
