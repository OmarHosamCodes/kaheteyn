export function Logo({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {/* Vertical green + curved red accent */}
      <div className="relative h-8 w-8">
        <span className="absolute inset-y-0 start-1/2 -translate-x-1/2 w-1.5 rounded-full bg-[var(--brand-green)]" />
        <span className="absolute end-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[var(--brand-red)] border-t-transparent rotate-45" />
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-foreground">
        كهاتين
      </span>
    </div>
  );
}
