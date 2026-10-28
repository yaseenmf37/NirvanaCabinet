import AppLayout from "@/src/components/shared/AppLayout";
import { requireModule } from "../lib/module-guard";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModule("analysis");
  return <AppLayout>{children}</AppLayout>;
}
