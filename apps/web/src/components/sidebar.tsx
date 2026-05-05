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
		<aside className="sidebar no-print sticky top-0 flex h-screen w-64 shrink-0 flex-col border-s bg-sidebar text-sidebar-foreground">
			<div className="flex items-center justify-between border-b p-4">
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
									className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 ${
										active
											? "bg-sidebar-primary text-sidebar-primary-foreground"
											: "hover:bg-primary/5 hover:text-foreground"
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
			<div className="space-y-2 border-t p-3">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<AlertCircleIcon className="size-3" />
					<span className="text-primary/40">إصدار 1.0</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm">{userName ?? "المدير"}</span>
					<button
						type="button"
						onClick={signOut}
						className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-muted-foreground text-xs hover:bg-muted hover:text-destructive"
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
