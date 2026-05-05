import { jsPDF } from "jspdf";
import { toast } from "sonner";

import arabicBoldFont from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import arabicRegularFont from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import { formatDate } from "@/lib/format";

type ExportChild = {
	id?: string | null;
	fullName: string;
	sponsorshipStatus?: string | null;
	createdAt?: Date | string | number | null;
	photo?: string | null;
	birthDate?: Date | string | number | null;
	age?: number | null;
	gender?: string | null;
	residence?: string | null;
	housingType?: string | null;
	incomeSources?: string | null;
	basicNeeds?: string | null;
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
	sponsorCountry?: string | null;
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
	monthKey?: string | null;
};

type Field = {
	label: string;
	value: string | number | null | undefined;
	wide?: boolean;
};

type Rgb = [number, number, number];

const EMPTY_VALUE = "";
const FONT_FAMILY = "IBMPlexSansArabic";
const LOGO_URL = "/logo.png";

const colors = {
	ink: [33, 33, 33] as Rgb,
	muted: [101, 101, 101] as Rgb,
	stone: [214, 214, 214] as Rgb,
	mist: [246, 247, 246] as Rgb,
	olive: [31, 150, 73] as Rgb,
	page: [253, 253, 252] as Rgb,
};

let fontPromise: Promise<void> | null = null;
let logoPromise: Promise<string> | null = null;

async function blobUrlToBase64(url: string) {
	const buffer = await fetch(url).then((res) => {
		if (!res.ok) throw new Error("Failed to load PDF asset");
		return res.arrayBuffer();
	});
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

async function ensureFontsLoaded() {
	fontPromise ??= Promise.all([
		blobUrlToBase64(arabicRegularFont),
		blobUrlToBase64(arabicBoldFont),
	]).then(([regular, bold]) => {
		(jsPDF.API as unknown as Record<string, unknown>).__kaheteynChildFonts = {
			regular,
			bold,
		};
	});
	return fontPromise;
}

async function ensureLogoLoaded() {
	logoPromise ??= blobUrlToBase64(LOGO_URL).then(
		(base64) => `data:image/png;base64,${base64}`,
	);
	return logoPromise;
}

function registerFonts(doc: jsPDF) {
	const fonts = (jsPDF.API as unknown as Record<string, unknown>)
		.__kaheteynChildFonts as { regular: string; bold: string } | undefined;
	if (!fonts) return;
	doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fonts.regular);
	doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fonts.bold);
	doc.addFont("IBMPlexSansArabic-Regular.ttf", FONT_FAMILY, "normal");
	doc.addFont("IBMPlexSansArabic-Bold.ttf", FONT_FAMILY, "bold");
}

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

function text(value: Field["value"]) {
	return value === null || value === undefined || value === ""
		? "-"
		: String(value);
}

function filenamePart(value: string) {
	return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "child";
}

function setFont(
	doc: jsPDF,
	style: "normal" | "bold",
	size: number,
	color: Rgb,
) {
	doc.setFont(FONT_FAMILY, style);
	doc.setFontSize(size);
	doc.setTextColor(...color);
}

function drawSectionTitle(
	doc: jsPDF,
	title: string,
	x: number,
	y: number,
	w: number,
) {
	doc.setFillColor(...colors.mist);
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.rect(x, y, w, 7, "FD");
	setFont(doc, "bold", 9, colors.ink);
	doc.text(title, x + w - 3, y + 4.8, { align: "right" });
}

function drawField(doc: jsPDF, field: Field, x: number, y: number, w: number) {
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.rect(x, y, w, 12);
	setFont(doc, "normal", 7, colors.muted);
	doc.text(field.label, x + w - 3, y + 4, { align: "right" });
	setFont(doc, "bold", 8.5, colors.ink);
	doc.text(text(field.value), x + w - 3, y + 9, {
		align: "right",
		maxWidth: w - 6,
	});
}

function drawFieldGrid(
	doc: jsPDF,
	title: string,
	fields: Field[],
	x: number,
	y: number,
	w: number,
) {
	drawSectionTitle(doc, title, x, y, w);
	const colW = w / 2;
	let cursorY = y + 9;
	let col = 0;

	for (const field of fields) {
		if (field.wide) {
			if (col === 1) {
				cursorY += 12;
				col = 0;
			}
			drawField(doc, field, x, cursorY, w);
			cursorY += 12;
			continue;
		}

		const fieldX = col === 0 ? x + colW : x;
		drawField(doc, field, fieldX, cursorY, colW);
		col += 1;
		if (col === 2) {
			col = 0;
			cursorY += 12;
		}
	}

	return cursorY + (col === 0 ? 4 : 16);
}

