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
		<aside className="sidebar no-print sticky top-0 flex h-screen w-64 shrink-0 flex-col border-s bg-sidebar text-sidebar-foreground shadow-[1px_0_0_oklch(0.18_0.01_155_/_0.04)]">
			<div className="border-b p-4">
				<Logo />
				<p className="mt-3 max-w-44 text-sidebar-foreground/60 text-xs leading-5">
					سجل الكفالات والدفعات والإقرارات
				</p>
			</div>
			<nav className="flex-1 overflow-y-auto p-3">
				<ul className="flex flex-col gap-1.5">
					{items.map((it) => {
						const Icon = it.icon;
						const active =
							location.pathname === it.to ||
							(it.to !== "/dashboard" && location.pathname.startsWith(it.to));
						return (
							<li key={it.to}>
								<Link
									to={it.to}
									className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-all duration-150 ${
										active
											? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.16)]"
											: "text-sidebar-foreground/74 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
			<div className="border-t bg-background/28 p-3">
				<div className="mb-3 flex items-center gap-2 text-sidebar-foreground/55 text-xs">
					<AlertCircleIcon className="size-3" />
					<span>إصدار 1.0</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="font-semibold text-sm">{userName ?? "المدير"}</span>
					<button
						type="button"
						onClick={signOut}
						className="inline-flex h-8 items-center gap-1 rounded-sm px-2 text-sidebar-foreground/62 text-xs hover:bg-background/45 hover:text-destructive"
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
