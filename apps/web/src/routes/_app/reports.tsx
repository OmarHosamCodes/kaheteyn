import { Badge } from "@kaheteyn/ui/components/badge";
import { Button } from "@kaheteyn/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@kaheteyn/ui/components/card";
import { Select } from "@kaheteyn/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@kaheteyn/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page";
import {
	currentMonthKey,
	FINANCIAL_STATUS_LABEL,
	formatDate,
	formatUSD,
	monthLabelFromKey,
	PAYMENT_STATUS_LABEL,
} from "@/lib/format";
import { downloadPDF } from "@/lib/pdf-export";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/reports")({
	component: ReportsPage,
});

function ReportsPage() {
	const trpc = useTRPC();
	const sponsorsQ = useQuery(trpc.sponsors.list.queryOptions());
	const paymentsQ = useQuery(trpc.payments.list.queryOptions());

	const [monthKey, setMonthKey] = useState(currentMonthKey());
	const [sponsorId, setSponsorId] = useState<string>("");
	const [financialStatus, setFinancialStatus] = useState<string>("");

	const reportQ = useQuery(
		trpc.dashboard.monthlyReport.queryOptions({
			monthKey,
			sponsorId: sponsorId || undefined,
			financialStatus: financialStatus
				? (financialStatus as "sent" | "confirmed" | "rejected")
				: undefined,
		}),
	);

	const sponsors = sponsorsQ.data ?? [];
	const items = reportQ.data?.items ?? [];
	const totals = reportQ.data?.totals;

	const monthOptions = useMemo(() => {
		const set = new Set<string>();
		(paymentsQ.data ?? []).forEach((p) => {
			set.add(p.monthKey);
		});
		set.add(currentMonthKey());
		return Array.from(set).sort().reverse();
	}, [paymentsQ.data]);

	const exportPDF = () => {
		downloadPDF({
			filename: `report-${monthKey}.pdf`,
			title: "التقرير الشهري",
			subtitle: `${monthLabelFromKey(monthKey)}${sponsorId ? ` | الكفيل: ${sponsors.find((s) => s.id === sponsorId)?.name ?? sponsorId}` : ""}`,
			rows: items,
			columns: [
				{ label: "المعرّف", getValue: (p) => p.id, width: 24 },
				{ label: "الطفل", getValue: (p) => p.childName, align: "right" },
				{ label: "السكن", getValue: (p) => p.childResidence, align: "right" },
				{ label: "الواصي", getValue: (p) => p.guardianName, align: "right" },
				{ label: "الهاتف", getValue: (p) => p.childPhone },
				{ label: "الحساب البنكي", getValue: (p) => p.guardianAccount },
				{ label: "الكفيل", getValue: (p) => p.sponsorName, align: "right" },
				{ label: "الشهر", getValue: (p) => p.monthLabel, align: "right" },
				{ label: "المبلغ", getValue: (p) => formatUSD(p.amountUsd) },
				{ label: "تاريخ الإرسال", getValue: (p) => formatDate(p.dateSent) },
				{
					label: "حالة الدفع",
					getValue: (p) =>
						PAYMENT_STATUS_LABEL[p.paymentStatus] ?? p.paymentStatus,
					align: "right",
				},
				{
					label: "الحالة المالية",
					getValue: (p) =>
						FINANCIAL_STATUS_LABEL[p.financialStatus] ?? p.financialStatus,
					align: "right",
				},
				{
					label: "الإقرار",
					getValue: (p) => (p.hasReceipt ? "موجود" : "مفقود"),
					align: "center",
				},
			],
			summary: totals
				? [
						{ label: "عدد الدفعات", value: totals.count },
						{ label: "الإجمالي", value: formatUSD(totals.totalCents) },
						{ label: "مؤكد", value: formatUSD(totals.confirmedCents) },
						{ label: "إقرارات مفقودة", value: totals.missingReceipts },
					]
				: undefined,
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="التقارير الشهرية"
				subtitle={monthLabelFromKey(monthKey)}
				actions={
					<Button variant="outline" size="sm" onClick={exportPDF}>
						<DownloadIcon className="ms-1 size-4" /> تصدير PDF
					</Button>
				}
			/>

			<Card className="no-print">
				<CardContent className="grid gap-3 pt-6 md:grid-cols-3">
					<Select
						value={monthKey}
						onChange={(e) => setMonthKey(e.target.value)}
					>
						{monthOptions.map((mk) => (
							<option key={mk} value={mk}>
								{monthLabelFromKey(mk)}
							</option>
						))}
					</Select>
					<Select
						value={sponsorId}
						onChange={(e) => setSponsorId(e.target.value)}
					>
						<option value="">كل الكفلاء</option>
						{sponsors.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</Select>
					<Select
						value={financialStatus}
						onChange={(e) => setFinancialStatus(e.target.value)}
					>
						<option value="">كل الحالات</option>
						<option value="sent">مرسلة</option>
						<option value="confirmed">مؤكدة</option>
						<option value="rejected">مرفوضة</option>
					</Select>
				</CardContent>
			</Card>

			<div className="print-header hidden print:block">
				<div className="mb-4 h-1 w-full rounded-full bg-primary" />
				<h1 className="font-bold text-xl">
					تقرير شهر {monthLabelFromKey(monthKey)}
				</h1>
				{sponsorId && (
					<p className="text-xs">
						الكفيل: {sponsors.find((s) => s.id === sponsorId)?.name}
					</p>
				)}
				<hr className="my-2" />
			</div>

			{reportQ.isLoading ? (
				<p className="text-muted-foreground text-sm">جاري التحميل…</p>
			) : (
				<>
					{totals && (
						<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
							<KPI label="عدد الدفعات" value={totals.count.toString()} />
							<KPI label="إجمالي" value={formatUSD(totals.totalCents)} />
							<KPI label="مؤكَّد" value={formatUSD(totals.confirmedCents)} />
							<KPI
								label="إقرارات مفقودة"
								value={totals.missingReceipts.toString()}
							/>
						</div>
					)}

					<Card>
						<CardHeader>
							<CardTitle>تفاصيل الدفعات</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							{items.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									لا توجد دفعات مطابقة للفلاتر.
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>المعرّف</TableHead>
											<TableHead>الطفل</TableHead>
											<TableHead>السكن</TableHead>
											<TableHead>الواصي</TableHead>
											<TableHead>رقم التواصل</TableHead>
											<TableHead>رقم الحساب البنكي</TableHead>
											<TableHead>الكفيل</TableHead>
											<TableHead>المبلغ</TableHead>
											<TableHead>التاريخ</TableHead>
											<TableHead>الحالة المالية</TableHead>
											<TableHead>الإقرار</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((p) => (
											<TableRow key={p.id}>
												<TableCell className="font-mono text-xs">
													{p.id}
												</TableCell>
												<TableCell>{p.childName}</TableCell>
												<TableCell>{p.childResidence}</TableCell>
												<TableCell>{p.guardianName}</TableCell>
												<TableCell className="font-mono text-xs" dir="ltr">
													{p.childPhone}
												</TableCell>
												<TableCell className="font-mono text-xs" dir="ltr">
													{p.guardianAccount}
												</TableCell>
												<TableCell>{p.sponsorName}</TableCell>
												<TableCell className="font-semibold">
													{formatUSD(p.amountUsd)}
												</TableCell>
												<TableCell>{formatDate(p.dateSent)}</TableCell>
												<TableCell>
													<Badge
														variant={
															p.financialStatus === "confirmed"
																? "success"
																: p.financialStatus === "rejected"
																	? "destructive"
																	: "info"
														}
													>
														{FINANCIAL_STATUS_LABEL[p.financialStatus] ??
															p.financialStatus}
													</Badge>
												</TableCell>
												<TableCell>
													{p.hasReceipt ? (
														<Badge variant="success">موجود</Badge>
													) : (
														<Badge variant="warning">مفقود</Badge>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

function KPI({ label, value }: { label: string; value: string }) {
	return (
		<Card>
			<CardContent className="pt-6">
				<p className="text-muted-foreground text-xs">{label}</p>
				<p className="mt-1 font-bold text-2xl">{value}</p>
			</CardContent>
		</Card>
	);
}
