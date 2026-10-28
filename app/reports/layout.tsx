export const dynamic = "force-dynamic";

import AppLayout from "@/src/components/shared/AppLayout";
import { requireModule } from "../lib/module-guard";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModule("reports");
  return <AppLayout>{children}</AppLayout>;
}
