ALTER TABLE "payment" ADD COLUMN "acknowledgment_receipt" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "transfer_receipt" text;--> statement-breakpoint
UPDATE "payment" p SET "acknowledgment_receipt" = r."document"
  FROM "receipt" r WHERE r."payment_id" = p."id" AND r."document" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN IF EXISTS "receipt_file";--> statement-breakpoint
DROP TABLE IF EXISTS "receipt" CASCADE;
