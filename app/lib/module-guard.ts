import { redirect } from "next/navigation";
import { hasModule } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import type { ModuleKey } from "@/src/core/types";

export async function requireModule(moduleKey: ModuleKey) {
  const user = await readSession();
  if (!user) redirect("/auth");
  if (!hasModule(user, moduleKey)) redirect("/dashboard");
  return user;
}
