CREATE TYPE "public"."company_kind" AS ENUM('full_service', 'specialist');--> statement-breakpoint
CREATE TYPE "public"."component_status" AS ENUM('pending', 'completed', 'problem');--> statement-breakpoint
CREATE TYPE "public"."derived_asset_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."migration_quarantine_reason" AS ENUM('missing_reference', 'invalid_relation', 'invalid_shape', 'duplicate_identity', 'missing_artifact', 'legacy_exception', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."migration_quarantine_status" AS ENUM('open', 'reviewed', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."missing_part_status" AS ENUM('reported', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('planning', 'analysis', 'cutting', 'assembly', 'logistics', 'installation');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('review', 'active', 'waiting_approval', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."shipment_condition" AS ENUM('good', 'damaged', 'incomplete', 'missing');--> statement-breakpoint
CREATE TYPE "public"."source_file_kind" AS ENUM('source', 'analysis_result');--> statement-breakpoint
CREATE TYPE "public"."source_file_origin" AS ENUM('planning', 'analysis');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('project_manager', 'production_manager', 'planner', 'cutter', 'assembler', 'installer', 'logistics', 'specialist');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"project_id" text,
	"actor_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"action" text NOT NULL,
	"detail" text,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" "company_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "component_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"source_file_id" text NOT NULL,
	"model_entity_id" uuid,
	"source_revision" integer,
	"entity_key" text,
	"entity_guid" text,
	"stable_model_key" text,
	"definition_name" text,
	"mesh_resource_id" text,
	"parent_component_id" text,
	"title" text NOT NULL,
	"location" text,
	"assembly_status" "component_status" NOT NULL,
	"installation_status" "component_status" NOT NULL,
	"assembly_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"installation_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "display_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"source_file_id" text NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"revision" integer NOT NULL,
	"status" "derived_asset_status" NOT NULL,
	"glb_storage_key" text,
	"manifest_storage_key" text,
	"legacy_glb_storage_path" text,
	"legacy_manifest_storage_path" text,
	"entity_count" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "display_assets_entity_count_nonnegative" CHECK ("display_assets"."entity_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"keywords" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"actor_id" text,
	"request_hash" text NOT NULL,
	"status" "idempotency_status" NOT NULL,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "migration_quarantine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_collection" text NOT NULL,
	"legacy_id" text,
	"reason" "migration_quarantine_reason" NOT NULL,
	"status" "migration_quarantine_status" DEFAULT 'open' NOT NULL,
	"payload" jsonb NOT NULL,
	"details" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "missing_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"source_item_id" text NOT NULL,
	"description" text NOT NULL,
	"reported_by" text NOT NULL,
	"status" "missing_part_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_file_id" text NOT NULL,
	"project_id" text NOT NULL,
	"revision" integer,
	"entity_key" text NOT NULL,
	"stable_model_key" text,
	"entity_guid" text,
	"name" text NOT NULL,
	"definition_name" text NOT NULL,
	"parent_key" text NOT NULL,
	"mesh_resource_id" text,
	"matrix" jsonb NOT NULL,
	"child_count" integer NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "model_entities_child_count_nonnegative" CHECK ("model_entities"."child_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"audience" text NOT NULL,
	"modules" jsonb NOT NULL,
	"summary" text NOT NULL,
	"price_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_audience" CHECK ("plans"."audience" in ('company', 'specialist'))
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "project_members_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"client" text NOT NULL,
	"stage" "project_stage" NOT NULL,
	"status" "project_status" NOT NULL,
	"owner_id" text NOT NULL,
	"progress" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"audit_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "projects_progress_range" CHECK ("projects"."progress" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"height_cm" integer NOT NULL,
	"vertices" jsonb NOT NULL,
	"hidden_walls" jsonb NOT NULL,
	"ceiling_hidden" boolean NOT NULL,
	"openings" jsonb NOT NULL,
	"obstacles" jsonb NOT NULL,
	"sections" jsonb NOT NULL,
	"wall_profiles" jsonb,
	"notes" text,
	"equipment" jsonb NOT NULL,
	"version" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"send_to_analysis" boolean,
	"analysis_requested_at" timestamp with time zone,
	"analysis_requested_by" text NOT NULL,
	"analysis_file_id" text,
	"analysis_file_version" integer,
	CONSTRAINT "rooms_height_positive" CHECK ("rooms"."height_cm" > 0),
	CONSTRAINT "rooms_version_nonnegative" CHECK ("rooms"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"id" text PRIMARY KEY NOT NULL,
	"shipment_id" text NOT NULL,
	"name" text NOT NULL,
	"listed_qty" integer NOT NULL,
	"condition_note" text,
	CONSTRAINT "shipment_items_qty_nonnegative" CHECK ("shipment_items"."listed_qty" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"tracking_code" text NOT NULL,
	"dispatch" jsonb,
	"receipt" jsonb,
	"discrepancies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skp_files" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"room_id" text,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"legacy_storage_path" text,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"revision" integer,
	"kind" "source_file_kind",
	"origin" "source_file_origin",
	"parent_file_id" text,
	"is_current" boolean,
	"checksum_sha256" text,
	"etag" text,
	"metadata" jsonb,
	CONSTRAINT "skp_files_size_positive" CHECK ("skp_files"."size_bytes" > 0),
	CONSTRAINT "skp_files_revision_positive" CHECK ("skp_files"."revision" is null or "skp_files"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "unanswered_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"asked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"role_label" text NOT NULL,
	"modules" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"company_id" text NOT NULL,
	"component_id" text,
	"source_file_id" text,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"location" text,
	"assignee_id" text NOT NULL,
	"status" "component_status" NOT NULL,
	"problem_reason" text,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "workflow_items_kind" CHECK ("workflow_items"."kind" in ('assembly', 'installation'))
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_items" ADD CONSTRAINT "component_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_items" ADD CONSTRAINT "component_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_items" ADD CONSTRAINT "component_items_source_file_id_skp_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."skp_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_items" ADD CONSTRAINT "component_items_model_entity_id_model_entities_id_fk" FOREIGN KEY ("model_entity_id") REFERENCES "public"."model_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_assets" ADD CONSTRAINT "display_assets_source_file_id_skp_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."skp_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_assets" ADD CONSTRAINT "display_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_assets" ADD CONSTRAINT "display_assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_parts" ADD CONSTRAINT "missing_parts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_parts" ADD CONSTRAINT "missing_parts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_parts" ADD CONSTRAINT "missing_parts_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_entities" ADD CONSTRAINT "model_entities_source_file_id_skp_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."skp_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_entities" ADD CONSTRAINT "model_entities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_analysis_requested_by_users_id_fk" FOREIGN KEY ("analysis_requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skp_files" ADD CONSTRAINT "skp_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skp_files" ADD CONSTRAINT "skp_files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skp_files" ADD CONSTRAINT "skp_files_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skp_files" ADD CONSTRAINT "skp_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_items" ADD CONSTRAINT "workflow_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_items" ADD CONSTRAINT "workflow_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_items" ADD CONSTRAINT "workflow_items_component_id_component_items_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_items" ADD CONSTRAINT "workflow_items_source_file_id_skp_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."skp_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_items" ADD CONSTRAINT "workflow_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_project_at_idx" ON "audit_events" USING btree ("project_id","at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "component_items_project_idx" ON "component_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "component_items_company_idx" ON "component_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "component_items_source_idx" ON "component_items" USING btree ("source_file_id");--> statement-breakpoint
CREATE INDEX "component_items_stable_key_idx" ON "component_items" USING btree ("stable_model_key");--> statement-breakpoint
CREATE INDEX "component_items_parent_idx" ON "component_items" USING btree ("parent_component_id");--> statement-breakpoint
CREATE UNIQUE INDEX "display_assets_source_revision_unique" ON "display_assets" USING btree ("source_file_id","revision");--> statement-breakpoint
CREATE INDEX "display_assets_project_idx" ON "display_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "display_assets_status_idx" ON "display_assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idempotency_scope_idx" ON "idempotency_keys" USING btree ("scope");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_scope_key_unique" ON "idempotency_keys" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX "migration_quarantine_status_idx" ON "migration_quarantine" USING btree ("status");--> statement-breakpoint
CREATE INDEX "migration_quarantine_source_id_idx" ON "migration_quarantine" USING btree ("source_collection","legacy_id");--> statement-breakpoint
CREATE INDEX "missing_parts_project_idx" ON "missing_parts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "missing_parts_source_idx" ON "missing_parts" USING btree ("source_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_entities_source_entity_unique" ON "model_entities" USING btree ("source_file_id","entity_key");--> statement-breakpoint
CREATE INDEX "model_entities_project_idx" ON "model_entities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "model_entities_stable_key_idx" ON "model_entities" USING btree ("stable_model_key");--> statement-breakpoint
CREATE INDEX "model_entities_guid_idx" ON "model_entities" USING btree ("entity_guid");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_company_idx" ON "projects" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "rooms_project_idx" ON "rooms" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "rooms_company_idx" ON "rooms" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shipment_items_shipment_idx" ON "shipment_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipments_project_idx" ON "shipments" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_tracking_code_unique" ON "shipments" USING btree ("tracking_code");--> statement-breakpoint
CREATE INDEX "skp_files_project_room_idx" ON "skp_files" USING btree ("project_id","room_id");--> statement-breakpoint
CREATE INDEX "skp_files_company_idx" ON "skp_files" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "skp_files_parent_idx" ON "skp_files" USING btree ("parent_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skp_files_project_room_revision_unique" ON "skp_files" USING btree ("project_id","room_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "skp_files_current_unique" ON "skp_files" USING btree ("project_id","room_id") WHERE "skp_files"."is_current" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "workflow_items_project_kind_idx" ON "workflow_items" USING btree ("project_id","kind");--> statement-breakpoint
CREATE INDEX "workflow_items_assignee_idx" ON "workflow_items" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "workflow_items_component_idx" ON "workflow_items" USING btree ("component_id");