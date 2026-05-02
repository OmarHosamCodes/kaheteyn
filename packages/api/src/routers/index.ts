import { protectedProcedure, publicProcedure, router } from "../index";
import { auditRouter } from "./audit";
import { childrenRouter } from "./children";
import { dashboardRouter } from "./dashboard";
import { paymentsRouter } from "./payments";
import { receiptsRouter } from "./receipts";
import { seedRouter } from "./seed";
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
  receipts: receiptsRouter,
  audit: auditRouter,
  dashboard: dashboardRouter,
  seed: seedRouter,
});

export type AppRouter = typeof appRouter;
