CREATE TYPE "public"."avatar_mode" AS ENUM('internal', 'gravatar', 'dicebear');--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "avatar_mode" "avatar_mode" DEFAULT 'internal' NOT NULL;