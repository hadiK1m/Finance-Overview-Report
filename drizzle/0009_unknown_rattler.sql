CREATE TABLE "drive_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"path" text,
	"size" integer,
	"parent_id" integer,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drive_items" ADD CONSTRAINT "drive_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_items" ADD CONSTRAINT "drive_items_parent_id_drive_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."drive_items"("id") ON DELETE cascade ON UPDATE no action;