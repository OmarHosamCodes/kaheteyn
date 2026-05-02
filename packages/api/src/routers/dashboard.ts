import { db } from "@kaheteyn/db";
import { child, payment, receipt, sponsor } from "@kaheteyn/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

const DAY = 24 * 60 * 60 * 1000;

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const dashboardRouter = router({
  summary: protectedProcedure.query(async () => {
    const monthKey = currentMonthKey();
    const [{ count: totalChildren }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(child);
    const [{ count: sponsoredCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(child)
      .where(eq(child.sponsorshipStatus, "sponsored"));
    const [{ count: sponsorsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sponsor);
    // Payments awaiting receipt
    const allPayments = await db.select().from(payment);
    const allReceipts = await db.select({ paymentId: receipt.paymentId }).from(receipt);
    const receiptSet = new Set(allReceipts.map((r) => r.paymentId));
    const awaitingReceipts = allPayments.filter((p) => !receiptSet.has(p.id)).length;
    const monthTotal = allPayments
      .filter((p) => p.monthKey === monthKey)
      .reduce((acc, p) => acc + p.amountUsd, 0);

    return {
      totalChildren: Number(totalChildren),
      sponsored: Number(sponsoredCount),
      unsponsored: Number(totalChildren) - Number(sponsoredCount),
      sponsorsCount: Number(sponsorsCount),
      awaitingReceipts,
      monthTotalCents: monthTotal,
      monthKey,
    };
  }),

  latestPayments: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        payment,
        childName: child.fullName,
        sponsorName: sponsor.name,
      })
      .from(payment)
      .leftJoin(child, eq(child.id, payment.childId))
      .leftJoin(sponsor, eq(sponsor.id, payment.sponsorId))
      .orderBy(desc(payment.dateSent))
      .limit(8);
    return rows.map((r) => ({
      ...r.payment,
      childName: r.childName ?? "—",
      sponsorName: r.sponsorName ?? "—",
    }));
  }),

  latestReceipts: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        receipt,
        childName: child.fullName,
        amountUsd: payment.amountUsd,
        monthLabel: payment.monthLabel,
      })
      .from(receipt)
      .leftJoin(payment, eq(payment.id, receipt.paymentId))
      .leftJoin(child, eq(child.id, payment.childId))
      .orderBy(desc(receipt.dateReceived))
      .limit(8);
    return rows.map((r) => ({
      ...r.receipt,
      childName: r.childName ?? "—",
      amountUsd: r.amountUsd ?? 0,
      monthLabel: r.monthLabel ?? "",
    }));
  }),

  readyToDisburse: protectedProcedure.query(async () => {
    const monthKey = currentMonthKey();
    const sponsored = await db
      .select()
      .from(child)
      .where(eq(child.sponsorshipStatus, "sponsored"));
    const monthPayments = await db
      .select({ childId: payment.childId })
      .from(payment)
      .where(eq(payment.monthKey, monthKey));
    const paidSet = new Set(monthPayments.map((p) => p.childId));
    return sponsored.filter((c) => !paidSet.has(c.id));
  }),

  alerts: protectedProcedure.query(async () => {
    const now = Date.now();
    const monthKey = currentMonthKey();
    const alerts: {
      severity: "critical" | "warning" | "info";
      title: string;
      detail?: string;
      entityType?: string;
      entityId?: string;
    }[] = [];

    // Sponsored children with no payment in current OR previous month
    const sponsoredChildren = await db
      .select()
      .from(child)
      .where(eq(child.sponsorshipStatus, "sponsored"));
    const allPayments = await db.select().from(payment);
    const byChild = new Map<string, typeof allPayments>();
    for (const p of allPayments) {
      const arr = byChild.get(p.childId) ?? [];
      arr.push(p);
      byChild.set(p.childId, arr);
    }
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthKey = currentMonthKey(prevMonthDate);

    for (const c of sponsoredChildren) {
      const ps = byChild.get(c.id) ?? [];
      const hasCurrent = ps.some((p) => p.monthKey === monthKey);
      const hasPrev = ps.some((p) => p.monthKey === prevMonthKey);
      if (!hasCurrent && !hasPrev) {
        alerts.push({
          severity: "critical",
          title: `لا توجد دفعة لشهرين أو أكثر`,
          detail: `الطفل ${c.fullName} (${c.id})`,
          entityType: "child",
          entityId: c.id,
        });
      } else if (!hasCurrent) {
        alerts.push({
          severity: "info",
          title: `لم تُرسل دفعة هذا الشهر`,
          detail: `الطفل ${c.fullName} (${c.id})`,
          entityType: "child",
          entityId: c.id,
        });
      }
    }

    // Payments missing receipts
    const allReceipts = await db.select({ paymentId: receipt.paymentId }).from(receipt);
    const receiptSet = new Set(allReceipts.map((r) => r.paymentId));
    for (const p of allPayments) {
      if (receiptSet.has(p.id)) continue;
      const age = now - new Date(p.dateSent).getTime();
      if (age > 3 * DAY) {
        alerts.push({
          severity: "critical",
          title: `إقرار استلام مفقود لأكثر من 3 أيام`,
          detail: `الدفعة ${p.id}`,
          entityType: "payment",
          entityId: p.id,
        });
      } else {
        alerts.push({
          severity: "warning",
          title: `دفعة بدون إقرار استلام`,
          detail: `الدفعة ${p.id}`,
          entityType: "payment",
          entityId: p.id,
        });
      }
    }
    return alerts;
  }),

  followUp: protectedProcedure.query(async () => {
    const monthKey = currentMonthKey();
    const unsponsored = await db
      .select()
      .from(child)
      .where(eq(child.sponsorshipStatus, "unsponsored"));
    const sponsored = await db
      .select()
      .from(child)
      .where(eq(child.sponsorshipStatus, "sponsored"));
    const monthPayments = await db
      .select({ childId: payment.childId })
      .from(payment)
      .where(eq(payment.monthKey, monthKey));
    const paidSet = new Set(monthPayments.map((p) => p.childId));
    const noPaymentThisMonth = sponsored.filter((c) => !paidSet.has(c.id));

    const allPayments = await db.select().from(payment);
    const allReceipts = await db.select({ paymentId: receipt.paymentId }).from(receipt);
    const receiptSet = new Set(allReceipts.map((r) => r.paymentId));
    const paymentsWithoutReceipts = allPayments.filter((p) => !receiptSet.has(p.id));

    const allChildren = await db.select().from(child);
    const incompleteProfiles = allChildren.filter((c) => {
      return (
        !c.photo || !c.birthCertificate || !c.guardianName || !c.phone || !c.residence
      );
    });
    return {
      unsponsored,
      noPaymentThisMonth,
      paymentsWithoutReceipts,
      incompleteProfiles,
    };
  }),

  monthlyReport: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return null;
  }),
});

export const _kept = { and };
