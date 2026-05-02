import { db } from "@kaheteyn/db";
import { receipt, payment, child, sponsor } from "@kaheteyn/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { logAudit, makeId } from "../lib";

const receiptInput = z.object({
  paymentId: z.string().min(1),
  document: z.string().nullable().optional(),
  dateReceived: z.number().int(),
  notes: z.string().nullable().optional(),
});

export const receiptsRouter = router({
  list: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        receipt,
        paymentMonth: payment.monthLabel,
        amountUsd: payment.amountUsd,
        childName: child.fullName,
        sponsorName: sponsor.name,
      })
      .from(receipt)
      .leftJoin(payment, eq(payment.id, receipt.paymentId))
      .leftJoin(child, eq(child.id, payment.childId))
      .leftJoin(sponsor, eq(sponsor.id, payment.sponsorId))
      .orderBy(desc(receipt.dateReceived));
    return rows.map((r) => ({
      ...r.receipt,
      paymentMonth: r.paymentMonth ?? "",
      amountUsd: r.amountUsd ?? 0,
      childName: r.childName ?? "—",
      sponsorName: r.sponsorName ?? "—",
    }));
  }),

  byPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(receipt)
        .where(eq(receipt.paymentId, input.paymentId));
      return rows;
    }),

  create: protectedProcedure.input(receiptInput).mutation(async ({ ctx, input }) => {
    const [p] = await db.select().from(payment).where(eq(payment.id, input.paymentId));
    if (!p) throw new TRPCError({ code: "BAD_REQUEST", message: "الدفعة غير موجودة" });
    const id = await makeId("REC-");
    const [row] = await db
      .insert(receipt)
      .values({ ...input, id, dateReceived: new Date(input.dateReceived) })
      .returning();
    await logAudit({
      actorId: ctx.session.user.id,
      actorName: ctx.session.user.name,
      entityType: "receipt",
      entityId: id,
      action: "create",
      newValue: row,
    });
    return row;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: receiptInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(receipt).where(eq(receipt.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const data: Record<string, unknown> = { ...input.data };
      if (typeof input.data.dateReceived === "number") {
        data.dateReceived = new Date(input.data.dateReceived);
      }
      const [row] = await db
        .update(receipt)
        .set(data as never)
        .where(eq(receipt.id, input.id))
        .returning();
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "receipt",
        entityId: input.id,
        action: "update",
        oldValue: old,
        newValue: row,
      });
      return row;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(receipt).where(eq(receipt.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      await db.delete(receipt).where(eq(receipt.id, input.id));
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "receipt",
        entityId: input.id,
        action: "delete",
        oldValue: old,
      });
      return { ok: true };
    }),
});
