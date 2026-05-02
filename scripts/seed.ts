/**
 * Idempotent seed script for Kaheteyn.
 *
 * Run with:  bun seed
 *
 * Seeds (only when missing):
 *   - Admin user (admin / 123456) hashed via Better Auth
 *   - 3 sponsors, 3 children, 1 payment
 */

import { auth } from "@kaheteyn/auth";
import { db } from "@kaheteyn/db";
import { auditLog, child, payment, sponsor, user } from "@kaheteyn/db/schema";
import { eq, sql } from "drizzle-orm";

async function makeId(
  prefix: "CH-" | "SP-" | "PAY-" | "REC-" | "AUD-",
): Promise<string> {
  const padLen = prefix === "CH-" ? 4 : prefix === "SP-" ? 3 : 6;
  const table =
    prefix === "CH-"
      ? "child"
      : prefix === "SP-"
        ? "sponsor"
        : prefix === "PAY-"
          ? "payment"
          : prefix === "REC-"
            ? "receipt"
            : "audit_log";
  const result = await db.all<{ id: string }>(
    sql.raw(
      `SELECT id FROM ${table} WHERE id LIKE '${prefix}%' ORDER BY id DESC LIMIT 1`,
    ),
  );
  const last = result[0]?.id;
  let n = 0;
  if (last) {
    const parsed = Number(last.slice(prefix.length));
    if (Number.isFinite(parsed)) n = parsed;
  }
  return `${prefix}${String(n + 1).padStart(padLen, "0")}`;
}

async function ensureAdmin() {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.username, "admin"))
    .limit(1);
  if (existing) {
    console.log("• Admin user already exists — skipping.");
    return;
  }
  await auth.api.signUpEmail({
    body: {
      email: "admin@kaheteyn.local",
      password: "123456",
      name: "المدير العام",
      // @ts-expect-error - username plugin extends body
      username: "admin",
      displayUsername: "admin",
    },
  });
  console.log("✓ Admin user created (admin / 123456).");
}

async function ensureDemoData() {
  const [hasChild] = await db.select({ id: child.id }).from(child).limit(1);
  if (hasChild) {
    console.log("• Demo data already present — skipping.");
    return;
  }

  const sp1Id = await makeId("SP-");
  await db.insert(sponsor).values({
    id: sp1Id,
    name: "أحمد عبدالله",
    phone: "+970-59-1234567",
    paymentMethod: "bank_palestine",
    notes: "كفيل منتظم",
  });
  const sp2Id = await makeId("SP-");
  await db.insert(sponsor).values({
    id: sp2Id,
    name: "جمعية أصدقاء غزة",
    phone: "+970-8-2233445",
    paymentMethod: "bank_transfer",
    notes: "منظمة خيرية",
  });
  const sp3Id = await makeId("SP-");
  await db.insert(sponsor).values({
    id: sp3Id,
    name: "سامية الحسيني",
    phone: "+970-59-7654321",
    paymentMethod: "palpay",
  });

  const ch1Id = await makeId("CH-");
  await db.insert(child).values({
    id: ch1Id,
    fullName: "يوسف علاء",
    age: 9,
    birthDate: "2016-03-12",
    gender: "ذكر",
    residence: "غزة - الشجاعية",
    healthStatus: "جيد",
    schoolStage: "ابتدائي",
    fatherName: "علاء يوسف",
    fatherDeathDate: "2023-10-15",
    fatherDeathCause: "قصف",
    motherName: "هدى محمد",
    siblingsCount: 4,
    guardianName: "هدى محمد",
    guardianRelation: "أم",
    phone: "+970-59-1112233",
    guardianAccount: "بنك فلسطين 0123456",
    sponsorshipStatus: "sponsored",
    sponsorId: sp1Id,
    notes: "بحاجة لمتابعة دراسية",
  });
  const ch2Id = await makeId("CH-");
  await db.insert(child).values({
    id: ch2Id,
    fullName: "مريم ياسر",
    age: 12,
    birthDate: "2013-07-04",
    gender: "أنثى",
    residence: "خان يونس",
    healthStatus: "جيد",
    schoolStage: "إعدادي",
    fatherName: "ياسر محمود",
    fatherDeathDate: "2022-05-20",
    fatherDeathCause: "مرض",
    motherName: "أمل سعيد",
    siblingsCount: 3,
    guardianName: "أمل سعيد",
    guardianRelation: "أم",
    phone: "+970-59-3334455",
    guardianAccount: "PalPay 9988776",
    sponsorshipStatus: "sponsored",
    sponsorId: sp2Id,
  });
  const ch3Id = await makeId("CH-");
  await db.insert(child).values({
    id: ch3Id,
    fullName: "أحمد إياد",
    age: 7,
    birthDate: "2018-01-22",
    gender: "ذكر",
    residence: "رفح",
    healthStatus: "جيد",
    schoolStage: "ابتدائي",
    fatherName: "إياد رمضان",
    fatherDeathDate: "2024-02-10",
    fatherDeathCause: "قصف",
    motherName: "ميساء خالد",
    siblingsCount: 2,
    guardianName: "ميساء خالد",
    guardianRelation: "أم",
    phone: "+970-59-5556677",
    sponsorshipStatus: "unsponsored",
  });

  const payId = await makeId("PAY-");
  await db.insert(payment).values({
    id: payId,
    childId: ch1Id,
    sponsorId: sp1Id,
    monthLabel: "مايو 2024",
    monthKey: "2024-05",
    amountUsd: 100 * 100,
    dateSent: new Date("2024-05-15"),
    paymentStatus: "paid",
    financialStatus: "confirmed",
  });

  const audId = await makeId("AUD-");
  await db.insert(auditLog).values({
    id: audId,
    actorName: "النظام",
    entityType: "child",
    action: "create",
    newValue: JSON.stringify({ seeded: true, sponsors: 3, children: 3, payments: 1 }),
    pseudoId: "seed:initial",
  });

  console.log("✓ Seeded 3 sponsors, 3 children, 1 payment.");
}

async function main() {
  console.log("Kaheteyn — seed");
  console.log("--------------------------------");
  await ensureAdmin();
  await ensureDemoData();
  console.log("--------------------------------");
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
