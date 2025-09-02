ALTER TABLE "transactions" ADD COLUMN "balance_sheet_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_balance_sheet_id_balance_sheet_id_fk" FOREIGN KEY ("balance_sheet_id") REFERENCES "public"."balance_sheet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "account";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "has_attachment";