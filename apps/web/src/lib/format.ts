export const ARABIC_MONTHS = [
	"يناير",
	"فبراير",
	"مارس",
	"أبريل",
	"مايو",
	"يونيو",
	"يوليو",
	"أغسطس",
	"سبتمبر",
	"أكتوبر",
	"نوفمبر",
	"ديسمبر",
];

export function monthLabelFromKey(key: string) {
	// YYYY-MM
	const [y, m] = key.split("-").map(Number);
	if (!y || !m) return key;
	return `${ARABIC_MONTHS[m - 1]} ${y}`;
}

export function currentMonthKey(d: Date = new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatUSD(cents: number) {
	const v = (cents ?? 0) / 100;
	return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(d: Date | string | number | null | undefined) {
	if (!d) return "—";
	const date = new Date(d);
	if (Number.isNaN(date.getTime())) return "—";
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}/${date.getFullYear()}`;
}

export function formatDateTime(d: Date | string | number | null | undefined) {
	if (!d) return "—";
	const date = new Date(d);
	const time = date.toLocaleTimeString("ar-EG", {
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${formatDate(date)} ${time}`;
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
	bank_palestine: "بنك فلسطين",
	palpay: "بال بي",
	bank_transfer: "تحويل بنكي",
};

export const SCHOOL_STAGES = [
	"روضة",
	"ابتدائي",
	"إعدادي",
	"ثانوي",
	"جامعي",
	"غير ملتحق",
];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
	paid: "مدفوع",
	pending: "انتظار",
	late: "متأخر",
};

export const FINANCIAL_STATUS_LABEL: Record<string, string> = {
	sent: "مرسلة",
	confirmed: "مؤكدة",
	rejected: "مرفوضة",
};

export const SPONSORSHIP_STATUS_LABEL: Record<string, string> = {
	sponsored: "مكفول",
	unsponsored: "غير مكفول",
};
