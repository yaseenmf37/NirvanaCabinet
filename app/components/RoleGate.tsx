"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/services/store/app-store";
import { roleLabels } from "@/src/core/types";

export default function RoleGate({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const allowed = useMemo(() => {
    if (!user) return false;
    const normalized = allowedRoles.map((role) => (Object.entries(roleLabels).find(([, label]) => label === role)?.[0] ?? role));
    return normalized.includes(user.role) || allowedRoles.includes(user.roleLabel);
  }, [allowedRoles, user]);
  if (!allowed) {
    if (user) router.replace("/dashboard");
    return null;
  }
  return <>{children}</>;
}
