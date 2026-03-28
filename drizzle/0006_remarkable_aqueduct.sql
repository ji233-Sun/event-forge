CREATE TABLE "custom_question_type" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prompt" text NOT NULL,
	"form_code" text NOT NULL,
	"display_code" text NOT NULL,
	"answer_schema" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_generation_variant" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"user_id" text NOT NULL,
	"poster_prompt" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"image_data_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "custom_type_id" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "form_code_snapshot" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "display_code_snapshot" text;--> statement-breakpoint
ALTER TABLE "custom_question_type" ADD CONSTRAINT "custom_question_type_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_generation_variant" ADD CONSTRAINT "media_generation_variant_parent_id_media_generation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_generation_variant" ADD CONSTRAINT "media_generation_variant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_question_type_userId_idx" ON "custom_question_type" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "media_generation_variant_parentId_idx" ON "media_generation_variant" USING btree ("parent_id","created_at");--> statement-breakpoint
CREATE INDEX "media_generation_variant_userId_idx" ON "media_generation_variant" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_custom_type_id_custom_question_type_id_fk" FOREIGN KEY ("custom_type_id") REFERENCES "public"."custom_question_type"("id") ON DELETE set null ON UPDATE no action;