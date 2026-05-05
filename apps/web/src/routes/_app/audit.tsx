import { Badge } from "@kaheteyn/ui/components/badge";
import { Button } from "@kaheteyn/ui/components/button";
import { Card, CardContent } from "@kaheteyn/ui/components/card";
import { Input } from "@kaheteyn/ui/components/input";
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
import { DownloadIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, PageHeader } from "@/components/page";
import { formatDateTime } from "@/lib/format";
import { downloadPDF, pdfDateSlug } from "@/lib/pdf-export";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/audit")({
	component: AuditPage,
});

const ENTITY_LABEL: Record<string, string> = {
	child: "طفل",
	sponsor: "كفيل",
	payment: "دفعة",
	user: "مستخدم",
};

const ACTION_LABEL: Record<string, string> = {
	create: "إنشاء",
	update: "تعديل",
	delete: "حذف",
	login: "دخول",
	logout: "خروج",
};

function AuditPage() {
	const trpc = useTRPC();
	const [filter, setFilter] = useState<{
		entityType: string;
		action: string;
		fromDate: string;
		toDate: string;
		search: string;
	}>({
		entityType: "",
		action: "",
		fromDate: "",
		toDate: "",
		search: "",
	});

	const q = useQuery(
		trpc.audit.list.queryOptions({
			entityType: filter.entityType || undefined,
			action: filter.action || undefined,
			fromMs: filter.fromDate ? new Date(filter.fromDate).getTime() : undefined,
			toMs: filter.toDate
				? new Date(filter.toDate).getTime() + 24 * 60 * 60 * 1000 - 1
				: undefined,
			limit: 500,
		}),
	);

	const rows = q.data ?? [];

	const filtered = useMemo(() => {
		const s = filter.search.trim().toLowerCase();
		if (!s) return rows;
		return rows.filter(
			(r) =>
				r.id.toLowerCase().includes(s) ||
				(r.entityId ?? "").toLowerCase().includes(s) ||
				(r.actorName ?? "").toLowerCase().includes(s) ||
				(r.actorId ?? "").toLowerCase().includes(s),
		);
	}, [rows, filter.search]);

	const exportPDF = () => {
		downloadPDF({
			filename: `audit-${pdfDateSlug()}.pdf`,
			title: "سجل التدقيق",
			subtitle: `عدد العمليات: ${filtered.length}`,
			rows: filtered,
			columns: [
				{ label: "المعرّف", getValue: (r) => r.id, width: 28 },
				{ label: "التاريخ", getValue: (r) => formatDateTime(r.timestamp) },
				{
					label: "المنفّذ",
					getValue: (r) => r.actorName ?? r.actorId ?? "",
					align: "right",
				},
				{
					label: "النوع",
					getValue: (r) => ENTITY_LABEL[r.entityType] ?? r.entityType,
					align: "right",
				},
				{ label: "معرّف الكيان", getValue: (r) => r.entityId ?? "", width: 28 },
				{
					label: "الإجراء",
					getValue: (r) => ACTION_LABEL[r.action] ?? r.action,
					align: "right",
				},
			],
			summary: [{ label: "عدد العمليات", value: filtered.length }],
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="سجل العمليات"
				subtitle={`${filtered.length} عملية`}
				actions={
					<Button variant="outline" size="sm" onClick={exportPDF}>
						<DownloadIcon className="ms-1 size-4" /> تصدير PDF
					</Button>
				}
			/>

			<Card>
				<CardContent className="grid gap-3 pt-6 md:grid-cols-5">
					<Input
						placeholder="بحث (المعرّف، المنفِّذ…)"
						value={filter.search}
						onChange={(e) => setFilter({ ...filter, search: e.target.value })}
					/>
					<Select
						value={filter.entityType}
						onChange={(e) =>
							setFilter({ ...filter, entityType: e.target.value })
						}
					>
						<option value="">كل الأنواع</option>
						<option value="child">طفل</option>
						<option value="sponsor">كفيل</option>
						<option value="payment">دفعة</option>
						<option value="user">مستخدم</option>
					</Select>
					<Select
						value={filter.action}
						onChange={(e) => setFilter({ ...filter, action: e.target.value })}
					>
						<option value="">كل الإجراءات</option>
						<option value="create">إنشاء</option>
						<option value="update">تعديل</option>
						<option value="delete">حذف</option>
						<option value="login">دخول</option>
						<option value="logout">خروج</option>
					</Select>
					<Input
						type="date"
						value={filter.fromDate}
						onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
					/>
					<Input
						type="date"
						value={filter.toDate}
						onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
					/>
				</CardContent>
			</Card>

			{q.isLoading ? (
				<p className="text-muted-foreground text-sm">جاري التحميل…</p>
			) : filtered.length === 0 ? (
				<EmptyState
					title="لا توجد سجلات"
					description="لا تطابق العمليات الفلاتر الحالية."
				/>
			) : (
				<Card>
					<CardContent className="overflow-x-auto pt-6">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>التاريخ</TableHead>
									<TableHead>المنفِّذ</TableHead>
									<TableHead>النوع</TableHead>
									<TableHead>الكيان</TableHead>
									<TableHead>الإجراء</TableHead>
									<TableHead>المعرّف</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((r) => (
									<TableRow key={r.id}>
										<TableCell className="text-xs">
											{formatDateTime(r.timestamp)}
										</TableCell>
										<TableCell>{r.actorName ?? r.actorId ?? "—"}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{ENTITY_LABEL[r.entityType] ?? r.entityType}
											</Badge>
										</TableCell>
										<TableCell className="font-mono text-xs">
											{r.entityId ?? "—"}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													r.action === "create"
														? "success"
														: r.action === "delete"
															? "destructive"
															: r.action === "update"
																? "info"
																: "outline"
												}
											>
												{ACTION_LABEL[r.action] ?? r.action}
											</Badge>
										</TableCell>
										<TableCell className="font-mono text-muted-foreground text-xs">
											{r.id}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
