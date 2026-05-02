import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
    <div className="flex min-h-svh">
      <Sidebar userName={session?.user?.name ?? null} />
      <main className="flex-1 overflow-x-hidden p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
