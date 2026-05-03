import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// Children (الأطفال)
export const child = pgTable(
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("child_sponsor_idx").on(t.sponsorId),
    index("child_status_idx").on(t.sponsorshipStatus),
  ],
);

// Sponsors (الكفلاء)
export const sponsor = pgTable("sponsor", {
  id: text("id").primaryKey(), // SP-###
  name: text("name").notNull(),
  phone: text("phone"),
  paymentMethod: text("payment_method"), // bank_palestine | palpay | bank_transfer
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Payments (الدفعات)
export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(), // PAY-...
    childId: text("child_id").notNull(),
    sponsorId: text("sponsor_id").notNull(),
    monthLabel: text("month_label").notNull(), // e.g. "مايو 2024"
    monthKey: text("month_key").notNull(), // YYYY-MM for grouping
    amountUsd: integer("amount_usd").notNull(), // cents
    dateSent: timestamp("date_sent", { withTimezone: true, mode: "date" }).notNull(),
    paymentStatus: text("payment_status").default("pending").notNull(), // paid | pending | late
    financialStatus: text("financial_status").default("sent").notNull(), // sent | confirmed | rejected
    acknowledgmentReceipt: text("acknowledgment_receipt"), // image file
    transferReceipt: text("transfer_receipt"), // image file
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("payment_child_idx").on(t.childId),
    index("payment_sponsor_idx").on(t.sponsorId),
    index("payment_month_idx").on(t.monthKey),
  ],
);


// Audit Log (سجل العمليات)
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    actorId: text("actor_id"),
    actorName: text("actor_name"),
    entityType: text("entity_type").notNull(), // child | sponsor | payment | user
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
export type AuditLog = typeof auditLog.$inferSelect;

// Use any imported relation references
export const _userRef = user;