async function loadImage(src: string) {
	const image = new Image();
	image.decoding = "async";
	image.crossOrigin = "anonymous";
	image.src = src.startsWith("data:image/") ? src : await imageToDataUrl(src);
	await image.decode();
	return image;
}

async function imageToDataUrl(src: string) {
	const base64 = await blobUrlToBase64(src);
	return `data:image/png;base64,${base64}`;
}

async function imageToPdfThumbnail(src: string) {
	const image = await loadImage(src);
	const canvas = document.createElement("canvas");
	const targetWidth = 320;
	const scale = Math.min(1, targetWidth / image.naturalWidth);
	canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
	canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
	const context = canvas.getContext("2d", { alpha: false });
	if (!context) throw new Error("Could not prepare child photo");
	context.fillStyle = "#f6f7f6";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", 0.78);
}

async function drawPhoto(
	doc: jsPDF,
	child: ExportChild,
	x: number,
	y: number,
	w: number,
) {
	drawSectionTitle(doc, "الصورة الشخصية", x, y, w);
	doc.setFillColor(...colors.mist);
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.rect(x, y + 9, w, 55, "FD");

	if (child.photo) {
		try {
			const dataUrl = await imageToPdfThumbnail(child.photo);
			doc.addImage(
				dataUrl,
				"JPEG",
				x + 2,
				y + 11,
				w - 4,
				51,
				undefined,
				"FAST",
			);
			return;
		} catch {
			// Fall through to the printed placeholder if the browser cannot decode it.
		}
	}

	doc.setDrawColor(...colors.olive);
	doc.setLineWidth(0.3);
	doc.circle(x + w / 2, y + 27, 8, "S");
	doc.roundedRect(x + w / 2 - 14, y + 38, 28, 16, 2, 2, "S");
	setFont(doc, "bold", 11, colors.olive);
	doc.text("طفل", x + w / 2, y + 59, { align: "center" });
}

function drawStackedField(
	doc: jsPDF,
	field: Field,
	x: number,
	y: number,
	w: number,
) {
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.rect(x, y, w, 13);
	setFont(doc, "normal", 7, colors.muted);
	doc.text(field.label, x + w - 3, y + 4, { align: "right" });
	setFont(doc, "bold", 8, colors.ink);
	doc.text(text(field.value), x + w - 3, y + 9.3, {
		align: "right",
		maxWidth: w - 6,
	});
}

function drawSummary(
	doc: jsPDF,
	fields: Field[],
	x: number,
	y: number,
	w: number,
) {
	drawSectionTitle(doc, "ملخص الكفالة", x, y, w);
	let cursorY = y + 9;
	for (const field of fields) {
		drawStackedField(doc, field, x, cursorY, w);
		cursorY += 13;
	}
	return cursorY;
}

function drawHeader(
	doc: jsPDF,
	title: string,
	child: ExportChild,
	logoDataUrl: string,
) {
	const pageWidth = doc.internal.pageSize.getWidth();
	doc.setFillColor(...colors.page);
	doc.rect(0, 0, pageWidth, 30, "F");
	doc.addImage(logoDataUrl, "PNG", 14, 5, 44, 19);

	setFont(doc, "bold", 15, colors.ink);
	doc.text(title, pageWidth - 14, 13, { align: "right" });
	setFont(doc, "normal", 8.5, colors.muted);
	doc.text("مبادرة كهاتين لكفالة أبناء شهداء غزة", pageWidth - 14, 20, {
		align: "right",
	});
	doc.text(
		`تاريخ فتح الملف: ${formatDate(child.createdAt)}`,
		pageWidth - 14,
		25,
		{
			align: "right",
		},
	);

	doc.setDrawColor(...colors.olive);
	doc.setLineWidth(0.7);
	doc.line(14, 30, pageWidth - 14, 30);
}

function drawFooter(doc: jsPDF) {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
	setFont(doc, "normal", 8, colors.muted);
	doc.text("صفحة 1", pageWidth - 14, pageHeight - 8, { align: "right" });
	doc.text("Generated by Kaheteyn", 14, pageHeight - 8, { align: "left" });
}

