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
	AlertCircleIcon,
	CalendarOffIcon,
	FileWarningIcon,
	UserPlusIcon,
} from "lucide-react";

import { PageHeader } from "@/components/page";
import { SPONSORSHIP_STATUS_LABEL } from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/follow-up")({
	component: FollowUpPage,
});

function FollowUpPage() {
	const trpc = useTRPC();
	const q = useQuery(trpc.dashboard.followUp.queryOptions());

	if (q.isLoading || !q.data) {
		return <p className="text-muted-foreground text-sm">جاري التحميل…</p>;
	}

	const {
		unsponsored,
		noPaymentThisMonth,
		paymentsWithoutReceipts,
		incompleteProfiles,
	} = q.data;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="المتابعة" subtitle="ملخّص لكل ما يحتاج اهتمام" />

			<div className="grid gap-4 lg:grid-cols-2">
				<Section
					title="أطفال غير مكفولين"
					icon={<UserPlusIcon className="size-5 text-amber-600" />}
					count={unsponsored.length}
					empty="كل الأطفال مكفولون."
					tint="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.965_0.032_73))]"
				>
					{unsponsored.map((c) => (
						<RowItem
							key={c.id}
							to={"/children/$id"}
							params={{ id: c.id }}
							primary={c.fullName}
							secondary={`${c.id}${c.residence ? ` · ${c.residence}` : ""}`}
							right={
								<Badge variant="warning">
									{SPONSORSHIP_STATUS_LABEL.unsponsored}
								</Badge>
							}
						/>
					))}
				</Section>

				<Section
					title="مكفولون بلا دفعة هذا الشهر"
					icon={<CalendarOffIcon className="size-5 text-red-600" />}
					count={noPaymentThisMonth.length}
					empty="كل المكفولين تلقّوا دفعة هذا الشهر."
					tint="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.962_0.024_27))]"
				>
					{noPaymentThisMonth.map((c) => (
						<RowItem
							key={c.id}
							to={"/children/$id"}
							params={{ id: c.id }}
							primary={c.fullName}
							secondary={`${c.id}${c.residence ? ` · ${c.residence}` : ""}`}
							right={<Badge variant="destructive">معلَّق</Badge>}
						/>
					))}
				</Section>

				<Section
					title="دفعات بدون إقرار استلام"
					icon={<FileWarningIcon className="size-5 text-orange-600" />}
					count={paymentsWithoutReceipts.length}
					empty="كل الدفعات لها إقرارات."
					tint="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.965_0.03_58))]"
				>
					{paymentsWithoutReceipts.map((p) => (
						<RowItem
							key={p.id}
							to={"/payments"}
							primary={p.id}
							secondary={`${p.monthLabel} · $${(p.amountUsd / 100).toFixed(2)}`}
							right={<Badge variant="warning">بدون إقرار</Badge>}
						/>
					))}
				</Section>

				<Section
					title="ملفات ناقصة"
					icon={<AlertCircleIcon className="size-5 text-blue-600" />}
					count={incompleteProfiles.length}
					empty="كل الملفات مكتملة."
					tint="bg-[linear-gradient(135deg,oklch(0.992_0.006_100),oklch(0.955_0.026_205))]"
				>
					{incompleteProfiles.map((c) => {
						const missing: string[] = [];
						if (!c.photo) missing.push("صورة");
						if (!c.birthCertificate) missing.push("شهادة ميلاد");
						if (!c.guardianName) missing.push("ولي أمر");
						if (!c.phone) missing.push("هاتف");
						if (!c.residence) missing.push("سكن");
						return (
							<RowItem
								key={c.id}
								to={"/children/$id"}
								params={{ id: c.id }}
								primary={c.fullName}
								secondary={`${c.id} · ${missing.join("، ")}`}
								right={<Badge variant="outline">{missing.length}</Badge>}
							/>
						);
					})}
				</Section>
			</div>
		</div>
	);
}

function Section({
	title,
	icon,
	count,
	empty,
	children,
	tint,
}: {
	title: string;
	icon: React.ReactNode;
	count: number;
	empty: string;
	children: React.ReactNode;
	tint?: string;
}) {
	return (
		<Card className={tint}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<Badge variant={count > 0 ? "destructive" : "success"}>{count}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{count === 0 ? (
					<p className="text-muted-foreground text-sm">{empty}</p>
				) : (
					<div className="max-h-80 divide-y overflow-auto rounded-sm border bg-card/58">
						{children}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function RowItem({
	to,
	params,
	primary,
	secondary,
	right,
}: {
	to: string;
	params?: Record<string, string>;
	primary: string;
	secondary?: string;
	right?: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			params={params as never}
			className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent/35"
		>
			<div className="min-w-0">
				<p className="truncate font-medium">{primary}</p>
				{secondary && (
					<p className="truncate text-muted-foreground text-xs">{secondary}</p>
				)}
			</div>
			{right}
		</Link>
	);
}
