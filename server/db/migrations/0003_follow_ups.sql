ALTER TYPE "public"."application_event_type" ADD VALUE 'followed_up';--> statement-breakpoint
ALTER TYPE "public"."application_event_type" ADD VALUE 'snoozed';--> statement-breakpoint
CREATE TABLE "follow_up_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follow_up_reminders_application_due_unique" UNIQUE("application_id","due_at")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "followed_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "snoozed_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follow_up_reminders_user_idx" ON "follow_up_reminders" USING btree ("user_id","seen_at");