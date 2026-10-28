import fs from "fs";
import path from "path";
import { hashPassword } from "@/src/core/auth/password";
import type { PlatformState, SessionUser } from "@/src/core/types";
import { roleLabels } from "@/src/core/types";

const filePath = path.join(process.cwd(), "app", "data", "platform.json");

const allCompanyModules = [
  "projects",
  "planning",
  "analysis",
  "cutting",
  "assembly",
  "installation",
  "logistics",
  "reports",
  "employees",
  "settings",
] as const;

function now() {
  return new Date().toISOString();
}

function seed(): PlatformState {
  const createdAt = now();

  return {
    companies: [
      { id: "co-nirvana", name: "نیروانا کابینت", kind: "full_service" },
      { id: "co-studio", name: "استودیو اندازه‌گیری آریا", kind: "specialist" },
    ],
    users: [
      {
        id: "u-saeid",
        name: "سعید محبی",
        phone: "09120000001",
        password: hashPassword("123456"),
        role: "project_manager",
        roleLabel: roleLabels.project_manager,
        companyId: "co-nirvana",
        modules: [...allCompanyModules],
      },
      {
        id: "u-leila",
        name: "لیلا فرهادی",
        phone: "09120000002",
        password: hashPassword("123456"),
        role: "production_manager",
        roleLabel: roleLabels.production_manager,
        companyId: "co-nirvana",
        modules: ["projects", "analysis", "cutting", "assembly", "reports"],
      },
      {
        id: "u-reza",
        name: "رضا کاظمی",
        phone: "09120000003",
        password: hashPassword("123456"),
        role: "installer",
        roleLabel: roleLabels.installer,
        companyId: "co-nirvana",
        modules: ["projects", "installation", "logistics"],
      },
      {
        id: "u-nasteran",
        name: "نسترن قاسمی",
        phone: "09120000004",
        password: hashPassword("123456"),
        role: "planner",
        roleLabel: roleLabels.planner,
        companyId: "co-nirvana",
        modules: ["projects", "planning"],
      },
      {
        id: "u-aria",
        name: "آریا سلیمانی",
        phone: "09120000005",
        password: hashPassword("123456"),
        role: "specialist",
        roleLabel: roleLabels.specialist,
        companyId: "co-studio",
        modules: ["projects", "planning"],
      },
    ],
    projects: [
      {
        id: "proj-1",
        companyId: "co-nirvana",
        name: "نوسازی آشپزخانه ۱۲",
        client: "خانه رضایی",
        stage: "planning",
        status: "review",
        ownerId: "u-saeid",
        memberIds: ["u-nasteran", "u-leila", "u-reza"],
        progress: 28,
        createdAt,
        updatedAt: createdAt,
        auditHistory: [],
      },
      {
        id: "proj-2",
        companyId: "co-nirvana",
        name: "دکوراسیون فروشگاه",
        client: "فروشگاه نور",
        stage: "assembly",
        status: "active",
        ownerId: "u-leila",
        memberIds: ["u-leila", "u-saeid"],
        progress: 64,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "proj-3",
        companyId: "co-nirvana",
        name: "ویلای شمالی",
        client: "خانواده کریمی",
        stage: "installation",
        status: "waiting_approval",
        ownerId: "u-reza",
        memberIds: ["u-reza", "u-saeid"],
        progress: 84,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "proj-4",
        companyId: "co-studio",
        name: "اندازه‌گیری واحد ۷",
        client: "پروژه مستقل",
        stage: "planning",
        status: "active",
        ownerId: "u-aria",
        memberIds: ["u-aria"],
        progress: 40,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    rooms: [
      {
        id: "room-1",
        projectId: "proj-1",
        companyId: "co-nirvana",
        name: "آشپزخانه اصلی",
        heightCm: 280,
        vertices: [
          { x: 0, y: 0 },
          { x: 420, y: 0 },
          { x: 420, y: 310 },
          { x: 0, y: 310 },
        ],
        hiddenWalls: [],
        ceilingHidden: false,
        openings: [
          {
            id: "op-1",
            kind: "door",
            wallIndex: 3,
            offsetCm: 40,
            widthCm: 90,
            heightCm: 210,
            sillHeightCm: 0,
          },
          {
            id: "op-2",
            kind: "window",
            wallIndex: 1,
            offsetCm: 80,
            widthCm: 140,
            heightCm: 120,
            sillHeightCm: 90,
          },
        ],
        obstacles: [
          {
            id: "obs-1",
            kind: "column",
            x: 180,
            y: 20,
            widthCm: 30,
            depthCm: 30,
            heightCm: 280,
          },
        ],
        sections: [],
        equipment: {
          refrigerator: "side_by_side",
          washingMachine: false,
          dishwasher: true,
          oven: true,
          cooktop: true,
          microwave: false,
          extractorHood: true,
          notes: "لوله‌های گاز روی دیوار شمالی، پریز ظرفشویی سمت راست سینک.",
        },
        version: 1,
        updatedAt: createdAt,
        updatedBy: "u-nasteran",
      },
    ],
    assemblyItems: [
      {
        id: "asm-1",
        projectId: "proj-2",
        companyId: "co-nirvana",
        title: "کابینت زیر سینک S-12",
        assigneeId: "u-leila",
        status: "pending",
        history: [],
      },
      {
        id: "asm-2",
        projectId: "proj-2",
        companyId: "co-nirvana",
        title: "کمد دیواری W-01",
        assigneeId: "u-leila",
        status: "completed",
        history: [
          {
            id: "ev-1",
            at: createdAt,
            actorId: "u-leila",
            actorName: "لیلا فرهادی",
            action: "completed",
            detail: "مونتاژ تکمیل شد",
          },
        ],
      },
      {
        id: "asm-3",
        projectId: "proj-2",
        companyId: "co-nirvana",
        title: "کشوهای عریض D-05",
        assigneeId: "u-leila",
        status: "problem",
        problemReason: "ریل کشو با نقشه هم‌خوان نیست",
        history: [
          {
            id: "ev-2",
            at: createdAt,
            actorId: "u-leila",
            actorName: "لیلا فرهادی",
            action: "problem",
            detail: "ریل کشو با نقشه هم‌خوان نیست",
          },
        ],
      },
    ],
    installationItems: [
      {
        id: "inst-1",
        projectId: "proj-3",
        companyId: "co-nirvana",
        title: "کابینت زیر سینک",
        location: "آشپزخانه - بخش A",
        assigneeId: "u-reza",
        status: "completed",
        history: [
          {
            id: "ev-3",
            at: createdAt,
            actorId: "u-reza",
            actorName: "رضا کاظمی",
            action: "completed",
            detail: "نصب شد",
          },
        ],
      },
      {
        id: "inst-2",
        projectId: "proj-3",
        companyId: "co-nirvana",
        title: "کمد دیواری اصلی",
        location: "اتاق خواب مستر",
        assigneeId: "u-reza",
        status: "pending",
        history: [],
      },
      {
        id: "inst-3",
        projectId: "proj-3",
        companyId: "co-nirvana",
        title: "صفحه روی کابینت",
        location: "آشپزخانه - بخش B",
        assigneeId: "u-reza",
        status: "pending",
        history: [],
      },
    ],
    missingParts: [
      {
        id: "miss-1",
        projectId: "proj-2",
        companyId: "co-nirvana",
        sourceItemId: "asm-3",
        description: "ریل کشو D-05",
        reportedBy: "u-leila",
        status: "reported",
        createdAt,
      },
    ],
    shipments: [
      {
        id: "ship-1",
        projectId: "proj-3",
        companyId: "co-nirvana",
        trackingCode: "TRK-99281",
        items: [
          { id: "si-1", name: "کابینت زیر سینک S-12", listedQty: 1 },
          { id: "si-2", name: "درب‌های بالایی U-04", listedQty: 4 },
          { id: "si-3", name: "صفحه گرانیت", listedQty: 1 },
        ],
        history: [],
        discrepancies: [],
      },
    ],
    skpFiles: [],
    componentItems: [],
    faq: [
      {
        id: "faq-1",
        question: "پلتفرم برای چه کسانی است؟",
        answer:
          "هم برای شرکت‌های کامل‌خدمت کابینت و هم برای متخصصان و تیم‌های تخصصی که فقط چند ماژول را نیاز دارند.",
        keywords: ["شرکت", "متخصص", "ماژول", "مخاطب"],
      },
      {
        id: "faq-2",
        question: "آیا می‌توان فقط ماژول اندازه‌گیری را خرید؟",
        answer:
          "بله. خرید ماژول فقط همان قابلیت را فعال می‌کند و به‌تنهایی دسترسی به شرکت‌ها یا پروژه‌های دیگران نمی‌دهد.",
        keywords: ["خرید", "ماژول", "اندازه‌گیری", "پلن"],
      },
      {
        id: "faq-3",
        question: "ماژول برنامه‌ریزی چه خروجی‌ای می‌دهد؟",
        answer:
          "یک خروجی دیداری سه‌بعدی و یک خروجی ساخت‌یافته شامل ابعاد، مختصات، دیوارها، بازشوها، موانع و اطلاعات تجهیزات.",
        keywords: ["برنامه‌ریزی", "خروجی", "سه بعدی", "داده"],
      },
      {
        id: "faq-4",
        question: "اگر قطعه‌ای در مونتاژ ناقص باشد چه می‌شود؟",
        answer:
          "وضعیت مشکل ثبت می‌شود، دلیل ذخیره می‌گردد و موضوع برای مدیر پروژه و واحد برش قابل پیگیری می‌ماند. این مورد تکمیل موفق حساب نمی‌شود.",
        keywords: ["مونتاژ", "نقص", "قطعه", "برش"],
      },
    ],
    plans: [
      {
        id: "plan-planning",
        name: "ماژول برنامه‌ریزی",
        audience: "specialist",
        modules: ["planning"],
        summary: "اندازه‌گیری فضا، مدل سه‌بعدی و خروجی ساخت‌یافته برای متخصصان.",
        priceLabel: "قیمت نهایی بعداً اعلام می‌شود",
      },
      {
        id: "plan-ops",
        name: "عملیات کارگاه",
        audience: "company",
        modules: ["assembly", "cutting", "logistics"],
        summary: "پیگیری مونتاژ، جایگاه برش و حمل با تأیید جداگانه ارسال و دریافت.",
        priceLabel: "قیمت نهایی بعداً اعلام می‌شود",
      },
      {
        id: "plan-company",
        name: "مدیریت جامع شرکت",
        audience: "company",
        modules: [...allCompanyModules],
        summary: "کل جریان از اندازه‌گیری تا نصب، گزارش، نیرو و کنترل دسترسی.",
        priceLabel: "قیمت نهایی بعداً اعلام می‌شود",
      },
    ],
    unansweredQuestions: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: Record<string, unknown>, key: string) {
  return typeof value[key] === "string" && value[key].length > 0;
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isPlatformState(value: unknown): value is PlatformState {
  if (!isRecord(value)) return false;
  const state = value as Record<string, unknown>;
  const collections = [
    "companies",
    "users",
    "projects",
    "rooms",
    "assemblyItems",
    "installationItems",
    "missingParts",
    "shipments",
    "faq",
    "plans",
    "unansweredQuestions",
  ];
  if (!collections.every((collection) => Array.isArray(state[collection]))) return false;
  const array = (key: string): unknown[] => state[key] as unknown[];
  const companies = array("companies");
  const users = array("users");
  const projects = array("projects");
  const rooms = array("rooms");
  const assemblyItems = array("assemblyItems");
  const installationItems = array("installationItems");
  const missingParts = array("missingParts");
  const shipments = array("shipments");
  const skpFiles = Array.isArray(state.skpFiles) ? array("skpFiles") : [];
  const componentItems = Array.isArray(state.componentItems) ? array("componentItems") : [];
  const faq = array("faq");
  const plans = array("plans");
  const unansweredQuestions = array("unansweredQuestions");

  if (!companies.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "name") && (item.kind === "full_service" || item.kind === "specialist"))) return false;
  if (!users.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "name") && hasString(item, "phone") && hasString(item, "password") && hasString(item, "role") && hasString(item, "roleLabel") && hasString(item, "companyId") && isStringArray(item.modules))) return false;
  if (!projects.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "companyId") && hasString(item, "name") && hasString(item, "client") && hasString(item, "ownerId") && isStringArray(item.memberIds) && Number.isFinite(item.progress) && typeof item.createdAt === "string" && typeof item.updatedAt === "string" && (item.auditHistory === undefined || Array.isArray(item.auditHistory)))) return false;
  if (!rooms.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "name") && Number.isFinite(item.heightCm) && Array.isArray(item.vertices) && item.vertices.every((vertex) => isRecord(vertex) && Number.isFinite(vertex.x) && Number.isFinite(vertex.y)) && Array.isArray(item.hiddenWalls) && item.hiddenWalls.every((wall) => Number.isInteger(wall)) && Array.isArray(item.openings) && Array.isArray(item.obstacles) && Array.isArray(item.sections) && (item.wallProfiles === undefined || Array.isArray(item.wallProfiles)) && (item.notes === undefined || typeof item.notes === "string") && isRecord(item.equipment) && Number.isInteger(item.version) && typeof item.updatedAt === "string" && hasString(item, "updatedBy"))) return false;
  if (!assemblyItems.every((item) => isWorkflowRecord(item)) || !installationItems.every((item) => isWorkflowRecord(item))) return false;
  if (!missingParts.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "sourceItemId") && hasString(item, "description") && hasString(item, "reportedBy") && ["reported", "in_progress", "resolved"].includes(item.status as string) && typeof item.createdAt === "string")) return false;
  if (!shipments.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "trackingCode") && Array.isArray(item.items) && item.items.every((shipmentItem) => isRecord(shipmentItem) && hasString(shipmentItem, "id") && hasString(shipmentItem, "name") && Number.isFinite(shipmentItem.listedQty)) && Array.isArray(item.discrepancies) && item.discrepancies.every((entry) => typeof entry === "string") && Array.isArray(item.history))) return false;
  if (!skpFiles.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "originalName") && hasString(item, "mimeType") && Number.isFinite(item.sizeBytes) && hasString(item, "storagePath") && hasString(item, "uploadedBy") && typeof item.uploadedAt === "string")) return false;
  if (!componentItems.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "sourceFileId") && hasString(item, "title") && ["pending", "completed", "problem"].includes(item.assemblyStatus as string) && ["pending", "completed", "problem"].includes(item.installationStatus as string) && Array.isArray(item.assemblyHistory) && Array.isArray(item.installationHistory))) return false;
  if (!faq.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "question") && hasString(item, "answer") && isStringArray(item.keywords))) return false;
  if (!plans.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "name") && (item.audience === "company" || item.audience === "specialist") && isStringArray(item.modules) && hasString(item, "summary") && hasString(item, "priceLabel"))) return false;
  return unansweredQuestions.every((item) => isRecord(item) && hasString(item, "id") && hasString(item, "question") && typeof item.at === "string");
}

