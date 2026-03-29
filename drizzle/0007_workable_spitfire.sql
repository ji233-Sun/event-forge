CREATE TABLE "minitool" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL,
	"component_code" text NOT NULL,
	"host_code" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minitool_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"minitool_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minitool_shared" (
	"minitool_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "minitool" ADD CONSTRAINT "minitool_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minitool_participant" ADD CONSTRAINT "minitool_participant_minitool_id_minitool_id_fk" FOREIGN KEY ("minitool_id") REFERENCES "public"."minitool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minitool_shared" ADD CONSTRAINT "minitool_shared_minitool_id_minitool_id_fk" FOREIGN KEY ("minitool_id") REFERENCES "public"."minitool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "minitool_userId_idx" ON "minitool" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "minitool_participant_unique_idx" ON "minitool_participant" USING btree ("minitool_id","visitor_id");--> statement-breakpoint
CREATE INDEX "minitool_participant_minitoolId_idx" ON "minitool_participant" USING btree ("minitool_id","created_at");