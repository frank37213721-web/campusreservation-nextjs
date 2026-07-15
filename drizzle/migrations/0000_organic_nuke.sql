CREATE TYPE "public"."reservation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('User', 'ClassAdmin', 'SiteAdmin');--> statement-breakpoint
CREATE TABLE "classroom_admins" (
	"classroom_id" integer NOT NULL,
	"profile_id" text NOT NULL,
	CONSTRAINT "classroom_admins_classroom_id_profile_id_pk" PRIMARY KEY("classroom_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"access_method" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"department" text NOT NULL,
	"role" "role" DEFAULT 'User' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"classroom_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"request_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "reservation_status" DEFAULT 'PENDING' NOT NULL,
	"purpose" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_end_after_start" CHECK ("reservations"."end_time" > "reservations"."start_time")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "classroom_admins" ADD CONSTRAINT "classroom_admins_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_admins" ADD CONSTRAINT "classroom_admins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classroom_admins_profile_id_idx" ON "classroom_admins" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "classrooms_school_id_idx" ON "classrooms" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "reservations_school_date_idx" ON "reservations" USING btree ("school_id","request_date");--> statement-breakpoint
CREATE INDEX "reservations_classroom_date_idx" ON "reservations" USING btree ("classroom_id","request_date");--> statement-breakpoint
CREATE INDEX "reservations_user_id_idx" ON "reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservations_school_status_idx" ON "reservations" USING btree ("school_id","status");