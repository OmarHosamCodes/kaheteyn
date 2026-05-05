import * as React from "react";

interface FileUploadProps {
	value?: string | null;
	onChange: (dataUrl: string | null) => void;
	accept?: string;
	label?: string;
	className?: string;
}

const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export function FileUpload({
	value,
	onChange,
	accept = "image/*,application/pdf",
	label = "رفع ملف",
	className,
}: FileUploadProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [dragging, setDragging] = React.useState(false);

	function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_BYTES) {
			setError(
				`حجم الملف يجب ألا يتجاوز ${Math.round(MAX_BYTES / 1024 / 1024)} ميجابايت`,
			);
			return;
		}
		setError(null);
		const reader = new FileReader();
		reader.onload = () =>
			onChange(typeof reader.result === "string" ? reader.result : null);
		reader.readAsDataURL(file);
	}

	const isImage = value?.startsWith("data:image");
	const isPdf = value?.includes("application/pdf");

	return (
		<div className={className}>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				onChange={onSelect}
				className="hidden"
			/>
			{value ? (
				<div className="flex items-center gap-2">
					{isImage ? (
						<img
							src={value}
							alt=""
							className="zoom-in-95 h-16 w-16 animate-in rounded-md border object-cover duration-200"
						/>
					) : isPdf ? (
						<a
							href={value}
							target="_blank"
							rel="noreferrer"
							className="text-primary text-sm underline"
						>
							عرض الملف (PDF)
						</a>
					) : (
						<span className="text-muted-foreground text-sm">ملف مرفق</span>
					)}
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="text-primary text-xs underline"
					>
						استبدال
					</button>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="text-destructive text-xs underline"
					>
						إزالة
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					onDragEnter={() => setDragging(true)}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={() => setDragging(false)}
					className={`inline-flex h-9 items-center justify-center rounded-md border border-dashed bg-background px-3 text-muted-foreground text-sm transition-colors duration-150 ${
						dragging
							? "border-primary bg-primary/5 text-primary"
							: "border-input hover:bg-muted"
					}`}
				>
					{label}
				</button>
			)}
			{error ? <p className="mt-1 text-destructive text-xs">{error}</p> : null}
		</div>
	);
}
