import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const messages = [
	"جاري تحميل البيانات...",
	"جاري تجهيز السجلات...",
	"جاري المزامنة...",
	"جاري تجهيز الصفحة...",
];

export default function Loader() {
	const [msg, setMsg] = useState(messages[0]);

	useEffect(() => {
		let i = 0;
		const id = setInterval(() => {
			i = (i + 1) % messages.length;
			setMsg(messages[i]);
		}, 3000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="fade-in flex h-full animate-in flex-col items-center justify-center gap-3 pt-8 duration-300">
			<Loader2 className="size-6 animate-spin text-primary" />
			<p className="text-muted-foreground text-sm">{msg}</p>
		</div>
	);
}
