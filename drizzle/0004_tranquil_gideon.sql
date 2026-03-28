ALTER TABLE "deck" ALTER COLUMN "markdown" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deck" ADD COLUMN "mode" text DEFAULT 'marp' NOT NULL;--> statement-breakpoint
ALTER TABLE "deck" ADD COLUMN "images" jsonb;