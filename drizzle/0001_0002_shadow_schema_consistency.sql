DROP INDEX "idempotency_scope_key_unique";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'idempotency_keys'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "idempotency_keys" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "analysis_requested_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_scope_key_pk" PRIMARY KEY("scope","key");