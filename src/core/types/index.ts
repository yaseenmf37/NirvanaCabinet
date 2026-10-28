export type ModuleKey =
  | "projects"
  | "planning"
  | "analysis"
  | "cutting"
  | "assembly"
  | "installation"
  | "logistics"
  | "reports"
  | "employees"
  | "settings";

export type UserRole =
  | "project_manager"
  | "production_manager"
  | "planner"
  | "cutter"
  | "assembler"
  | "installer"
  | "logistics"
  | "specialist";

export type ProjectStage =
  | "planning"
  | "analysis"
  | "cutting"
  | "assembly"
  | "logistics"
  | "installation";

export type ProjectStatus = "review" | "active" | "waiting_approval" | "completed" | "paused";

export type Point2D = { x: number; y: number };

export interface Company {
  id: string;
  name: string;
  kind: "full_service" | "specialist";
}

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  companyId: string;
  modules: ModuleKey[];
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  client: string;
  stage: ProjectStage;
  status: ProjectStatus;
  ownerId: string;
  memberIds: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
  auditHistory?: AuditEvent[];
}

export interface RoomOpening {
  id: string;
  kind: "door" | "window";
  wallIndex: number;
  offsetCm: number;
  widthCm: number;
  heightCm: number;
  sillHeightCm: number;
}

export interface RoomObstacle {
  id: string;
  kind: "column" | "recess" | "protrusion" | "other";
  x: number;
  y: number;
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

export interface RoomSection {
  id: string;
  label: string;
  fromVertex: number;
  toVertex: number;
}

export interface EquipmentAnswers {
  refrigerator: "none" | "standard" | "side_by_side";
  washingMachine: boolean;
  dishwasher: boolean;
  oven: boolean;
  cooktop: boolean;
  microwave: boolean;
  extractorHood: boolean;
  notes: string;
  sizes?: Partial<Record<"refrigerator" | "washingMachine" | "dishwasher" | "oven" | "cooktop" | "microwave" | "extractorHood", string>>;
}

export interface RoomWallProfile {
  wallIndex: number;
  startHeightCm?: number;
  endHeightCm?: number;
  startLeanCm?: number;
  endLeanCm?: number;
  startShiftCm?: number;
  endShiftCm?: number;
}

export interface RoomModel {
  id: string;
  projectId: string;
  companyId: string;
  name: string;
  heightCm: number;
  vertices: Point2D[];
  hiddenWalls: number[];
  ceilingHidden: boolean;
  openings: RoomOpening[];
  obstacles: RoomObstacle[];
  sections: RoomSection[];
  wallProfiles?: RoomWallProfile[];
  notes?: string;
  equipment: EquipmentAnswers;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export type ComponentStatus = "pending" | "completed" | "problem";

export interface WorkflowItem {
  id: string;
  projectId: string;
  companyId: string;
  title: string;
  location?: string;
  assigneeId: string;
  status: ComponentStatus;
  problemReason?: string;
  history: AuditEvent[];
  componentId?: string;
  sourceFileId?: string;
}

export interface SkpFile {
  id: string;
  projectId: string;
  companyId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ComponentItem {
  id: string;
  projectId: string;
  companyId: string;
  sourceFileId: string;
  title: string;
  location?: string;
  assemblyStatus: ComponentStatus;
  installationStatus: ComponentStatus;
  assemblyHistory: AuditEvent[];
  installationHistory: AuditEvent[];
}

export interface MissingPart {
  id: string;
  projectId: string;
  companyId: string;
  sourceItemId: string;
  description: string;
  reportedBy: string;
  status: "reported" | "in_progress" | "resolved";
  createdAt: string;
}

export interface ShipmentItem {
  id: string;
  name: string;
  listedQty: number;
  conditionNote?: string;
}

export interface ShipmentCheck {
  actorId: string;
  actorName: string;
  at: string;
  items: Array<{
    id: string;
    qty: number;
    condition: "good" | "damaged" | "incomplete" | "missing";
    note?: string;
  }>;
  photoNote?: string;
}

export interface Shipment {
  id: string;
  projectId: string;
  companyId: string;
  trackingCode: string;
  items: ShipmentItem[];
  dispatch?: ShipmentCheck;
  receipt?: ShipmentCheck;
  discrepancies: string[];
  history: AuditEvent[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  detail?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface PlanProduct {
  id: string;
  name: string;
  audience: "company" | "specialist";
  modules: ModuleKey[];
  summary: string;
  priceLabel: string;
}

export interface PlatformState {
  companies: Company[];
  users: Array<SessionUser & { password: string }>;
  projects: Project[];
  rooms: RoomModel[];
  assemblyItems: WorkflowItem[];
  installationItems: WorkflowItem[];
  missingParts: MissingPart[];
  shipments: Shipment[];
  skpFiles: SkpFile[];
  componentItems: ComponentItem[];
  faq: FaqEntry[];
  plans: PlanProduct[];
  unansweredQuestions: Array<{ id: string; question: string; at: string }>;
}

export interface PlatformReadModel {
  user: SessionUser;
  company: Company | null;
  projects: Project[];
  rooms: RoomModel[];
  assemblyItems: WorkflowItem[];
  installationItems: WorkflowItem[];
  missingParts: MissingPart[];
  shipments: Shipment[];
  skpFiles: SkpFile[];
  componentItems: ComponentItem[];
  employees: SessionUser[];
  unansweredQuestions: Array<{ id: string; question: string; at: string }>;
}

export const roleLabels: Record<UserRole, string> = {
  project_manager: "مدیر پروژه",
  production_manager: "مدیر تولید",
  planner: "متخصص اندازه‌گیری",
  cutter: "مسئول برش",
  assembler: "مونتاژکار",
  installer: "نصاب",
  logistics: "مسئول حمل",
  specialist: "متخصص مستقل",
};

export const stageLabels: Record<ProjectStage, string> = {
  planning: "برنامه‌ریزی و اندازه‌گیری",
  analysis: "تحلیل",
  cutting: "برش",
  assembly: "مونتاژ",
  logistics: "حمل و تحویل",
  installation: "نصب",
};

export const statusLabels: Record<ProjectStatus, string> = {
  review: "در حال بررسی",
  active: "در جریان",
  waiting_approval: "در انتظار تأیید",
  completed: "تکمیل‌شده",
  paused: "متوقف‌شده",
};

export const moduleLabels: Record<ModuleKey, string> = {
  projects: "پروژه‌ها",
  planning: "برنامه‌ریزی",
  analysis: "تحلیل",
  cutting: "برش",
  assembly: "مونتاژ",
  installation: "نصب",
  logistics: "حمل و تحویل",
  reports: "گزارش‌ها",
  employees: "کارکنان",
  settings: "تنظیمات",
};
