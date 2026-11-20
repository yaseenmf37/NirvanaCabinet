import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = (name: string) => text(name).notNull();
const time = (name: string) => timestamp(name, { withTimezone: true, mode: "string" }).notNull();

export const companyKind = pgEnum("company_kind", ["full_service", "specialist"]);
export const userRole = pgEnum("user_role", ["project_manager", "production_manager", "planner", "cutter", "assembler", "installer", "logistics", "specialist"]);
export const projectStage = pgEnum("project_stage", ["planning", "analysis", "cutting", "assembly", "logistics", "installation"]);
export const projectStatus = pgEnum("project_status", ["review", "active", "waiting_approval", "completed", "paused"]);
export const componentStatus = pgEnum("component_status", ["pending", "completed", "problem"]);
export const derivedAssetStatus = pgEnum("derived_asset_status", ["pending", "ready", "failed"]);
export const sourceFileKind = pgEnum("source_file_kind", ["source", "analysis_result"]);
export const sourceFileOrigin = pgEnum("source_file_origin", ["planning", "analysis"]);
export const missingPartStatus = pgEnum("missing_part_status", ["reported", "in_progress", "resolved"]);
export const shipmentCondition = pgEnum("shipment_condition", ["good", "damaged", "incomplete", "missing"]);
export const migrationQuarantineReason = pgEnum("migration_quarantine_reason", ["missing_reference", "invalid_relation", "invalid_shape", "duplicate_identity", "missing_artifact", "legacy_exception", "unknown"]);
export const migrationQuarantineStatus = pgEnum("migration_quarantine_status", ["open", "reviewed", "accepted", "rejected"]);
export const idempotencyStatus = pgEnum("idempotency_status", ["in_progress", "completed", "failed"]);

