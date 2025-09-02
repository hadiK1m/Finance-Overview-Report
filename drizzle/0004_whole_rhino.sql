CREATE TABLE "balance_sheet" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"balance" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
