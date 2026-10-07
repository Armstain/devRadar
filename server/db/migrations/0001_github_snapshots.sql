CREATE TYPE "public"."github_sync_status" AS ENUM('queued', 'syncing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "github_scans" (
	"login" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_snapshots" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" "github_sync_status" DEFAULT 'queued' NOT NULL,
	"data" jsonb,
	"error" text,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_snapshots" ADD CONSTRAINT "github_snapshots_user_id_github_connections_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."github_connections"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_scans_scanned_idx" ON "github_scans" USING btree ("scanned_at");