import { db } from "@kaheteyn/db";
import { child, sponsor, payment } from "@kaheteyn/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, like, or, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { logAudit, makeId } from "../lib";

const childInput = z.object({
  fullName: z.string().min(1, "الاسم مطلوب"),
  age: z.number().int().min(0).max(40).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  residence: z.string().nullable().optional(),
  healthStatus: z.string().nullable().optional(),
  schoolStage: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  fatherDeathDate: z.string().nullable().optional(),
  fatherDeathCause: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  siblingsCount: z.number().int().min(0).nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianRelation: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  guardianAccount: z.string().nullable().optional(),
  sponsorshipStatus: z.enum(["sponsored", "unsponsored"]).default("unsponsored"),
  sponsorId: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  birthCertificate: z.string().nullable().optional(),
  guardianIdPhoto: z.string().nullable().optional(),
  guardianshipCertificate: z.string().nullable().optional(),
  deathCertificate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const childrenRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["sponsored", "unsponsored", "all"]).optional(),
          residence: z.string().optional(),
          schoolStage: z.string().optional(),
          sponsorId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filters: ReturnType<typeof eq>[] = [];
      if (input?.status && input.status !== "all") {
        filters.push(eq(child.sponsorshipStatus, input.status));
      }
      if (input?.residence) filters.push(eq(child.residence, input.residence));
      if (input?.schoolStage) filters.push(eq(child.schoolStage, input.schoolStage));
      if (input?.sponsorId) filters.push(eq(child.sponsorId, input.sponsorId));
      if (input?.search) {
        const q = `%${input.search}%`;
        filters.push(
          or(like(child.fullName, q), like(child.id, q), like(child.guardianName, q)) as never,
        );
      }
      const rows = await db
        .select()
        .from(child)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(child.createdAt));
      return rows;
    }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [row] = await db.select().from(child).where(eq(child.id, input.id));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: protectedProcedure.input(childInput).mutation(async ({ ctx, input }) => {
    if (input.sponsorshipStatus === "sponsored" && !input.sponsorId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "يجب اختيار كفيل عند تعيين الحالة كمكفول",
      });
    }
    if (input.sponsorId) {
      const [s] = await db.select().from(sponsor).where(eq(sponsor.id, input.sponsorId));
      if (!s) throw new TRPCError({ code: "BAD_REQUEST", message: "الكفيل غير موجود" });
    }
    const id = await makeId("CH-");
    const [row] = await db
      .insert(child)
      .values({ ...input, id })
      .returning();
    await logAudit({
      actorId: ctx.session.user.id,
      actorName: ctx.session.user.name,
      entityType: "child",
      entityId: id,
      action: "create",
      newValue: row,
    });
    return row;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: childInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [old] = await db.select().from(child).where(eq(child.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      const merged = { ...old, ...input.data };
      if (merged.sponsorshipStatus === "sponsored" && !merged.sponsorId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يجب اختيار كفيل" });
      }
      if (input.data.sponsorId) {
        const [s] = await db.select().from(sponsor).where(eq(sponsor.id, input.data.sponsorId));
        if (!s) throw new TRPCError({ code: "BAD_REQUEST", message: "الكفيل غير موجود" });
      }
      const [row] = await db
        .update(child)
        .set(input.data)
        .where(eq(child.id, input.id))
        .returning();
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "child",
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
      const [old] = await db.select().from(child).where(eq(child.id, input.id));
      if (!old) throw new TRPCError({ code: "NOT_FOUND" });
      // detach payments? warn only via UI; here cascade-delete payments
      await db.delete(payment).where(eq(payment.childId, input.id));
      await db.delete(child).where(eq(child.id, input.id));
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "child",
        entityId: input.id,
        action: "delete",
        oldValue: old,
      });
      return { ok: true };
    }),

  restore: protectedProcedure
    .input(z.object({ data: childInput.extend({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const [exists] = await db.select().from(child).where(eq(child.id, input.data.id));
      if (exists) {
        await db.update(child).set(input.data).where(eq(child.id, input.data.id));
      } else {
        await db.insert(child).values(input.data);
      }
      await logAudit({
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        entityType: "child",
        entityId: input.data.id,
        action: "create",
        newValue: input.data,
      });
      return { ok: true };
    }),
});
