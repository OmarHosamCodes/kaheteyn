import { Badge } from "@kaheteyn/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@kaheteyn/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangleIcon,
	BabyIcon,
	CheckCircle2Icon,
	HandCoinsIcon,
	InfoIcon,
	ReceiptIcon,
	UsersIcon,
} from "lucide-react";

import { formatDate, formatUSD, monthLabelFromKey } from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const trpc = useTRPC();
	const summary = useQuery(trpc.dashboard.summary.queryOptions());
	const latestPayments = useQuery(trpc.dashboard.latestPayments.queryOptions());
	const latestReceipts = useQuery(trpc.dashboard.latestReceipts.queryOptions());
	const ready = useQuery(trpc.dashboard.readyToDisburse.queryOptions());
	const alerts = useQuery(trpc.dashboard.alerts.queryOptions());
	const trend = useQuery(trpc.payments.monthlyTrend.queryOptions());

	const s = summary.data;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">الرئيسية</h1>
				<p className="text-muted-foreground text-sm italic">
					يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ
					فَتَنقَلِبُوا خَاسِرِينَ
				</p>
				<span className="text-muted-foreground text-sm">
					{s ? `شهر ${monthLabelFromKey(s.monthKey)}` : "—"}
				</span>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
				<Kpi
					icon={<BabyIcon className="size-5 text-primary" />}
					label="إجمالي الأطفال"
					value={s?.totalChildren ?? "—"}
					iconBg="bg-primary/10"
				/>
				<Kpi
					icon={<CheckCircle2Icon className="size-5 text-emerald-600" />}
					label="المكفولين"
					value={s?.sponsored ?? "—"}
					iconBg="bg-emerald-500/10"
				/>
				<Kpi
					icon={<AlertTriangleIcon className="size-5 text-amber-600" />}
					label="غير المكفولين"
					value={s?.unsponsored ?? "—"}
					iconBg="bg-amber-500/10"
				/>
				<Kpi
					icon={<UsersIcon className="size-5 text-primary" />}
					label="الكفلاء النشطين"
					value={s?.sponsorsCount ?? "—"}
					iconBg="bg-primary/10"
				/>
				<Kpi
					icon={<HandCoinsIcon className="size-5 text-primary" />}
					label="إجمالي الشهر"
					value={s ? formatUSD(s.monthTotalCents) : "—"}
					iconBg="bg-primary/10"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>مركز التنبيهات</CardTitle>
					</CardHeader>
					<CardContent>
						{!alerts.data || alerts.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد تنبيهات حالياً.
							</p>
						) : (
							<ul className="max-h-72 space-y-2 overflow-y-auto">
								{alerts.data.map((a, i) => (
									<li
										key={i}
										className={`flex items-start gap-3 rounded-md border p-3 ${
											a.severity === "critical"
												? "border-red-500/20 bg-red-500/5"
												: a.severity === "warning"
													? "border-amber-500/20 bg-amber-500/5"
													: "border-sky-500/20 bg-sky-500/5"
										}`}
									>
										<AlertIcon severity={a.severity} />
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">{a.title}</span>
												<SeverityBadge severity={a.severity} />
											</div>
											{a.detail && (
												<p className="mt-0.5 text-muted-foreground text-xs">
													{a.detail}
												</p>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>جاهز للصرف هذا الشهر</CardTitle>
					</CardHeader>
					<CardContent>
						{!ready.data || ready.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								جميع المكفولين تم صرف دفعاتهم لهذا الشهر.
							</p>
						) : (
							<ul className="max-h-72 space-y-1 overflow-y-auto">
								{ready.data.map((c) => (
									<li
										key={c.id}
										className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
									>
										<Link
											to="/children/$id"
											params={{ id: c.id }}
											className="hover:underline"
										>
											{c.fullName}
										</Link>
										<span className="text-muted-foreground text-xs">
											{c.id}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>أحدث الدفعات</CardTitle>
					</CardHeader>
					<CardContent>
						{!latestPayments.data || latestPayments.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد دفعات بعد.
							</p>
						) : (
							<ul className="space-y-1">
								{latestPayments.data.map((p) => (
									<li
										key={p.id}
										className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
									>
										<span className="truncate">{p.childName}</span>
										<span className="text-muted-foreground text-xs">
											{p.monthLabel}
										</span>
										<span className="font-medium">
											{formatUSD(p.amountUsd)}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							<ReceiptIcon className="ms-1 inline size-4" /> أحدث الإقرارات
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!latestReceipts.data || latestReceipts.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد إقرارات استلام بعد.
							</p>
						) : (
							<ul className="space-y-1">
								{latestReceipts.data.map((r) => (
									<li
										key={r.id}
										className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
									>
										<span className="truncate">{r.childName}</span>
										<span className="text-muted-foreground text-xs">
											{r.monthLabel} — {formatDate(r.dateSent)}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>المنحنى الشهري للصرف</CardTitle>
				</CardHeader>
				<CardContent>
					<TrendChart data={trend.data ?? []} />
				</CardContent>
			</Card>
		</div>
	);
}

function Kpi({
	icon,
	label,
	value,
	iconBg,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	iconBg?: string;
}) {
	return (
		<Card className="fade-in slide-in-from-bottom-2 animate-in duration-300">
			<CardContent className="pt-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-muted-foreground text-xs">{label}</p>
						<p className="mt-1 font-bold text-xl tabular-nums">{value}</p>
					</div>
					<div
						className={`grid size-10 place-items-center rounded-full ${iconBg ?? "bg-muted"}`}
					>
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AlertIcon({
	severity,
}: {
	severity: "critical" | "warning" | "info";
}) {
	if (severity === "critical")
		return <AlertTriangleIcon className="mt-0.5 size-4 text-red-500" />;
	if (severity === "warning")
		return <AlertTriangleIcon className="mt-0.5 size-4 text-amber-500" />;
	return <InfoIcon className="mt-0.5 size-4 text-sky-500" />;
}

function SeverityBadge({
	severity,
}: {
	severity: "critical" | "warning" | "info";
}) {
	if (severity === "critical") return <Badge variant="destructive">خطر</Badge>;
	if (severity === "warning") return <Badge variant="warning">متوسط</Badge>;
	return <Badge variant="info">طبيعي</Badge>;
}

function TrendChart({
	data,
}: {
	data: { monthKey: string; total: number; count: number }[];
}) {
	if (data.length === 0)
		return (
			<p className="text-muted-foreground text-sm">لا توجد بيانات للعرض.</p>
		);
	const max = Math.max(...data.map((d) => d.total), 1);
	const currentMonth = data[data.length - 1]?.monthKey;
	return (
		<div className="flex h-40 items-end gap-2 overflow-x-auto py-2">
			{data.map((d) => {
				const h = Math.max(4, Math.round((d.total / max) * 140));
				const isCurrent = d.monthKey === currentMonth;
				return (
					<div
						key={d.monthKey}
						className="group flex min-w-12 flex-col items-center gap-1"
						title={`${monthLabelFromKey(d.monthKey)}: ${formatUSD(d.total)}`}
					>
						<div
							className={`w-8 rounded-t transition-all duration-150 ${
								isCurrent
									? "bg-primary"
									: "bg-primary/50 group-hover:bg-primary/75"
							}`}
							style={{ height: `${h}px` }}
						/>
						<span className="whitespace-nowrap text-[10px] text-muted-foreground">
							{monthLabelFromKey(d.monthKey)}
						</span>
					</div>
				);
			})}
		</div>
	);
}