export const companies = pgTable("companies", {
  id: id("id").primaryKey(),
  name: text("name").notNull(),
  kind: companyKind("kind").notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
  updatedAt: time("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: id("id").primaryKey(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull(),
  roleLabel: text("role_label").notNull(),
  modules: jsonb("modules").$type<string[]>().notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
  updatedAt: time("updated_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("users_phone_unique").on(table.phone), index("users_company_idx").on(table.companyId)]);

export const projects = pgTable("projects", {
  id: id("id").primaryKey(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  name: text("name").notNull(),
  client: text("client").notNull(),
  stage: projectStage("stage").notNull(),
  status: projectStatus("status").notNull(),
  ownerId: id("owner_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  progress: integer("progress").notNull(),
  createdAt: time("created_at").notNull(),
  updatedAt: time("updated_at").notNull(),
  auditHistory: jsonb("audit_history").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
}, (table) => [index("projects_company_idx").on(table.companyId), index("projects_owner_idx").on(table.ownerId), check("projects_progress_range", sql`${table.progress} between 0 and 100`)]);

export const projectMembers = pgTable("project_members", {
  projectId: id("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: id("user_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
}, (table) => [primaryKey({ columns: [table.projectId, table.userId], name: "project_members_pk" }), index("project_members_user_idx").on(table.userId)]);

export const rooms = pgTable("rooms", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  name: text("name").notNull(),
  heightCm: integer("height_cm").notNull(),
  vertices: jsonb("vertices").notNull(),
  hiddenWalls: jsonb("hidden_walls").notNull(),
  ceilingHidden: boolean("ceiling_hidden").notNull(),
  openings: jsonb("openings").notNull(),
  obstacles: jsonb("obstacles").notNull(),
  sections: jsonb("sections").notNull(),
  wallProfiles: jsonb("wall_profiles"),
  notes: text("notes"),
  equipment: jsonb("equipment").notNull(),
  version: integer("version").notNull(),
  updatedAt: time("updated_at").notNull(),
  updatedBy: id("updated_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  sendToAnalysis: boolean("send_to_analysis"),
  analysisRequestedAt: timestamp("analysis_requested_at", { withTimezone: true, mode: "string" }),
  analysisRequestedBy: text("analysis_requested_by").references(() => users.id, { onDelete: "set null" }),
  analysisFileId: text("analysis_file_id"),
  analysisFileVersion: integer("analysis_file_version"),
}, (table) => [index("rooms_project_idx").on(table.projectId), index("rooms_company_idx").on(table.companyId), check("rooms_height_positive", sql`${table.heightCm} > 0`), check("rooms_version_nonnegative", sql`${table.version} >= 0`)]);

export const skpFiles = pgTable("skp_files", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageKey: text("storage_key").notNull(),
  legacyStoragePath: text("legacy_storage_path"),
  uploadedBy: id("uploaded_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  uploadedAt: time("uploaded_at").notNull(),
  revision: integer("revision"),
  kind: sourceFileKind("kind"),
  origin: sourceFileOrigin("origin"),
  parentFileId: text("parent_file_id"),
  isCurrent: boolean("is_current"),
  checksumSha256: text("checksum_sha256"),
  etag: text("etag"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
}, (table) => [index("skp_files_project_room_idx").on(table.projectId, table.roomId), index("skp_files_company_idx").on(table.companyId), index("skp_files_parent_idx").on(table.parentFileId), uniqueIndex("skp_files_project_room_revision_unique").on(table.projectId, table.roomId, table.revision), uniqueIndex("skp_files_current_unique").on(table.projectId, table.roomId).where(sql`${table.isCurrent} = true`), check("skp_files_size_positive", sql`${table.sizeBytes} > 0`), check("skp_files_revision_positive", sql`${table.revision} is null or ${table.revision} > 0`)]);

export const displayAssets = pgTable("display_assets", {
  id: id("id").primaryKey(),
  sourceFileId: id("source_file_id").references(() => skpFiles.id, { onDelete: "restrict" }).notNull(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  revision: integer("revision").notNull(),
  status: derivedAssetStatus("status").notNull(),
  glbStorageKey: text("glb_storage_key"),
  manifestStorageKey: text("manifest_storage_key"),
  legacyGlbStoragePath: text("legacy_glb_storage_path"),
  legacyManifestStoragePath: text("legacy_manifest_storage_path"),
  entityCount: integer("entity_count").notNull(),
  error: text("error"),
  createdAt: time("created_at").notNull(),
  updatedAt: time("updated_at").notNull(),
}, (table) => [uniqueIndex("display_assets_source_revision_unique").on(table.sourceFileId, table.revision), index("display_assets_project_idx").on(table.projectId), index("display_assets_status_idx").on(table.status), check("display_assets_entity_count_nonnegative", sql`${table.entityCount} >= 0`)]);

export const modelEntities = pgTable("model_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceFileId: id("source_file_id").references(() => skpFiles.id, { onDelete: "restrict" }).notNull(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  revision: integer("revision"),
  entityKey: text("entity_key").notNull(),
  stableModelKey: text("stable_model_key"),
  entityGuid: text("entity_guid"),
  name: text("name").notNull(),
  definitionName: text("definition_name").notNull(),
  parentKey: text("parent_key").notNull(),
  meshResourceId: text("mesh_resource_id"),
  matrix: jsonb("matrix").notNull(),
  childCount: integer("child_count").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
}, (table) => [uniqueIndex("model_entities_source_entity_unique").on(table.sourceFileId, table.entityKey), index("model_entities_project_idx").on(table.projectId), index("model_entities_stable_key_idx").on(table.stableModelKey), index("model_entities_guid_idx").on(table.entityGuid), check("model_entities_child_count_nonnegative", sql`${table.childCount} >= 0`)]);

export const componentItems = pgTable("component_items", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  sourceFileId: id("source_file_id").references(() => skpFiles.id, { onDelete: "restrict" }).notNull(),
  modelEntityId: uuid("model_entity_id").references(() => modelEntities.id, { onDelete: "set null" }),
  sourceRevision: integer("source_revision"),
  entityKey: text("entity_key"),
  entityGuid: text("entity_guid"),
  stableModelKey: text("stable_model_key"),
  definitionName: text("definition_name"),
  meshResourceId: text("mesh_resource_id"),
  parentComponentId: text("parent_component_id"),
  title: text("title").notNull(),
  location: text("location"),
  assemblyStatus: componentStatus("assembly_status").notNull(),
  installationStatus: componentStatus("installation_status").notNull(),
  assemblyHistory: jsonb("assembly_history").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
  installationHistory: jsonb("installation_history").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
}, (table) => [index("component_items_project_idx").on(table.projectId), index("component_items_company_idx").on(table.companyId), index("component_items_source_idx").on(table.sourceFileId), index("component_items_stable_key_idx").on(table.stableModelKey), index("component_items_parent_idx").on(table.parentComponentId)]);

export const workflowItems = pgTable("workflow_items", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  componentId: text("component_id").references(() => componentItems.id, { onDelete: "set null" }),
  sourceFileId: text("source_file_id").references(() => skpFiles.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  assigneeId: id("assignee_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  status: componentStatus("status").notNull(),
  problemReason: text("problem_reason"),
  history: jsonb("history").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
}, (table) => [index("workflow_items_project_kind_idx").on(table.projectId, table.kind), index("workflow_items_assignee_idx").on(table.assigneeId), index("workflow_items_component_idx").on(table.componentId), check("workflow_items_kind", sql`${table.kind} in ('assembly', 'installation')`)]);

export const missingParts = pgTable("missing_parts", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  sourceItemId: id("source_item_id").notNull(),
  description: text("description").notNull(),
  reportedBy: id("reported_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  status: missingPartStatus("status").notNull(),
  createdAt: time("created_at").notNull(),
}, (table) => [index("missing_parts_project_idx").on(table.projectId), index("missing_parts_source_idx").on(table.sourceItemId)]);

export const shipments = pgTable("shipments", {
  id: id("id").primaryKey(),
  projectId: id("project_id").references(() => projects.id, { onDelete: "restrict" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(),
  trackingCode: text("tracking_code").notNull(),
  dispatch: jsonb("dispatch"),
  receipt: jsonb("receipt"),
  discrepancies: jsonb("discrepancies").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  history: jsonb("history").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
}, (table) => [index("shipments_project_idx").on(table.projectId), uniqueIndex("shipments_tracking_code_unique").on(table.trackingCode)]);

export const shipmentItems = pgTable("shipment_items", {
  id: id("id").primaryKey(),
  shipmentId: id("shipment_id").references(() => shipments.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  listedQty: integer("listed_qty").notNull(),
  conditionNote: text("condition_note"),
}, (table) => [index("shipment_items_shipment_idx").on(table.shipmentId), check("shipment_items_qty_nonnegative", sql`${table.listedQty} >= 0`)]);

export const faq = pgTable("faq", { id: id("id").primaryKey(), question: text("question").notNull(), answer: text("answer").notNull(), keywords: jsonb("keywords").$type<string[]>().notNull(), createdAt: time("created_at").defaultNow().notNull() });
export const plans = pgTable("plans", { id: id("id").primaryKey(), name: text("name").notNull(), audience: text("audience").notNull(), modules: jsonb("modules").$type<string[]>().notNull(), summary: text("summary").notNull(), priceLabel: text("price_label").notNull(), createdAt: time("created_at").defaultNow().notNull() }, (table) => [check("plans_audience", sql`${table.audience} in ('company', 'specialist')`)]);
export const unansweredQuestions = pgTable("unanswered_questions", { id: id("id").primaryKey(), question: text("question").notNull(), askedAt: time("asked_at").notNull() });
export const auditEvents = pgTable("audit_events", { id: id("id").primaryKey(), companyId: id("company_id").references(() => companies.id, { onDelete: "restrict" }).notNull(), projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }), actorId: id("actor_id").references(() => users.id, { onDelete: "restrict" }).notNull(), at: time("at").notNull(), action: text("action").notNull(), detail: text("detail"), entityType: text("entity_type"), entityId: text("entity_id"), metadata: jsonb("metadata") }, (table) => [index("audit_events_project_at_idx").on(table.projectId, table.at), index("audit_events_actor_idx").on(table.actorId)]);
export const idempotencyKeys = pgTable("idempotency_keys", { key: text("key").notNull(), scope: text("scope").notNull(), actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }), requestHash: text("request_hash").notNull(), status: idempotencyStatus("status").notNull(), response: jsonb("response"), createdAt: time("created_at").defaultNow().notNull(), completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }) }, (table) => [primaryKey({ columns: [table.scope, table.key], name: "idempotency_keys_scope_key_pk" }), index("idempotency_scope_idx").on(table.scope)]);
export const pairingIntents = pgTable("pairing_intents", {
  codeHash: text("code_hash").primaryKey(),
  userId: id("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
  expiresAt: time("expires_at").notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "string" }),
  deviceId: text("device_id"),
}, (table) => [index("pairing_intents_expiry_idx").on(table.expiresAt), index("pairing_intents_user_idx").on(table.userId)]);

export const devices = pgTable("devices", {
  id: id("id").primaryKey(),
  companyId: id("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  userId: id("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  fingerprint: text("fingerprint").notNull(),
  sketchupVersion: text("sketchup_version").notNull(),
  os: text("os").notNull(),
  extensionVersion: text("extension_version").notNull(),
  pairedAt: time("paired_at").notNull(),
  lastSeenAt: time("last_seen_at").notNull(),
  status: text("status").notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  revokeReason: text("revoke_reason"),
  refreshHash: text("refresh_hash").notNull(),
  refreshJti: text("refresh_jti").notNull(),
  rotationCount: integer("rotation_count").notNull().default(0),
}, (table) => [uniqueIndex("devices_fingerprint_unique").on(table.fingerprint), index("devices_user_idx").on(table.userId), index("devices_company_idx").on(table.companyId), check("devices_status_valid", sql`${table.status} in ('paired', 'revoked')`)]);