function isWorkflowRecord(item: unknown): item is Record<string, unknown> {
  return isRecord(item) && hasString(item, "id") && hasString(item, "projectId") && hasString(item, "companyId") && hasString(item, "title") && hasString(item, "assigneeId") && ["pending", "completed", "problem"].includes(item.status as string) && Array.isArray(item.history);
}
export function readPlatform(options: { seedIfMissing?: boolean } = {}): PlatformState {
  const seedIfMissing = options.seedIfMissing ?? true;
  if (!fs.existsSync(filePath)) {
    if (!seedIfMissing) throw new Error("پایگاه داده پلتفرم وجود ندارد.");
    const initial = seed();
    writePlatform(initial);
    return initial;
  }

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!isPlatformState(parsed)) {
      throw new Error("ساختار پایگاه داده پلتفرم نامعتبر است.");
    }
    return {
      ...parsed,
      skpFiles: Array.isArray(parsed.skpFiles) ? parsed.skpFiles : [],
      componentItems: Array.isArray(parsed.componentItems) ? parsed.componentItems : [],
    };
  } catch (error) {
    throw new Error(`پایگاه داده پلتفرم قابل خواندن نیست: ${error instanceof Error ? error.message : "خطای نامشخص"}`);
  }
}

export function checkPlatformReadiness() {
  try {
    fs.accessSync(path.dirname(filePath), fs.constants.R_OK | fs.constants.W_OK);
    readPlatform({ seedIfMissing: false });
    return true;
  } catch {
    return false;
  }
}

export function writePlatform(state: PlatformState) {
  const temporaryPath = `${filePath}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    try {
      fs.unlinkSync(temporaryPath);
    } catch {
      // Preserve the original persistence error when cleanup is unavailable.
    }
    throw error;
  }
}

export function findUserByPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  return readPlatform().users.find((user) => user.phone.replace(/\D/g, "") === normalizedPhone);
}

export function findUserById(id: string) {
  return readPlatform().users.find((user) => user.id === id);
}

export function publicUser(user: SessionUser & { password?: string }): SessionUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    roleLabel: user.roleLabel,
    companyId: user.companyId,
    modules: user.modules,
  };
}

export function mutatePlatform(updater: (state: PlatformState) => PlatformState) {
  const next = updater(readPlatform());
  writePlatform(next);
  return next;
}
