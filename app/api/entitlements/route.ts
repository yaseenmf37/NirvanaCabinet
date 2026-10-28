export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readSession } from "@/src/core/auth/session";
import { readPlatform } from "@/src/services/store/platform-db";
import { moduleLabels } from "@/src/core/types";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const plans = readPlatform().plans.filter((plan) => plan.modules.some((module) => user.modules.includes(module)));
  return NextResponse.json({ userId: user.id, companyId: user.companyId, modules: user.modules.map((key) => ({ key, label: moduleLabels[key] })), matchingPlans: plans.map(({ id, name, modules, summary, priceLabel }) => ({ id, name, modules, summary, priceLabel })) }, { headers: NO_STORE });
}
