CREATE SCHEMA "games";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text,
	"max_score" text,
	"wordCount" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."gameWords" (
	"game_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	CONSTRAINT "gameWordId" PRIMARY KEY("game_id","word_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."userGame" (
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"score" integer,
	CONSTRAINT "userGameId" PRIMARY KEY("user_id","game_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."userGameWords" (
	"userGameId" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	CONSTRAINT "userGameWordId" PRIMARY KEY("userGameId","word_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text,
	"last_name" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games"."words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"length" integer NOT NULL,
	"pure" boolean NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."gameWords" ADD CONSTRAINT "gameWords_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"."game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."gameWords" ADD CONSTRAINT "gameWords_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "games"."words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."userGame" ADD CONSTRAINT "userGame_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "games"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."userGame" ADD CONSTRAINT "userGame_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"."game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."userGameWords" ADD CONSTRAINT "userGameWords_userGameId_game_id_fk" FOREIGN KEY ("userGameId") REFERENCES "games"."game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games"."userGameWords" ADD CONSTRAINT "userGameWords_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "games"."words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
