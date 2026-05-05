import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Sidebar } from "@/components/sidebar";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) throw redirect({ to: "/login" });
		return { session };
	},
	component: AppLayout,
});

function AppLayout() {
	const { session } = Route.useRouteContext();
	return (
		<div className="flex min-h-svh bg-[radial-gradient(circle_at_85%_8%,oklch(0.925_0.035_145_/_0.9),transparent_28rem),linear-gradient(180deg,oklch(0.985_0.011_100),oklch(0.955_0.014_100))]">
			<Sidebar userName={session?.user?.name ?? null} />
			<main className="flex-1 overflow-x-hidden px-4 py-5 md:px-7 md:py-6">
				<Outlet />
			</main>
		</div>
	);
}
