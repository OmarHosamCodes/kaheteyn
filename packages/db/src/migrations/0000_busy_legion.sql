CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text,
	"display_username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"action" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"pseudo_id" text
);
--> statement-breakpoint
CREATE TABLE "child" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"age" integer,
	"birth_date" text,
	"gender" text,
	"residence" text,
	"health_status" text,
	"school_stage" text,
	"father_name" text,
	"father_death_date" text,
	"father_death_cause" text,
	"mother_name" text,
	"siblings_count" integer,
	"guardian_name" text,
	"guardian_relation" text,
	"phone" text,
	"guardian_account" text,
	"sponsorship_status" text DEFAULT 'unsponsored' NOT NULL,
	"sponsor_id" text,
	"photo" text,
	"birth_certificate" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"sponsor_id" text NOT NULL,
	"month_label" text NOT NULL,
	"month_key" text NOT NULL,
	"amount_usd" integer NOT NULL,
	"date_sent" timestamp with time zone NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"financial_status" text DEFAULT 'sent' NOT NULL,
	"receipt_file" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"document" text,
	"date_received" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "child_sponsor_idx" ON "child" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "child_status_idx" ON "child" USING btree ("sponsorship_status");--> statement-breakpoint
CREATE INDEX "payment_child_idx" ON "payment" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "payment_sponsor_idx" ON "payment" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "payment_month_idx" ON "payment" USING btree ("month_key");--> statement-breakpoint
CREATE INDEX "receipt_payment_idx" ON "receipt" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");