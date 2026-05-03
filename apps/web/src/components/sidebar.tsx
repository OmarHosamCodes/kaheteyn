import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  BabyIcon,
  ClipboardListIcon,
  HandCoinsIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { Logo } from "./logo";

const items = [
  { to: "/dashboard", label: "الرئيسية", icon: LayoutDashboardIcon },
  { to: "/children", label: "الأطفال", icon: BabyIcon },
  { to: "/sponsors", label: "الكفلاء", icon: UsersIcon },
  { to: "/payments", label: "الدفعات", icon: HandCoinsIcon },
  { to: "/reports", label: "التقارير", icon: ClipboardListIcon },
  { to: "/follow-up", label: "المتابعة", icon: SearchIcon },
  { to: "/audit", label: "سجل العمليات", icon: HistoryIcon },
  { to: "/admins", label: "المشرفون", icon: ShieldCheckIcon },
] as const;

export function Sidebar({ userName }: { userName?: string | null }) {
  const location = useLocation();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.navigate({ to: "/login" });
  }

  return (
    <aside className="sidebar no-print sticky top-0 h-screen w-64 shrink-0 border-s bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active =
              location.pathname === it.to ||
              (it.to !== "/dashboard" && location.pathname.startsWith(it.to));
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircleIcon className="size-3" />
          <span>إصدار 1.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">{userName ?? "المدير"}</span>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-muted"
            title="تسجيل خروج"
          >
            <LogOutIcon className="size-3" />
            خروج
          </button>
        </div>
      </div>
    </aside>
  );
}
