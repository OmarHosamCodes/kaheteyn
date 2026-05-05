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
			className="pointer-events-none fixed top-0 left-0 -z-10 h-0 w-0 overflow-hidden bg-white text-black opacity-0 print:pointer-events-auto print:static print:z-auto print:h-auto print:w-auto print:overflow-visible print:opacity-100"
			data-child-cv-export="true"
			data-export-photo-ready={photoReady ? "true" : "false"}
			dir="rtl"
		>
			<style>
				{"@media print { @page { size: A4 portrait; margin: 12mm; } }"}
			</style>

			<div className="mx-auto flex min-h-[273mm] max-w-[190mm] flex-col text-[15px] leading-8">
				<div className="mb-4 h-1 w-full rounded-full bg-[#61b48c]" />
				<header className="pb-5">
					<h1 className="mb-6 text-center font-bold text-[26px]">{title}</h1>

					<div className="mb-3 flex items-center justify-between gap-5">
						<div className="rounded-[1.75rem] bg-zinc-500 px-6 py-3 font-semibold text-[36px] text-white leading-none tracking-tight">
							١/١
						</div>

						<div className="flex-1 text-center font-semibold text-[18px]">
							<span className="ms-2 font-bold">الجهة المنفذة:</span>
							مبادرة "كهاتين" لكفالة أبناء شهداء غزة
						</div>

						<img
							src="/logo.png"
							alt="كهاتين"
							className="h-20 w-auto shrink-0 object-contain"
						/>
					</div>

					<div className="border-zinc-700 border-b-[3px] pb-3 font-semibold text-[17px]">
						تاريخ فتح الملف:
						<span className="me-2 font-normal">
							{formatDate(child.createdAt)}
						</span>
					</div>
				</header>

				<div className="flex items-start gap-8">
					<aside className="w-[190px] shrink-0">
						<SectionTitle>صورة شخصية</SectionTitle>

						<div className="mt-4 border-[3px] border-zinc-500 bg-[#edf7f3] p-3">
							{child.photo ? (
								<canvas
									ref={photoCanvasRef}
									aria-label={child.fullName}
									data-export-photo="true"
									className="h-[222px] w-full object-cover"
								/>
							) : (
								<div className="flex h-[222px] flex-col items-center justify-center text-[#61b48c]">
									<ChildPlaceholderIcon />
									<span className="mt-2 font-medium text-[22px]">طفل</span>
								</div>
							)}
						</div>
					</aside>

					<div className="min-w-0 flex-1 space-y-8">
						<section>
							<SectionTitle>البيانات الشخصية</SectionTitle>

							<div className="mt-4 space-y-4">
								<LineField label="الاسم الكامل" value={child.fullName} />

								<div className="grid grid-cols-2 gap-x-8 gap-y-4">
									<LineField
										label="تاريخ الميلاد"
										value={formatDate(child.birthDate)}
									/>
									<LineField label="العمر" value={child.age} />
									<LineField label="الجنس" value={formatGender(child.gender)} />
									<LineField
										label="مكان الإقامة"
										value={child.residence}
										className="col-span-2"
									/>
									<LineField label="الحالة الصحية" value={child.healthStatus} />
									<LineField
										label="المرحلة الدراسية"
										value={child.schoolStage}
									/>
								</div>
							</div>
						</section>

						<section>
							<SectionTitle>البيانات العائلية</SectionTitle>

							<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
								<LineField label="اسم الأب" value={child.fatherName} />
								<LineField label="اسم الأم" value={child.motherName} />
								<LineField
									label="تاريخ وفاة الأب"
									value={formatDate(child.fatherDeathDate)}
								/>
								<LineField
									label="سبب وفاة الأب"
									value={child.fatherDeathCause}
								/>
								<LineField
									label="عدد الإخوة والأخوات"
									value={child.siblingsCount}
								/>
								<LineField label="الوصي الشرعي" value={child.guardianName} />
								<LineField label="صلة القرابة" value={child.guardianRelation} />
								<LineField label="رقم الهاتف" value={child.phone} />
								<LineField
									label="حساب البنك / المحفظة"
									value={child.guardianAccount}
									className="col-span-2"
								/>
							</div>
						</section>

						<section>
							<SectionTitle>الوضع المعيشي</SectionTitle>

							<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
								<LineField label="نوع السكن" value={EMPTY_VALUE} />
								<LineField label="مصادر الدخل" value={EMPTY_VALUE} />
								<LineField
									label="الاحتياجات الأساسية"
									value={EMPTY_VALUE}
									className="col-span-2"
								/>
							</div>
						</section>

						<section>
							<SectionTitle>تفاصيل الكفالة</SectionTitle>

							<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
								<LineField label="اسم الكافل" value={sponsor?.name} />
								<LineField label="بلد الكافل" value={EMPTY_VALUE} />
								<LineField
									label="قيمة الكفالة الشهرية"
									value={formatAmount(monthlyAmount)}
								/>
								<LineField
									label="مدة الكفالة"
									value={sponsor ? "مفتوحة" : EMPTY_VALUE}
								/>
								<LineField
									label="تاريخ بدء الكفالة"
									value={
										sponsorshipStartDate
											? formatDate(sponsorshipStartDate)
											: EMPTY_VALUE
									}
									className="col-span-2"
								/>
							</div>
						</section>

						<section>
							<SectionTitle>ملاحظات إضافية</SectionTitle>
							<div className="mt-4 min-h-24 whitespace-pre-wrap border-black border-b px-1 pb-2 text-[17px] leading-8">
								{child.notes ?? EMPTY_VALUE}
							</div>
						</section>
					</div>
				</div>

				<div className="mt-auto border-zinc-400 border-b border-dotted pt-10" />
			</div>
		</div>
	);
}

function SectionTitle({ children }: { children: ReactNode }) {
	return (
		<h2 className="inline-block border-black border-b pb-1 font-bold text-[18px] leading-none">
			{children}
		</h2>
	);
}

function LineField({
	label,
	value,
	className,
}: {
	label: string;
	value: ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<div className="flex items-end gap-3 text-[17px] leading-none">
				<span className="shrink-0 font-semibold">{label}:</span>
				<span className="min-w-0 flex-1 border-black border-b pb-1 text-center font-normal leading-tight">
					{value ?? EMPTY_VALUE}
				</span>
			</div>
		</div>
	);
}
