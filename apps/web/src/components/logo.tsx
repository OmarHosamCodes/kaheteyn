export function Logo({ className }: { className?: string }) {
	return (
		<img src="/logo.png" alt="كهاتين" className={`h-8 ${className ?? ""}`} />
	);
}
