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

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`حجم الملف يجب ألا يتجاوز ${Math.round(MAX_BYTES / 1024 / 1024)} ميجابايت`);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
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
              className="h-16 w-16 rounded-md object-cover border"
            />
          ) : isPdf ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline text-primary"
            >
              عرض الملف (PDF)
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">ملف مرفق</span>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-primary underline"
          >
            استبدال
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-destructive underline"
          >
            إزالة
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center justify-center rounded-md border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          {label}
        </button>
      )}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
