import { cn } from "@kaheteyn/ui/lib/utils";
import type * as React from "react";

type Variant =
	| "default"
	| "success"
	| "warning"
	| "destructive"
	| "info"
	| "outline";

const styles: Record<Variant, string> = {
	default: "border-secondary bg-secondary text-secondary-foreground",
	success:
		"border-[color:oklch(0.54_0.14_149_/_0.28)] bg-[oklch(0.54_0.14_149_/_0.13)] text-[oklch(0.34_0.1_149)] dark:text-[oklch(0.82_0.1_149)]",
	warning:
		"border-[color:oklch(0.68_0.15_73_/_0.32)] bg-[oklch(0.68_0.15_73_/_0.15)] text-[oklch(0.42_0.1_73)] dark:text-[oklch(0.86_0.1_73)]",
	destructive:
		"border-[color:oklch(0.56_0.21_27_/_0.3)] bg-[oklch(0.56_0.21_27_/_0.12)] text-[oklch(0.42_0.17_27)] dark:text-[oklch(0.82_0.12_27)]",
	info: "border-[color:oklch(0.56_0.11_205_/_0.3)] bg-[oklch(0.56_0.11_205_/_0.13)] text-[oklch(0.36_0.085_205)] dark:text-[oklch(0.82_0.08_205)]",
	outline: "border-border bg-card text-muted-foreground",
};

export function Badge({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"span"> & { variant?: Variant }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold text-xs",
				styles[variant],
				className,
			)}
			{...props}
		/>
	);
}
