import { protectedProcedure, publicProcedure, router } from "../index";
import { adminsRouter } from "./admins";
import { auditRouter } from "./audit";
import { childrenRouter } from "./children";
import { dashboardRouter } from "./dashboard";
import { paymentsRouter } from "./payments";
import { sponsorsRouter } from "./sponsors";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "ok",
		user: ctx.session.user,
	})),
	children: childrenRouter,
	sponsors: sponsorsRouter,
	payments: paymentsRouter,
	audit: auditRouter,
	dashboard: dashboardRouter,
	admins: adminsRouter,
});

export type AppRouter = typeof appRouter;
