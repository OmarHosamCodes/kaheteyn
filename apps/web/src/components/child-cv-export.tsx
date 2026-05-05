import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { formatDate } from "@/lib/format";

type ChildCvExportProps = {
	child: ExportChild;
	sponsor: ExportSponsor;
	payments: ExportPayment[];
};

type ExportChild = {
	fullName: string;
	sponsorshipStatus?: string | null;
	createdAt?: Date | string | number | null;
	photo?: string | null;
	birthDate?: Date | string | number | null;
	age?: number | null;
	gender?: string | null;
	residence?: string | null;
	healthStatus?: string | null;
	schoolStage?: string | null;
	fatherName?: string | null;
	motherName?: string | null;
	fatherDeathDate?: Date | string | number | null;
	fatherDeathCause?: string | null;
	siblingsCount?: number | null;
	guardianName?: string | null;
	guardianRelation?: string | null;
	phone?: string | null;
	guardianAccount?: string | null;
	notes?: string | null;
};

type ExportSponsor =
	| {
			name?: string | null;
	  }
	| null
	| undefined;

type ExportPayment = {
	amountUsd?: number | null;
	dateSent?: Date | string | number | null;
};

const EMPTY_VALUE = "";

function formatGender(value: string | null | undefined) {
	if (!value) return EMPTY_VALUE;
	if (value === "male" || value === "ذكر") return "ذكر";
	if (value === "female" || value === "أنثى") return "أنثى";
	return value;
}

function formatAmount(value: number | null | undefined) {
	if (value == null) return EMPTY_VALUE;
	const dollars = value / 100;
	return `${dollars.toLocaleString("en-US", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0,
	})} دولار`;
}

function getSponsorshipStartDate(payments: ExportPayment[]) {
	const dates = payments
		.map((payment) => payment.dateSent)
		.filter((date): date is Date | string | number => date != null)
		.map((date) => new Date(date))
		.filter((date) => !Number.isNaN(date.getTime()))
		.sort((a, b) => a.getTime() - b.getTime());

	return dates[0] ?? null;
}

const ChildPlaceholderIcon = () => (
	<svg
		width="104"
		height="120"
		viewBox="0 0 104 120"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle cx="52" cy="34" r="22" fill="currentColor" opacity="0.8" />
		<path
			d="M52 56C33.2223 56 17 72.2223 17 91V101H87V91C87 72.2223 70.7777 56 52 56Z"
			fill="currentColor"
		/>
	</svg>
);

