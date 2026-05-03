import { Badge } from "@kaheteyn/ui/components/badge";
import { Button } from "@kaheteyn/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@kaheteyn/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@kaheteyn/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowRightIcon,
	PrinterIcon,
	Trash2Icon,
	UserCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ChildCvExport } from "@/components/child-cv-export";
import { useConfirm } from "@/components/confirm";
import { PageHeader } from "@/components/page";
import {
	FINANCIAL_STATUS_LABEL,
	formatDate,
	formatUSD,
	PAYMENT_STATUS_LABEL,
} from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/children/$id")({
	component: ChildDetail,
});

function ChildDetail() {
	const { id } = Route.useParams();
	const trpc = useTRPC();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const confirm = useConfirm();

	const childQ = useQuery(trpc.children.byId.queryOptions({ id }));
	const paymentsQ = useQuery(trpc.payments.list.queryOptions({ childId: id }));
	const sponsorsQ = useQuery(trpc.sponsors.list.queryOptions());

	const removeMut = useMutation(
		trpc.children.remove.mutationOptions({
			onSuccess: () => {
				toast.success("تم حذف الطفل");
				qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
				navigate({ to: "/children" });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (childQ.isLoading) {
		return <p className="text-muted-foreground text-sm">جاري التحميل…</p>;
	}
	if (childQ.isError || !childQ.data) {
		return (
			<div className="space-y-4">
				<Link
					to="/children"
					className="inline-flex items-center gap-1 text-primary text-sm"
				>
					<ArrowRightIcon className="size-4" /> رجوع
				</Link>
				<p>الطفل غير موجود.</p>
			</div>
		);
	}

	const c = childQ.data;
	const sponsor = (sponsorsQ.data ?? []).find((s) => s.id === c.sponsorId);
	const payments = paymentsQ.data ?? [];
	const totalCents = payments
		.filter((p) => p.financialStatus === "confirmed")
		.reduce((acc, p) => acc + p.amountUsd, 0);

	async function handlePrint() {
		const exportNode = document.querySelector<HTMLElement>(
			'[data-child-cv-export="true"]',
		);

		if (c.photo && exportNode) {
			for (let attempt = 0; attempt < 60; attempt += 1) {
				if (exportNode.dataset.exportPhotoReady === "true") break;
				await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
			}
		}

		window.print();
	}

	return (
		<div className="space-y-6">
			<div className="no-print">
				<Link
					to="/children"
					className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
				>
					<ArrowRightIcon className="size-4" /> رجوع للقائمة
				</Link>
			</div>

			<div className="no-print">
				<PageHeader
					title={c.fullName}
					subtitle={`${c.id}${c.residence ? ` — ${c.residence}` : ""}`}
					actions={
						<>
							<Button variant="outline" size="sm" onClick={handlePrint}>
								<PrinterIcon className="ms-1 size-4" /> طباعة / PDF
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={async () => {
									const ok = await confirm({
										title: "حذف الطفل؟",
										description: `سيُحذف ${c.fullName} وكل دفعاته.`,
										variant: "destructive",
										confirmLabel: "حذف",
									});
									if (ok) removeMut.mutate({ id: c.id });
								}}
								className="text-destructive"
							>
								<Trash2Icon className="ms-1 size-4" /> حذف
							</Button>
						</>
					}
				/>
			</div>

			<div className="no-print grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardContent className="pt-6 text-center">
						{c.photo ? (
							<img
								src={c.photo}
								alt=""
								className="mx-auto h-32 w-32 rounded-full border object-cover"
							/>
						) : (
							<div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-muted">
								<UserCircleIcon className="size-16 text-muted-foreground" />
							</div>
						)}
						<p className="mt-3 font-bold text-lg">{c.fullName}</p>
						<div className="mt-1 flex flex-wrap justify-center gap-2">
							{c.sponsorshipStatus === "sponsored" ? (
								<Badge variant="success">مكفول</Badge>
							) : (
								<Badge variant="warning">غير مكفول</Badge>
							)}
							{c.gender && <Badge variant="outline">{c.gender}</Badge>}
						</div>
						{c.birthCertificate ? (
							<a
								href={c.birthCertificate}
								target="_blank"
								rel="noreferrer"
								className="no-print mt-4 inline-block text-primary text-xs underline"
							>
								عرض شهادة الميلاد
							</a>
						) : null}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>المعلومات الأساسية</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
							<Info label="العمر" value={c.age ?? "—"} />
							<Info label="تاريخ الميلاد" value={formatDate(c.birthDate)} />
							<Info label="المرحلة الدراسية" value={c.schoolStage ?? "—"} />
							<Info label="السكن" value={c.residence ?? "—"} />
							<Info label="الحالة الصحية" value={c.healthStatus ?? "—"} />
							<Info label="عدد الإخوة" value={c.siblingsCount ?? "—"} />
							<Info label="اسم الأب" value={c.fatherName ?? "—"} />
							<Info
								label="تاريخ وفاة الأب"
								value={formatDate(c.fatherDeathDate)}
							/>
							<Info label="سبب الوفاة" value={c.fatherDeathCause ?? "—"} />
							<Info label="اسم الأم" value={c.motherName ?? "—"} />
							<Info label="ولي الأمر" value={c.guardianName ?? "—"} />
							<Info label="صلة القرابة" value={c.guardianRelation ?? "—"} />
							<Info label="الهاتف" value={c.phone ?? "—"} />
							<Info
								label="حساب البنك / المحفظة"
								value={c.guardianAccount ?? "—"}
							/>
							<Info
								label="الكفيل"
								value={
									sponsor ? (
										<Link
											to="/sponsors"
											className="text-primary hover:underline"
										>
											{sponsor.name}
										</Link>
									) : (
										"—"
									)
								}
							/>
						</dl>
						{c.notes ? (
							<div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
								<p className="mb-1 text-muted-foreground text-xs">ملاحظات</p>
								<p className="whitespace-pre-wrap">{c.notes}</p>
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>

			<ChildCvExport child={c} sponsor={sponsor} payments={payments} />

			<Card className="no-print">
				<CardHeader>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<CardTitle>سجل الدفعات</CardTitle>
						<span className="text-muted-foreground text-sm">
							إجمالي مؤكَّد:{" "}
							<span className="font-semibold text-foreground">
								{formatUSD(totalCents)}
							</span>
						</span>
					</div>
				</CardHeader>
				<CardContent>
					{payments.length === 0 ? (
						<p className="text-muted-foreground text-sm">لا توجد دفعات بعد.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>المعرّف</TableHead>
									<TableHead>الشهر</TableHead>
									<TableHead>المبلغ</TableHead>
									<TableHead>تاريخ الإرسال</TableHead>
									<TableHead>الحالة</TableHead>
									<TableHead>الحالة المالية</TableHead>
									<TableHead>إقرار الاستلام</TableHead>
									<TableHead>وصل التحويل</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="font-mono text-xs">{p.id}</TableCell>
										<TableCell>{p.monthLabel}</TableCell>
										<TableCell className="font-semibold">
											{formatUSD(p.amountUsd)}
										</TableCell>
										<TableCell>{formatDate(p.dateSent)}</TableCell>
										<TableCell>
											<Badge
												variant={
													p.paymentStatus === "paid"
														? "success"
														: p.paymentStatus === "late"
															? "destructive"
															: "warning"
												}
											>
												{PAYMENT_STATUS_LABEL[p.paymentStatus] ??
													p.paymentStatus}
											</Badge>
										</TableCell>
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
											{p.acknowledgmentReceipt ? (
												<a
													href={p.acknowledgmentReceipt}
													target="_blank"
													rel="noreferrer"
													aria-label="عرض إقرار الاستلام"
												>
													<img
														src={p.acknowledgmentReceipt}
														alt=""
														className="h-10 w-10 rounded border object-cover"
													/>
												</a>
											) : (
												<span className="text-muted-foreground text-xs">—</span>
											)}
										</TableCell>
										<TableCell>
											{p.transferReceipt ? (
												<a
													href={p.transferReceipt}
													target="_blank"
													rel="noreferrer"
													aria-label="عرض وصل التحويل"
												>
													<img
														src={p.transferReceipt}
														alt=""
														className="h-10 w-10 rounded border object-cover"
													/>
												</a>
											) : (
												<span className="text-muted-foreground text-xs">—</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-muted-foreground text-xs">{label}</dt>
			<dd className="font-medium">{value}</dd>
		</div>
	);
}
