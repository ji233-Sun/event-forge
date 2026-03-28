CREATE TABLE "deck" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"markdown" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "question_surveyId_idx";--> statement-breakpoint
DROP INDEX "response_surveyId_idx";--> statement-breakpoint
DROP INDEX "survey_userId_idx";--> statement-breakpoint
ALTER TABLE "deck" ADD CONSTRAINT "deck_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_userId_idx" ON "deck" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "question_surveyId_idx" ON "question" USING btree ("survey_id","order");--> statement-breakpoint
CREATE INDEX "response_surveyId_idx" ON "response" USING btree ("survey_id","created_at");--> statement-breakpoint
CREATE INDEX "survey_userId_idx" ON "survey" USING btree ("user_id","created_at");