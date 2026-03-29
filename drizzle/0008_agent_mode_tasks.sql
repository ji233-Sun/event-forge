CREATE TABLE "agent_task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resource_kind" text NOT NULL,
	"original_prompt" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"latest_draft" jsonb,
	"latest_draft_name" text,
	"saved_entity_id" text,
	"skill_version" text DEFAULT 'v1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_task_turn" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_payload" jsonb NOT NULL,
	"token_hash" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"submitted_result" jsonb,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_question_type" ADD COLUMN "creation_mode" text DEFAULT 'built_in_ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_question_type" ADD COLUMN "agent_task_id" text;--> statement-breakpoint
ALTER TABLE "minitool" ADD COLUMN "creation_mode" text DEFAULT 'built_in_ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "minitool" ADD COLUMN "agent_task_id" text;--> statement-breakpoint
ALTER TABLE "agent_task" ADD CONSTRAINT "agent_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_task_turn" ADD CONSTRAINT "agent_task_turn_task_id_agent_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."agent_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_task_userId_idx" ON "agent_task" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_task_turn_taskId_idx" ON "agent_task_turn" USING btree ("task_id","created_at");--> statement-breakpoint
ALTER TABLE "custom_question_type" ADD CONSTRAINT "custom_question_type_agent_task_id_agent_task_id_fk" FOREIGN KEY ("agent_task_id") REFERENCES "public"."agent_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minitool" ADD CONSTRAINT "minitool_agent_task_id_agent_task_id_fk" FOREIGN KEY ("agent_task_id") REFERENCES "public"."agent_task"("id") ON DELETE set null ON UPDATE no action;