import { db } from "@kaheteyn/db";
import { auditLog } from "@kaheteyn/db/schema";
import { sql, like, desc } from "drizzle-orm";

export type EntityType = "child" | "sponsor" | "payment" | "user";

export async function nextChildId(): Promise<string> {
  const rows = await db
    .execute<{ id: string }>(sql`SELECT id FROM "child"`)
    .catch(() => [] as { id: string }[]);
  return formatNextId("CH-", 4, rows.map((r) => r.id));
}

function formatNextId(prefix: string, padLen: number, existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    if (typeof id !== "string" || !id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = max + 1;
  return `${prefix}${String(next).padStart(padLen, "0")}`;
}

export async function makeId(prefix: "CH-" | "SP-" | "PAY-" | "AUD-"): Promise<string> {
  const padLen = prefix === "CH-" ? 4 : prefix === "SP-" ? 3 : 6;
  const table =
    prefix === "CH-"
      ? "child"
      : prefix === "SP-"
        ? "sponsor"
        : prefix === "PAY-"
          ? "payment"
          : "audit_log";
  const result = await db.execute<{ id: string }>(
    sql.raw(`SELECT id FROM "${table}" WHERE id LIKE '${prefix}%' ORDER BY id DESC LIMIT 1`),
  );
  const last = result[0]?.id;
  let n = 0;
  if (last) {
    const parsed = Number(last.slice(prefix.length));
    if (Number.isFinite(parsed)) n = parsed;
  }
  return `${prefix}${String(n + 1).padStart(padLen, "0")}`;
}

export async function logAudit(args: {
  actorId?: string | null;
  actorName?: string | null;
  entityType: EntityType;
  entityId?: string | null;
  action: "create" | "update" | "delete";
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const id = await makeId("AUD-");
  await db.insert(auditLog).values({
    id,
    actorId: args.actorId ?? null,
    actorName: args.actorName ?? null,
    entityType: args.entityType,
    entityId: args.entityId ?? null,
    action: args.action,
    oldValue: args.oldValue ? JSON.stringify(args.oldValue) : null,
    newValue: args.newValue ? JSON.stringify(args.newValue) : null,
    pseudoId: `${args.entityType}:${args.entityId ?? "?"}`,
  });
}

// Used to silence unused imports
export const _kept = { like, desc };
