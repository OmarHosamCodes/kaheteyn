import { db } from "@kaheteyn/db";
import { payment, child, sponsor } from "@kaheteyn/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { logAudit, makeId } from "../lib";

// Receipts may be either an http(s) URL or a base64-encoded image data URL.
// Reject `javascript:` and other unsafe schemes.
const receiptUrl = z
  .string()
  .max(8 * 1024 * 1024) // ~8MB cap on stored string
  .refine(
    (s) =>
      /^https?:\/\//i.test(s) ||
      /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(s),
    { message: "يجب أن يكون رابط http(s) أو صورة" },
  );

const paymentInput = z.object({
  childId: z.string().min(1),
  sponsorId: z.string().min(1),
  monthLabel: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  amountUsd: z.number().int().min(1, "المبلغ مطلوب"), // cents
  dateSent: z.number().int(),
  paymentStatus: z.enum(["paid", "pending", "late"]).default("pending"),
  financialStatus: z.enum(["sent", "confirmed", "rejected"]).default("sent"),
  acknowledgmentReceipt: receiptUrl.nullable().optional(),
  transferReceipt: receiptUrl.nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const paymentsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          monthKey: z.string().optional(),
          sponsorId: z.string().optional(),
          childId: z.string().optional(),
          paymentStatus: z.string().optional(),
          financialStatus: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filters = [] as ReturnType<typeof eq>[];
      if (input?.monthKey) filters.push(eq(payment.monthKey, input.monthKey));
      if (input?.sponsorId) filters.push(eq(payment.sponsorId, input.sponsorId));
      if (input?.childId) filters.push(eq(payment.childId, input.childId));
      if (input?.paymentStatus) filters.push(eq(payment.paymentStatus, input.paymentStatus));
      if (input?.financialStatus) filters.push(eq(payment.financialStatus, input.financialStatus));

      const rows = await db
        .select({
          payment,
          childName: child.fullName,
          sponsorName: sponsor.name,
        })
        .from(payment)
        .leftJoin(child, eq(child.id, payment.childId))
        .leftJoin(sponsor, eq(sponsor.id, payment.sponsorId))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(payment.dateSent));

      // Attach receipt info
      return rows.map((r) => ({
        ...r.payment,
        childName: r.childName ?? "—",
        sponsorName: r.sponsorName ?? "—",
      }));
    }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [row] = await db.select().from(payment).where(eq(payment.id, input.id));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: protectedProcedure.input(paymentInput).mutation(async ({ ctx, input }) => {
    const [c] = await db.select().from(child).where(eq(child.id, input.childId));
    if (!c) throw new TRPCError({ code: "BAD_REQUEST", message: "الطفل غير موجود" });
    const [s] = await db.select().from(sponsor).where(eq(sponsor.id, input.sponsorId));
    if (!s) throw new TRPCError({ code: "BAD_REQUEST", message: "الكفيل غير موجود" });

    const id = await makeId("PAY-");
    const [row] = await db
      .insert(payment)
      .values({
        ...input,
        id,
        dateSent: new Date(input.dateSent),
      })
      .returning();
    // sync child sponsorship if not already
    if (c.sponsorshipStatus !== "sponsored" || c.sponsorId !== input.sponsorId) {
      await db
        .update(child)
        .set({ sponsorshipStatus: "sponsored", sponsorId: input.sponsorId })
        .where(eq(child.id, input.childId));
    }
    await logAudit({
      actorId: ctx.session.user.id,
      actorName: ctx.session.user.name,
      entityType: "payment",
      entityId: id,
      action: "create",
      newValue: row,
    });
    return row;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: paymentInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(payment).where(eq(payment.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const data: Record<string, unknown> = { ...input.data };
      if (typeof input.data.dateSent === "number") {
        data.dateSent = new Date(input.data.dateSent);
      }
      const [row] = await db
        .update(payment)
        .set(data as never)
        .where(eq(payment.id, input.id))
        .returning();
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "payment",
        entityId: input.id,
        action: "update",
        oldValue: old,
        newValue: row,
      });
      return row;
    }),

  setFinancial: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(["sent", "confirmed", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(payment).where(eq(payment.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await db
        .update(payment)
        .set({
          financialStatus: input.status,
          paymentStatus:
            input.status === "confirmed"
              ? "paid"
              : input.status === "rejected"
                ? "late"
                : old.paymentStatus,
        })
        .where(eq(payment.id, input.id))
        .returning();
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "payment",
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
      const [old] = await db.select().from(payment).where(eq(payment.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      await db.delete(payment).where(eq(payment.id, input.id));
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "payment",
        entityId: input.id,
        action: "delete",
        oldValue: old,
      });
      return { ok: true };
    }),

  monthlyTrend: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        monthKey: payment.monthKey,
        total: sql<number>`sum(${payment.amountUsd})`,
        count: sql<number>`count(*)`,
      })
      .from(payment)
      .groupBy(payment.monthKey)
      .orderBy(payment.monthKey);
    return rows;
  }),
});
