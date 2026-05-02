import { db } from "@kaheteyn/db";
import { sponsor, child, payment } from "@kaheteyn/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { logAudit, makeId } from "../lib";

const sponsorInput = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().nullable().optional(),
  paymentMethod: z.enum(["bank_palestine", "palpay", "bank_transfer"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const sponsorsRouter = router({
  list: protectedProcedure.query(async () => {
    const sponsors = await db.select().from(sponsor).orderBy(desc(sponsor.createdAt));
    const childCounts = await db
      .select({ sponsorId: child.sponsorId, count: sql<number>`count(*)` })
      .from(child)
      .groupBy(child.sponsorId);
    const totals = await db
      .select({ sponsorId: payment.sponsorId, total: sql<number>`sum(${payment.amountUsd})` })
      .from(payment)
      .groupBy(payment.sponsorId);
    const ccMap = new Map(childCounts.map((c) => [c.sponsorId, c.count]));
    const tMap = new Map(totals.map((t) => [t.sponsorId, t.total]));
    return sponsors.map((s) => ({
      ...s,
      childrenCount: ccMap.get(s.id) ?? 0,
      totalDisbursedCents: tMap.get(s.id) ?? 0,
    }));
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [row] = await db.select().from(sponsor).where(eq(sponsor.id, input.id));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: protectedProcedure.input(sponsorInput).mutation(async ({ ctx, input }) => {
    const id = await makeId("SP-");
    const [row] = await db
      .insert(sponsor)
      .values({ ...input, id })
      .returning();
    await logAudit({
      actorId: ctx.session.user.id,
      actorName: ctx.session.user.name,
      entityType: "sponsor",
      entityId: id,
      action: "create",
      newValue: row,
    });
    return row;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: sponsorInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(sponsor).where(eq(sponsor.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await db
        .update(sponsor)
        .set(input.data)
        .where(eq(sponsor.id, input.id))
        .returning();
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "sponsor",
        entityId: input.id,
        action: "update",
        oldValue: old,
        newValue: row,
      });
      return row;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string(), force: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(sponsor).where(eq(sponsor.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const linkedPayments = await db
        .select({ id: payment.id })
        .from(payment)
        .where(eq(payment.sponsorId, input.id));
      if (linkedPayments.length > 0 && !input.force) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `لهذا الكفيل ${linkedPayments.length} دفعة. أكّد الحذف للمتابعة.`,
        });
      }
      // null out linked children & payments
      await db
        .update(child)
        .set({ sponsorId: null, sponsorshipStatus: "unsponsored" })
        .where(eq(child.sponsorId, input.id));
      await db.delete(payment).where(eq(payment.sponsorId, input.id));
      await db.delete(sponsor).where(eq(sponsor.id, input.id));
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "sponsor",
        entityId: input.id,
        action: "delete",
        oldValue: old,
      });
      return { ok: true };
    }),
});
