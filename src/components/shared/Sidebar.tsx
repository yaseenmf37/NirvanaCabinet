"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/src/services/store/app-store";
import { hasModule } from "@/src/core/auth/access";
import { LayoutDashboard, FolderKanban, Ruler, Scissors, Hammer, Truck, CheckSquare, Users, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";

const navItems = [
  { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { label: "پروژه‌ها", href: "/projects", icon: FolderKanban, module: "projects" as const },
  { label: "برنامه‌ریزی", href: "/planning", icon: Ruler, module: "planning" as const },
  { label: "تحلیل", href: "/analysis", icon: BarChart3, module: "analysis" as const },
  { label: "برش", href: "/cutting", icon: Scissors, module: "cutting" as const },
  { label: "مونتاژ", href: "/assembly", icon: Hammer, module: "assembly" as const },
  { label: "نصب", href: "/installation", icon: CheckSquare, module: "installation" as const },
  { label: "حمل و تحویل", href: "/logistics", icon: Truck, module: "logistics" as const },
  { label: "گزارش‌ها", href: "/reports", icon: BarChart3, module: "reports" as const },
  { label: "کارکنان", href: "/employees", icon: Users, module: "employees" as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/auth");
    router.refresh();
  };

  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="app-brand" aria-label="New Nirvana، داشبورد">
        <span className="app-brand__mark">N</span>
        <span><strong>New Nirvana</strong><small>Cabinet OS</small></span>
      </Link>
      {user ? <div className="sidebar-user"><strong>{user.name}</strong><span>{user.roleLabel}</span></div> : null}
      <nav className="sidebar-nav" aria-label="ناوبری اصلی">
        {navItems.filter((item) => !item.module || (user && hasModule(user, item.module))).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return <Link key={item.href} href={item.href} className={`sidebar-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" />{item.label}</Link>;
        })}
      </nav>
      <Button variant="ghost" className="sidebar-logout" onClick={logout}><LogOut aria-hidden="true" />خروج</Button>
    </aside>
  );
}
