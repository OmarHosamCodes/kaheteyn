import type * as React from "react";

export function Field({
	label,
	htmlFor,
	hint,
	error,
	required,
	children,
	className,
}: {
	label: string;
	htmlFor?: string;
	hint?: string;
	error?: string | null;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`space-y-1.5 ${className ?? ""}`}>
			<label
				htmlFor={htmlFor}
				className="block font-medium text-foreground/80 text-xs"
			>
				{label}
				{required ? <span className="ms-0.5 text-destructive">*</span> : null}
			</label>
			{children}
			{hint ? (
				<p className="text-[11px] text-muted-foreground">{hint}</p>
			) : null}
			{error ? <p className="text-[11px] text-destructive">{error}</p> : null}
		</div>
	);
}

export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: string;
	subtitle?: string;
	actions?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 className="font-bold text-2xl">{title}</h1>
				{subtitle ? (
					<p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>
				) : null}
				<p className="mt-2 text-muted-foreground text-sm italic">
					يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ
					فَتَنقَلِبُوا خَاسِرِينَ
				</p>
			</div>
			{actions ? (
				<div className="no-print flex items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}

export function EmptyState({
	title,
	description,
	icon,
	action,
}: {
	title: string;
	description?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="fade-in zoom-in-95 animate-in rounded-lg border border-dashed py-12 text-center duration-200">
			{icon ? (
				<div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
					{icon}
				</div>
			) : null}
			<p className="font-medium">{title}</p>
			{description ? (
				<p className="mt-1 text-muted-foreground text-sm">{description}</p>
			) : null}
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
