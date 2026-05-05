import { Badge } from "@kaheteyn/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
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
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 rounded-sm border bg-card/78 p-4 shadow-[0_1px_0_oklch(0.18_0.01_155_/_0.04)] lg:grid-cols-[1fr_auto]">
				<div>
					<p className="mb-1 font-bold text-primary text-xs">سجل هذا الشهر</p>
					<h1 className="font-black text-3xl tracking-tight">الرئيسية</h1>
					<p className="mt-3 max-w-3xl text-muted-foreground text-sm leading-7">
						يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ
						فَتَنقَلِبُوا خَاسِرِينَ
					</p>
				</div>
				<div className="self-end rounded-sm bg-accent px-4 py-3 text-accent-foreground">
					<p className="font-semibold text-xs">الفترة الحالية</p>
					<p className="mt-1 font-black text-xl">
						{s ? monthLabelFromKey(s.monthKey) : "غير متاح"}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
				<Kpi
					icon={<BabyIcon className="size-5 text-primary" />}
					label="إجمالي الأطفال"
					value={s?.totalChildren ?? "غير متاح"}
					tone="green"
				/>
				<Kpi
					icon={
						<CheckCircle2Icon className="size-5 text-[oklch(0.42_0.12_149)]" />
					}
					label="المكفولين"
					value={s?.sponsored ?? "غير متاح"}
					tone="success"
				/>
				<Kpi
					icon={
						<AlertTriangleIcon className="size-5 text-[oklch(0.43_0.11_73)]" />
					}
					label="غير المكفولين"
					value={s?.unsponsored ?? "غير متاح"}
					tone="warning"
				/>
				<Kpi
					icon={<UsersIcon className="size-5 text-[oklch(0.36_0.085_205)]" />}
					label="الكفلاء النشطين"
					value={s?.sponsorsCount ?? "غير متاح"}
					tone="info"
				/>
				<Kpi
					icon={
						<HandCoinsIcon className="size-5 text-[oklch(0.39_0.12_149)]" />
					}
					label="إجمالي الشهر"
					value={s ? formatUSD(s.monthTotalCents) : "غير متاح"}
					tone="money"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.965_0.018_73))]">
					<CardHeader>
						<CardTitle>مركز التنبيهات</CardTitle>
						<CardDescription>الأمور التي تحتاج قراراً أو متابعة</CardDescription>
					</CardHeader>
					<CardContent>
						{!alerts.data || alerts.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد تنبيهات حالياً.
							</p>
						) : (
							<ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
								{alerts.data.map((a) => (
									<li
										key={`${a.severity}-${a.title}-${a.detail ?? ""}`}
										className={`flex items-start gap-3 rounded-sm border bg-card/70 p-3 shadow-[0_1px_0_oklch(0.18_0.01_155_/_0.04)] ${
											a.severity === "critical"
												? "border-[color:oklch(0.56_0.21_27_/_0.28)]"
												: a.severity === "warning"
													? "border-[color:oklch(0.68_0.15_73_/_0.32)]"
													: "border-[color:oklch(0.56_0.11_205_/_0.28)]"
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

				<Card className="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.952_0.028_145))]">
					<CardHeader>
						<CardTitle>جاهز للصرف هذا الشهر</CardTitle>
						<CardDescription>
							أسماء يمكن نقلها مباشرة إلى دورة الصرف
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!ready.data || ready.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								جميع المكفولين تم صرف دفعاتهم لهذا الشهر.
							</p>
						) : (
							<ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
								{ready.data.map((c) => (
									<li
										key={c.id}
										className="flex items-center justify-between rounded-sm border bg-card/78 px-3 py-2 text-sm hover:bg-accent/35"
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
						<CardDescription>آخر حركات الصرف المسجلة</CardDescription>
					</CardHeader>
					<CardContent>
						{!latestPayments.data || latestPayments.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد دفعات بعد.
							</p>
						) : (
							<ul className="flex flex-col gap-1.5">
								{latestPayments.data.map((p) => (
									<li
										key={p.id}
										className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-sm border bg-card px-3 py-2 text-sm hover:bg-accent/35"
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
						<CardDescription>
							آخر إقرارات الاستلام المرتبطة بالدفعات
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!latestReceipts.data || latestReceipts.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								لا توجد إقرارات استلام بعد.
							</p>
						) : (
							<ul className="flex flex-col gap-1.5">
								{latestReceipts.data.map((r) => (
									<li
										key={r.id}
										className="flex items-center justify-between rounded-sm border bg-card px-3 py-2 text-sm hover:bg-accent/35"
									>
										<span className="truncate">{r.childName}</span>
										<span className="text-muted-foreground text-xs">
											{r.monthLabel}، {formatDate(r.dateSent)}
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
	tone,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	tone: "green" | "success" | "warning" | "info" | "money";
}) {
	const tones: Record<typeof tone, string> = {
		green: "bg-[oklch(0.54_0.14_149_/_0.11)]",
		success: "bg-[oklch(0.54_0.14_149_/_0.16)]",
		warning: "bg-[oklch(0.68_0.15_73_/_0.18)]",
		info: "bg-[oklch(0.56_0.11_205_/_0.16)]",
		money: "bg-[oklch(0.5_0.14_149_/_0.18)]",
	};
	return (
		<Card className="fade-in slide-in-from-bottom-2 animate-in bg-card/82 duration-300">
			<CardContent className="pt-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-muted-foreground text-xs leading-5">{label}</p>
						<p className="mt-1 font-black text-2xl tabular-nums tracking-tight">
							{value}
						</p>
					</div>
					<div
						className={`grid size-11 place-items-center rounded-sm ${tones[tone]}`}
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
		return (
			<AlertTriangleIcon className="mt-0.5 size-4 text-[oklch(0.48_0.18_27)]" />
		);
	if (severity === "warning")
		return (
			<AlertTriangleIcon className="mt-0.5 size-4 text-[oklch(0.48_0.13_73)]" />
		);
	return <InfoIcon className="mt-0.5 size-4 text-[oklch(0.42_0.09_205)]" />;
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
		<div className="flex h-48 items-end gap-2 overflow-x-auto rounded-sm bg-muted/45 px-3 py-3">
			{data.map((d) => {
				const h = Math.max(4, Math.round((d.total / max) * 140));
				const isCurrent = d.monthKey === currentMonth;
				return (
					<div
						key={d.monthKey}
						className="group flex min-w-12 flex-col items-center gap-1.5"
						title={`${monthLabelFromKey(d.monthKey)}: ${formatUSD(d.total)}`}
					>
						<div
							className={`w-8 rounded-sm transition-colors duration-150 ${
								isCurrent
									? "bg-primary"
									: "bg-primary/42 group-hover:bg-primary/70"
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
