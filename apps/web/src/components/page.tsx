import * as React from "react";

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
        className="block text-xs font-medium text-foreground/80"
      >
        {label}
        {required ? <span className="text-destructive ms-0.5">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
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
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
        <p className="text-sm text-muted-foreground italic mt-2">
          يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ فَتَنقَلِبُوا خَاسِرِينَ
        </p>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 no-print">{actions}</div>
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
    <div className="rounded-lg border border-dashed py-12 text-center">
      {icon ? (
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