export function ChildCvExport({
	child,
	sponsor,
	payments,
}: ChildCvExportProps) {
	const sponsorshipStartDate = getSponsorshipStartDate(payments);
	const monthlyAmount = payments[0]?.amountUsd ?? (sponsor ? 10_000 : null);
	const photoCanvasRef = useRef<HTMLCanvasElement>(null);
	const [photoReady, setPhotoReady] = useState(!child.photo);
	const title =
		child.sponsorshipStatus === "sponsored"
			? "ملف يتيم مكفول"
			: "ملف يتيم غير مكفول";

	useEffect(() => {
		if (!child.photo) {
			setPhotoReady(true);
			return;
		}

		setPhotoReady(false);
		let cancelled = false;
		const image = new Image();
		image.decoding = "async";
		image.onload = () => {
			if (cancelled) return;

			const canvas = photoCanvasRef.current;
			const context = canvas?.getContext("2d");
			if (!canvas || !context) {
				setPhotoReady(true);
				return;
			}

			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 0, 0);
			setPhotoReady(true);
		};
		image.onerror = () => {
			if (!cancelled) setPhotoReady(true);
		};
		image.src = child.photo;

		return () => {
			cancelled = true;
		};
	}, [child.photo]);

	return (
		<div
			className="pointer-events-none fixed top-0 left-0 -z-10 h-0 w-0 overflow-hidden bg-[oklch(0.992_0.006_100)] text-[oklch(0.18_0.01_155)] opacity-0 print:pointer-events-auto print:static print:z-auto print:h-auto print:w-auto print:overflow-visible print:opacity-100"
			data-child-cv-export="true"
			data-export-photo-ready={photoReady ? "true" : "false"}
			dir="rtl"
		>
			<style>
				{"@media print { @page { size: A4 portrait; margin: 12mm; } }"}
			</style>

			<div className="mx-auto flex min-h-[273mm] w-[186mm] flex-col text-[11px] leading-[1.65]">
				<header className="pb-4">
					<div className="flex items-start justify-between gap-6">
						<div className="min-w-0 flex-1">
							<p className="font-medium text-[10px] text-[oklch(0.48_0.026_162)]">
								مبادرة كهاتين لكفالة أبناء شهداء غزة
							</p>
							<h1 className="mt-1 font-bold text-[19px] leading-tight">
								{title}
							</h1>
							<p className="mt-1 text-[10px] text-[oklch(0.48_0.026_162)]">
								تاريخ فتح الملف: {formatDate(child.createdAt)}
							</p>
						</div>

						<img
							src="/logo.png"
							alt="كهاتين"
							className="h-[18mm] w-auto shrink-0 object-contain"
						/>
					</div>

					<div className="mt-4 border-[oklch(0.5_0.14_149)] border-t" />
				</header>

				<div className="grid grid-cols-[42mm_1fr] items-start gap-5">
					<aside className="space-y-3">
						<Section title="الصورة الشخصية">
							<div className="border border-[oklch(0.875_0.016_112)] bg-[oklch(0.955_0.013_102)] p-2">
								{child.photo ? (
									<canvas
										ref={photoCanvasRef}
										aria-label={child.fullName}
										data-export-photo="true"
										className="h-[50mm] w-full object-cover"
									/>
								) : (
									<div className="flex h-[50mm] flex-col items-center justify-center text-[oklch(0.5_0.14_149)]">
										<ChildPlaceholderIcon />
										<span className="mt-2 font-medium text-[14px]">طفل</span>
									</div>
								)}
							</div>
						</Section>

						<Section title="ملخص الكفالة">
							<div className="divide-y divide-[oklch(0.875_0.016_112)] border border-[oklch(0.875_0.016_112)]">
								<StackedField label="حالة الملف" value={title} />
								<StackedField label="الكافل" value={sponsor?.name} />
								<StackedField
									label="قيمة الكفالة"
									value={formatAmount(monthlyAmount)}
								/>
								<StackedField
									label="تاريخ البدء"
									value={
										sponsorshipStartDate
											? formatDate(sponsorshipStartDate)
											: EMPTY_VALUE
									}
								/>
							</div>
						</Section>
					</aside>

					<div className="min-w-0 flex-1 space-y-4">
						<Section title="البيانات الشخصية">
							<dl className="grid grid-cols-2 border border-[oklch(0.875_0.016_112)]">
								<DataField label="الاسم الكامل" value={child.fullName} wide />
								<DataField
									label="تاريخ الميلاد"
									value={formatDate(child.birthDate)}
								/>
								<DataField label="العمر" value={child.age} />
								<DataField label="الجنس" value={formatGender(child.gender)} />
								<DataField label="مكان الإقامة" value={child.residence} />
								<DataField label="الحالة الصحية" value={child.healthStatus} />
								<DataField label="المرحلة الدراسية" value={child.schoolStage} />
							</dl>
						</Section>

						<Section title="البيانات العائلية">
							<dl className="grid grid-cols-2 border border-[oklch(0.875_0.016_112)]">
								<DataField label="اسم الأب" value={child.fatherName} />
								<DataField label="اسم الأم" value={child.motherName} />
								<DataField
									label="تاريخ وفاة الأب"
									value={formatDate(child.fatherDeathDate)}
								/>
								<DataField
									label="سبب وفاة الأب"
									value={child.fatherDeathCause}
								/>
								<DataField
									label="عدد الإخوة والأخوات"
									value={child.siblingsCount}
								/>
								<DataField label="الوصي الشرعي" value={child.guardianName} />
								<DataField label="صلة القرابة" value={child.guardianRelation} />
								<DataField label="رقم الهاتف" value={child.phone} />
								<DataField
									label="حساب البنك / المحفظة"
									value={child.guardianAccount}
									wide
								/>
							</dl>
						</Section>

						<Section title="الوضع المعيشي">
							<dl className="grid grid-cols-2 border border-[oklch(0.875_0.016_112)]">
								<DataField label="نوع السكن" value={EMPTY_VALUE} />
								<DataField label="مصادر الدخل" value={EMPTY_VALUE} />
								<DataField
									label="الاحتياجات الأساسية"
									value={EMPTY_VALUE}
									wide
								/>
							</dl>
						</Section>

						<Section title="تفاصيل الكفالة">
							<dl className="grid grid-cols-2 border border-[oklch(0.875_0.016_112)]">
								<DataField label="اسم الكافل" value={sponsor?.name} />
								<DataField label="بلد الكافل" value={EMPTY_VALUE} />
								<DataField
									label="قيمة الكفالة الشهرية"
									value={formatAmount(monthlyAmount)}
								/>
								<DataField
									label="مدة الكفالة"
									value={sponsor ? "مفتوحة" : EMPTY_VALUE}
								/>
								<DataField
									label="تاريخ بدء الكفالة"
									value={
										sponsorshipStartDate
											? formatDate(sponsorshipStartDate)
											: EMPTY_VALUE
									}
									wide
								/>
							</dl>
						</Section>

						<Section title="ملاحظات إضافية">
							<div className="min-h-[24mm] whitespace-pre-wrap border border-[oklch(0.875_0.016_112)] px-3 py-2 text-[12px] leading-[1.8]">
								{child.notes ?? EMPTY_VALUE}
							</div>
						</Section>
					</div>
				</div>

				<footer className="mt-auto pt-6 text-[9px] text-[oklch(0.48_0.026_162)]">
					<div className="border-[oklch(0.875_0.016_112)] border-t pt-2">
						<div className="flex items-center justify-between gap-4">
							<span>صفحة ١</span>
							<span>تم إنشاؤه من نظام كهاتين</span>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section>
			<h2 className="border border-[oklch(0.875_0.016_112)] bg-[oklch(0.955_0.013_102)] px-2 py-1 font-bold text-[11px] leading-tight">
				{title}
			</h2>
			<div className="mt-2">{children}</div>
		</section>
	);
}

function DataField({
	label,
	value,
	wide = false,
}: {
	label: string;
	value: ReactNode;
	wide?: boolean;
}) {
	return (
		<div
			className={`min-h-[10mm] border-[oklch(0.875_0.016_112)] border-b px-2 py-1.5 even:border-r ${wide ? "col-span-2" : ""}`}
		>
			<dt className="font-medium text-[9px] text-[oklch(0.48_0.026_162)] leading-tight">
				{label}
			</dt>
			<dd className="mt-0.5 min-h-[14px] font-semibold text-[11.5px] leading-snug">
				{value ?? EMPTY_VALUE}
			</dd>
		</div>
	);
}

function StackedField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="px-2 py-1.5">
			<p className="font-medium text-[9px] text-[oklch(0.48_0.026_162)] leading-tight">
				{label}
			</p>
			<p className="mt-0.5 min-h-[14px] font-semibold text-[11px] leading-snug">
				{value ?? EMPTY_VALUE}
			</p>
		</div>
	);
}
