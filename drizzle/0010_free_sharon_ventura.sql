CREATE TYPE "public"."user_role" AS ENUM('admin', 'assistant_admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'assistant_admin' NOT NULL;