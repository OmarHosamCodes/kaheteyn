import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import { toast } from "sonner";

import arabicBoldFont from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import arabicRegularFont from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";

type PdfCell = string | number | null | undefined;
type Rgb = [number, number, number];

export type PdfColumn<T> = {
	label: string;
	getValue: (row: T) => PdfCell;
	align?: "left" | "center" | "right";
	width?: number;
};

export type PdfExportOptions<T> = {
	filename: string;
	title: string;
	subtitle?: string;
	rows: T[];
	columns: PdfColumn<T>[];
	summary?: { label: string; value: PdfCell }[];
};

const FONT_FAMILY = "IBMPlexSansArabic";
const ORGANIZATION_NAME = "كهاتين للأعمال الخيرية";

const colors: Record<string, Rgb> = {
	ink: [33, 33, 33],
	muted: [101, 101, 101],
	stone: [214, 214, 214],
	mist: [246, 247, 246],
	olive: [31, 150, 73],
	page: [253, 253, 252],
};

let fontPromise: Promise<void> | null = null;
const registeredDocs = new WeakSet<jsPDF>();

async function blobUrlToBase64(url: string) {
	const buffer = await fetch(url).then((res) => {
		if (!res.ok) throw new Error("Failed to load PDF font");
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
		(jsPDF.API as unknown as Record<string, unknown>).__kaheteynArabicFonts = {
			regular,
			bold,
		};
	});
	return fontPromise;
}

function registerFonts(doc: jsPDF) {
	if (registeredDocs.has(doc)) return;
	const fonts = (jsPDF.API as unknown as Record<string, unknown>)
		.__kaheteynArabicFonts as { regular: string; bold: string } | undefined;
	if (!fonts) return;
	doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fonts.regular);
	doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fonts.bold);
	doc.addFont("IBMPlexSansArabic-Regular.ttf", FONT_FAMILY, "normal");
	doc.addFont("IBMPlexSansArabic-Bold.ttf", FONT_FAMILY, "bold");
	registeredDocs.add(doc);
}

function rtl(value: PdfCell) {
	const text =
		value === null || value === undefined || value === "" ? "-" : String(value);
	return text;
}

function ltr(value: PdfCell) {
	return value === null || value === undefined || value === ""
		? "-"
		: String(value);
}

function todaySlug() {
	return new Date().toISOString().slice(0, 10);
}

function drawHeader(doc: jsPDF, options: PdfExportOptions<unknown>) {
	const pageWidth = doc.internal.pageSize.getWidth();
	doc.setFillColor(...colors.page);
	doc.rect(0, 0, pageWidth, 30, "F");
	doc.setDrawColor(...colors.olive);
	doc.setLineWidth(0.7);
	doc.line(14, 29, pageWidth - 14, 29);

	doc.setFont(FONT_FAMILY, "bold");
	doc.setFontSize(15);
	doc.setTextColor(...colors.ink);
	doc.text(rtl(options.title), pageWidth - 14, 14, { align: "right" });

	doc.setFont(FONT_FAMILY, "normal");
	doc.setFontSize(9);
	doc.setTextColor(...colors.muted);
	doc.text(rtl(ORGANIZATION_NAME), 14, 12, { align: "left" });
	if (options.subtitle) {
		doc.text(rtl(options.subtitle), pageWidth - 14, 22, {
			align: "right",
		});
	}
}

function drawFooter(doc: jsPDF) {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const pageNumber = doc.getCurrentPageInfo().pageNumber;
	doc.setDrawColor(...colors.stone);
	doc.setLineWidth(0.2);
	doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
	doc.setFont(FONT_FAMILY, "normal");
	doc.setFontSize(8);
	doc.setTextColor(...colors.muted);
	doc.text(rtl(`صفحة ${pageNumber}`), pageWidth - 14, pageHeight - 8, {
		align: "right",
	});
	doc.text(
		`Generated ${new Date().toLocaleString("en-GB")}`,
		14,
		pageHeight - 8,
		{
			align: "left",
		},
	);
}

export async function downloadPDF<T>(options: PdfExportOptions<T>) {
	if (options.rows.length === 0) {
		toast.warning("لا توجد بيانات للتصدير");
		return;
	}

	try {
		await ensureFontsLoaded();
		const doc = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "a4",
		});
		registerFonts(doc);
		doc.setLanguage("ar");
		doc.setR2L(false);

		const columns = [...options.columns].reverse();
		const head = [columns.map((column) => rtl(column.label))];
		const body = options.rows.map((row) =>
			columns.map((column) => ltr(column.getValue(row))),
		);
		const summary =
			options.summary?.filter((item) => item.value !== undefined) ?? [];
		const foot = summary.length
			? [summary.map((item) => `${ltr(item.value)}  ${rtl(item.label)}`)]
			: undefined;

		autoTable(doc, {
			head,
			body,
			foot,
			startY: 38,
			margin: { top: 38, right: 14, bottom: 20, left: 14 },
			theme: "grid",
			showHead: "everyPage",
			showFoot: "lastPage",
			tableLineColor: colors.stone,
			tableLineWidth: 0.1,
			styles: {
				font: FONT_FAMILY,
				fontSize: 7.5,
				cellPadding: { top: 2.2, right: 1.8, bottom: 2.2, left: 1.8 },
				lineColor: colors.stone,
				lineWidth: 0.1,
				textColor: colors.ink,
				valign: "middle",
				halign: "left",
				overflow: "linebreak",
			},
			headStyles: {
				fillColor: colors.mist,
				fontStyle: "bold",
				textColor: colors.ink,
				halign: "right",
			},
			alternateRowStyles: { fillColor: [250, 250, 249] },
			footStyles: {
				fillColor: colors.page,
				fontStyle: "bold",
				textColor: colors.ink,
				halign: "right",
			},
			didParseCell: (data: CellHookData) => {
				if (data.section === "body") {
					const column = columns[data.column.index];
					data.cell.styles.halign = column?.align ?? "left";
				}
			},
			willDrawPage: () => drawHeader(doc, options as PdfExportOptions<unknown>),
			didDrawPage: () => drawFooter(doc),
		});

		doc.save(
			options.filename.endsWith(".pdf")
				? options.filename
				: `${options.filename}.pdf`,
		);
		toast.success("تم تصدير ملف PDF");
	} catch (error) {
		console.error(error);
		toast.error("تعذر تصدير ملف PDF");
	}
}

export function pdfDateSlug() {
	return todaySlug();
}
