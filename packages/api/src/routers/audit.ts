import { db } from "@kaheteyn/db";
import { auditLog } from "@kaheteyn/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const auditRouter = router({
	list: protectedProcedure
		.input(
			z
				.object({
					entityType: z.string().optional(),
					actorId: z.string().optional(),
					action: z.string().optional(),
					fromMs: z.number().optional(),
					toMs: z.number().optional(),
					limit: z.number().int().min(1).max(500).default(200),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const filters = [] as ReturnType<typeof eq>[];
			if (input?.entityType)
				filters.push(eq(auditLog.entityType, input.entityType));
			if (input?.actorId) filters.push(eq(auditLog.actorId, input.actorId));
			if (input?.action) filters.push(eq(auditLog.action, input.action));
			if (input?.fromMs)
				filters.push(gte(auditLog.timestamp, new Date(input.fromMs)));
			if (input?.toMs)
				filters.push(lte(auditLog.timestamp, new Date(input.toMs)));
			const rows = await db
				.select()
				.from(auditLog)
				.where(filters.length ? and(...filters) : undefined)
				.orderBy(desc(auditLog.timestamp))
				.limit(input?.limit ?? 200);
			return rows;
		}),
});
