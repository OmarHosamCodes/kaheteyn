import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

// Children (الأطفال)
export const child = sqliteTable(
  "child",
  {
    id: text("id").primaryKey(), // CH-####
    fullName: text("full_name").notNull(),
    age: integer("age"),
    birthDate: text("birth_date"), // ISO string
    gender: text("gender"), // ذكر / أنثى
    residence: text("residence"),
    healthStatus: text("health_status"),
    schoolStage: text("school_stage"), // روضة | ابتدائي | إعدادي | ثانوي | جامعي | غير ملتحق
    fatherName: text("father_name"),
    fatherDeathDate: text("father_death_date"),
    fatherDeathCause: text("father_death_cause"),
    motherName: text("mother_name"),
    siblingsCount: integer("siblings_count"),
    guardianName: text("guardian_name"),
    guardianRelation: text("guardian_relation"),
    phone: text("phone"),
    guardianAccount: text("guardian_account"),
    sponsorshipStatus: text("sponsorship_status").default("unsponsored").notNull(), // sponsored | unsponsored
    sponsorId: text("sponsor_id"),
    photo: text("photo"), // data URL or path
    birthCertificate: text("birth_certificate"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("child_sponsor_idx").on(t.sponsorId),
    index("child_status_idx").on(t.sponsorshipStatus),
  ],
);

// Sponsors (الكفلاء)
export const sponsor = sqliteTable("sponsor", {
  id: text("id").primaryKey(), // SP-###
  name: text("name").notNull(),
  phone: text("phone"),
  paymentMethod: text("payment_method"), // bank_palestine | palpay | bank_transfer
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// Payments (الدفعات)
export const payment = sqliteTable(
  "payment",
  {
    id: text("id").primaryKey(), // PAY-...
    childId: text("child_id").notNull(),
    sponsorId: text("sponsor_id").notNull(),
    monthLabel: text("month_label").notNull(), // e.g. "مايو 2024"
    monthKey: text("month_key").notNull(), // YYYY-MM for grouping
    amountUsd: integer("amount_usd").notNull(), // cents
    dateSent: integer("date_sent", { mode: "timestamp_ms" }).notNull(),
    paymentStatus: text("payment_status").default("pending").notNull(), // paid | pending | late
    financialStatus: text("financial_status").default("sent").notNull(), // sent | confirmed | rejected
    receiptFile: text("receipt_file"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("payment_child_idx").on(t.childId),
    index("payment_sponsor_idx").on(t.sponsorId),
    index("payment_month_idx").on(t.monthKey),
  ],
);

// Receipt / Acknowledgment (إقرار استلام)
export const receipt = sqliteTable(
  "receipt",
  {
    id: text("id").primaryKey(), // REC-...
    paymentId: text("payment_id").notNull(),
    document: text("document"), // file
    dateReceived: integer("date_received", { mode: "timestamp_ms" }).notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("receipt_payment_idx").on(t.paymentId)],
);

// Audit Log (سجل العمليات)
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    actorId: text("actor_id"),
    actorName: text("actor_name"),
    entityType: text("entity_type").notNull(), // child | sponsor | payment | receipt
    entityId: text("entity_id"),
    action: text("action").notNull(), // create | update | delete
    oldValue: text("old_value"), // JSON
    newValue: text("new_value"), // JSON
    pseudoId: text("pseudo_id"),
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_timestamp_idx").on(t.timestamp),
    index("audit_actor_idx").on(t.actorId),
  ],
);

export type Child = typeof child.$inferSelect;
export type NewChild = typeof child.$inferInsert;
export type Sponsor = typeof sponsor.$inferSelect;
export type NewSponsor = typeof sponsor.$inferInsert;
export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
export type Receipt = typeof receipt.$inferSelect;
export type NewReceipt = typeof receipt.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;

// Use any imported relation references
export const _userRef = user;