export async function downloadChildCvPDF(
	child: ExportChild,
	sponsor: ExportSponsor,
	payments: ExportPayment[],
	sponsorshipDuration: string,
) {
	try {
		await ensureFontsLoaded();
		const logoDataUrl = await ensureLogoLoaded();
		const sponsorshipStartDate = getSponsorshipStartDate(payments);
		const monthlyAmount = payments[0]?.amountUsd ?? (sponsor ? 10_000 : null);
		const title =
			child.sponsorshipStatus === "sponsored"
				? "ملف يتيم مكفول"
				: "ملف يتيم غير مكفول";

		const doc = new jsPDF({
			orientation: "portrait",
			unit: "mm",
			format: "a4",
		});
		registerFonts(doc);
		doc.setLanguage("ar");
		doc.setR2L(false);
		doc.setFillColor(...colors.page);
		doc.rect(0, 0, 210, 297, "F");

		drawHeader(doc, title, child, logoDataUrl);
		await drawPhoto(doc, child, 14, 39, 42);
		drawSummary(
			doc,
			[
				{ label: "حالة الملف", value: title },
				{ label: "الكافل", value: sponsor?.name },
				{ label: "قيمة الكفالة", value: formatAmount(monthlyAmount) },
				{
					label: "تاريخ البدء",
					value: sponsorshipStartDate
						? formatDate(sponsorshipStartDate)
						: EMPTY_VALUE,
				},
			],
			14,
			108,
			42,
		);

		let y = 39;
		y = drawFieldGrid(
			doc,
			"البيانات الشخصية",
			[
				{ label: "الاسم الكامل", value: child.fullName, wide: true },
				{ label: "تاريخ الميلاد", value: formatDate(child.birthDate) },
				{ label: "العمر", value: child.age },
				{ label: "الجنس", value: formatGender(child.gender) },
				{ label: "مكان الإقامة", value: child.residence },
				{ label: "الحالة الصحية", value: child.healthStatus },
				{ label: "المرحلة الدراسية", value: child.schoolStage },
			],
			61,
			y,
			135,
		);

		y = drawFieldGrid(
			doc,
			"البيانات العائلية",
			[
				{ label: "اسم الأب", value: child.fatherName },
				{ label: "اسم الأم", value: child.motherName },
				{ label: "تاريخ وفاة الأب", value: formatDate(child.fatherDeathDate) },
				{ label: "سبب وفاة الأب", value: child.fatherDeathCause },
				{ label: "عدد الإخوة والأخوات", value: child.siblingsCount },
				{ label: "الوصي الشرعي", value: child.guardianName },
				{ label: "صلة القرابة", value: child.guardianRelation },
				{ label: "رقم الهاتف", value: child.phone },
				{
					label: "حساب البنك / المحفظة",
					value: child.guardianAccount,
					wide: true,
				},
			],
			61,
			y,
			135,
		);

		y = drawFieldGrid(
			doc,
			"الوضع المعيشي",
			[
				{ label: "نوع السكن", value: child.housingType },
				{ label: "مصادر الدخل", value: child.incomeSources },
				{ label: "الاحتياجات الأساسية", value: child.basicNeeds, wide: true },
			],
			61,
			y,
			135,
		);

		y = drawFieldGrid(
			doc,
			"تفاصيل الكفالة",
			[
				{ label: "اسم الكافل", value: sponsor?.name },
				{ label: "بلد الكافل", value: child.sponsorCountry },
				{ label: "قيمة الكفالة الشهرية", value: formatAmount(monthlyAmount) },
				{ label: "مدة الكفالة", value: sponsorshipDuration },
				{
					label: "تاريخ بدء الكفالة",
					value: sponsorshipStartDate
						? formatDate(sponsorshipStartDate)
						: EMPTY_VALUE,
					wide: true,
				},
			],
			61,
			y,
			135,
		);

		drawSectionTitle(doc, "ملاحظات إضافية", 61, y, 135);
		doc.setDrawColor(...colors.stone);
		doc.rect(61, y + 9, 135, 24);
		setFont(doc, "normal", 8.5, colors.ink);
		doc.text(text(child.notes), 193, y + 15, {
			align: "right",
			maxWidth: 129,
		});

		drawFooter(doc);
		doc.save(`${filenamePart(child.fullName)}.pdf`);
		toast.success("تم تصدير ملف PDF");
	} catch (error) {
		console.error(error);
		toast.error("تعذر تصدير ملف PDF");
	}
}
