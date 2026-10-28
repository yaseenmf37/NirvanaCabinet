import { NextResponse } from "next/server";
import { canAccessProject, hasModule, canManageWorkflow } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import type {
  ComponentStatus,
  ProjectStage,
  ProjectStatus,
  RoomModel,
  ShipmentCheck,
  WorkflowItem,
  ModuleKey,
  UserRole,
} from "@/src/core/types";
import { roleLabels } from "@/src/core/types";
import { validateRoom } from "@/src/lib/planning-geometry";
import { validateProjectText, validateWorkflowTitle, normalizePhone, normalizeProgress, isProjectStage, isProjectStatus, isActionType, isWorkflowKind, isComponentStatus, isShipmentPhase, isRecord, isNonEmptyId, isNonNegativeQuantity, isMissingPartStatus } from "@/src/core/validation/actions";
import { mutatePlatform } from "@/src/services/store/platform-db";
import { hashPassword } from "@/src/core/auth/password";
import { randomUUID } from "node:crypto";

const NO_STORE = { "Cache-Control": "no-store" };

type ActionBody =
  | { type: "save_room"; room: RoomModel }
  | { type: "set_workflow"; kind: "assembly" | "installation"; id: string; status: ComponentStatus; reason?: string }
  | { type: "set_component_status"; componentId: string; stage: "assembly" | "installation"; status: ComponentStatus; reason?: string }
  | { type: "confirm_shipment"; shipmentId: string; phase: "dispatch" | "receipt"; check: Omit<ShipmentCheck, "actorId" | "actorName" | "at"> }
  | { type: "create_workflow"; kind: "assembly" | "installation"; projectId: string; title: string; assigneeId: string }
  | { type: "create_project"; name: string; client: string; stage?: ProjectStage }
  | { type: "update_project"; projectId: string; patch: { status?: ProjectStatus; progress?: number; stage?: ProjectStage; memberIds?: string[] } }
  | { type: "update_missing_part"; id: string; status: "reported" | "in_progress" | "resolved" }
  | { type: "publish_faq_answer"; questionId: string; answer: string; keywords: string[] }
  | { type: "add_employee"; name: string; phone: string; password: string; role: UserRole }
  | { type: "remove_employee"; employeeId: string };

function stamp() {
  return new Date().toISOString();
}

function eventId() {
  return `ev-${randomUUID()}`;
}

function entityId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: "بدنه درخواست معتبر نیست." }, { status: 400, headers: NO_STORE });
  }

  const rawBody = body as unknown as Record<string, unknown>;
  if (!rawBody || typeof rawBody !== "object" || !isActionType(rawBody.type)) {
    return NextResponse.json({ error: "نوع عملیات معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if ("kind" in rawBody && !isWorkflowKind(rawBody.kind)) return NextResponse.json({ error: "نوع workflow معتبر نیست." }, { status: 400, headers: NO_STORE });
  if (rawBody.type === "set_workflow" && "status" in rawBody && !isComponentStatus(rawBody.status)) return NextResponse.json({ error: "وضعیت workflow معتبر نیست." }, { status: 400, headers: NO_STORE });
  if (rawBody.type === "update_project" && "status" in rawBody && !isProjectStatus(rawBody.status)) return NextResponse.json({ error: "وضعیت پروژه معتبر نیست." }, { status: 400, headers: NO_STORE });
  if (rawBody.type === "update_missing_part" && "status" in rawBody && !isMissingPartStatus(rawBody.status)) return NextResponse.json({ error: "وضعیت قطعه مفقود معتبر نیست." }, { status: 400, headers: NO_STORE });
  if ("phase" in rawBody && !isShipmentPhase(rawBody.phase)) return NextResponse.json({ error: "مرحله محموله معتبر نیست." }, { status: 400, headers: NO_STORE });

  if (!isRecord(body) || !isActionType(body.type)) {
    return NextResponse.json({ error: "نوع عملیات معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "save_room" && (!isRecord(body.room) || !isNonEmptyId(body.room.id) || !isNonEmptyId(body.room.projectId) || !Array.isArray(body.room.vertices) || !Array.isArray(body.room.openings) || !Array.isArray(body.room.obstacles) || !Array.isArray(body.room.sections))) {
    return NextResponse.json({ error: "مدل اتاق معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "set_component_status" && (!isNonEmptyId(body.componentId) || !["assembly", "installation"].includes(body.stage) || !isComponentStatus(body.status) || (body.reason !== undefined && typeof body.reason !== "string"))) {
    return NextResponse.json({ error: "اطلاعات وضعیت قطعه معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "set_workflow" && (!isWorkflowKind(body.kind) || !isNonEmptyId(body.id) || !isComponentStatus(body.status) || (body.reason !== undefined && typeof body.reason !== "string"))) {
    return NextResponse.json({ error: "اطلاعات workflow معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "create_workflow" && (!isWorkflowKind(body.kind) || !isNonEmptyId(body.projectId) || !isNonEmptyId(body.assigneeId) || typeof body.title !== "string")) {
    return NextResponse.json({ error: "اطلاعات وظیفه معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "create_project" && (typeof body.name !== "string" || typeof body.client !== "string" || (body.stage !== undefined && !isProjectStage(body.stage)))) {
    return NextResponse.json({ error: "اطلاعات پروژه معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "update_project" && (!isNonEmptyId(body.projectId) || !isRecord(body.patch) || (body.patch.memberIds !== undefined && (!Array.isArray(body.patch.memberIds) || body.patch.memberIds.some((id) => !isNonEmptyId(id)))))) {
    return NextResponse.json({ error: "اطلاعات به‌روزرسانی معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "confirm_shipment" && (!isNonEmptyId(body.shipmentId) || !isShipmentPhase(body.phase) || !isRecord(body.check) || !Array.isArray(body.check.items))) {
    return NextResponse.json({ error: "اطلاعات تأیید محموله معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "update_missing_part" && (!isNonEmptyId(body.id) || !isMissingPartStatus(body.status))) {
    return NextResponse.json({ error: "وضعیت قطعه مفقود معتبر نیست." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "confirm_shipment" && body.check.items.some((item) => !isRecord(item) || !isNonEmptyId(item.id) || !isNonNegativeQuantity(item.qty) || !["good", "damaged", "incomplete", "missing"].includes(item.condition as string) || (item.note !== undefined && typeof item.note !== "string"))) {
    return NextResponse.json({ error: "اقلام تأیید محموله معتبر نیستند." }, { status: 400, headers: NO_STORE });
  }
  if (body.type === "publish_faq_answer" && (!isNonEmptyId(body.questionId) || typeof body.answer !== "string" || body.answer.trim().length < 3 || body.answer.length > 5000 || !Array.isArray(body.keywords) || body.keywords.some((keyword) => typeof keyword !== "string" || keyword.length > 80))) return NextResponse.json({ error: "پاسخ FAQ معتبر نیست." }, { status: 400, headers: NO_STORE });

  if (body.type === "remove_employee" && !isNonEmptyId(body.employeeId)) return NextResponse.json({ error: "شناسه کارمند معتبر نیست." }, { status: 400, headers: NO_STORE });
  if (body.type === "confirm_shipment") {
    const ids = body.check.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "هر قلم محموله فقط یک‌بار باید ثبت شود." }, { status: 400, headers: NO_STORE });
    }
  }

  try {
    const state = mutatePlatform((current) => {
      if (body.type === "save_room") {
        if (!hasModule(user, "planning")) throw new Error("ماژول برنامه‌ریزی برای این حساب فعال نیست.");
        const roomIssues = validateRoom(body.room);
        if (roomIssues.length) throw new Error(`مدل اتاق معتبر نیست: ${roomIssues.join("، ")}`);
        const project = current.projects.find((item) => item.id === body.room.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی به این پروژه مجاز نیست.");
        const existingRoom = current.rooms.find((item) => item.id === body.room.id);
        if (existingRoom && (existingRoom.projectId !== project.id || existingRoom.companyId !== project.companyId)) {
          throw new Error("شناسه اتاق با پروژه انتخاب‌شده سازگار نیست.");
        }
        const submittedVersion = body.room.version;
        if (!Number.isInteger(submittedVersion) || submittedVersion < 0) {
          throw new Error("نسخه مدل اتاق معتبر نیست.");
        }
        if (existingRoom && submittedVersion !== existingRoom.version) {
          throw new Error("مدل اتاق در درخواست دیگری تغییر کرده است؛ ابتدا داده جدید را دریافت کنید.");
        }
        if (!existingRoom && submittedVersion !== 0) {
          throw new Error("مدل اتاق جدید باید از نسخه صفر شروع شود.");
        }

        const room: RoomModel = {
          ...body.room,
          companyId: project.companyId,
          version: submittedVersion + 1,
          updatedAt: stamp(),
          updatedBy: user.id,
        };
        const rooms = current.rooms.some((item) => item.id === room.id)
          ? current.rooms.map((item) => (item.id === room.id ? room : item))
          : [...current.rooms, room];
        return { ...current, rooms };
      }

      if (body.type === "set_workflow") {
        const moduleKey = body.kind === "assembly" ? "assembly" : "installation";
        if (!hasModule(user, moduleKey)) throw new Error("این ماژول برای حساب شما فعال نیست.");
        const key = body.kind === "assembly" ? "assemblyItems" : "installationItems";
        const items = current[key] as WorkflowItem[];
        const target = items.find((item) => item.id === body.id);
        if (!target) throw new Error("آیتم پیدا نشد.");
        if (!canManageWorkflow(user, target.assigneeId)) throw new Error("فقط مسئول وظیفه یا مدیر مجاز می‌تواند وضعیت را تغییر دهد.");
        const project = current.projects.find((item) => item.id === target.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی مجاز نیست.");
        if (body.status === "problem" && !body.reason?.trim()) {
          throw new Error("برای وضعیت مشکل باید دلیل ثبت شود.");
        }
        if (body.status === "completed" || body.status === "pending") {
          target.problemReason = undefined;
        } else if (body.status === "problem") {
          target.problemReason = body.reason?.trim();
        }
        target.status = body.status;
        target.history = [
          ...target.history,
          {
            id: eventId(),
            at: stamp(),
            actorId: user.id,
            actorName: user.name,
            action: body.status,
            detail: body.reason?.trim(),
          },
        ];

        let missingParts = current.missingParts;
        if (body.kind === "assembly" && body.status === "problem" && body.reason) {
          const hasActiveMissingPart = missingParts.some(
            (item) => item.sourceItemId === target.id && item.status !== "resolved",
          );
          if (!hasActiveMissingPart) {
            missingParts = [
              {
                id: entityId("miss"),
                projectId: target.projectId,
                companyId: target.companyId,
                sourceItemId: target.id,
                description: body.reason.trim(),
                reportedBy: user.id,
                status: "reported",
                createdAt: stamp(),
              },
              ...missingParts,
            ];
          }
        }

        return { ...current, [key]: items, missingParts };
      }

      if (body.type === "set_component_status") {
        const moduleKey = body.stage === "assembly" ? "assembly" : "installation";
        if (!hasModule(user, moduleKey)) throw new Error("این ماژول برای حساب شما فعال نیست.");
        const component = (current.componentItems ?? []).find((item) => item.id === body.componentId);
        if (!component) throw new Error("آیتم پیدا نشد.");
        const project = current.projects.find((item) => item.id === component.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی مجاز نیست.");
        if (body.status === "problem" && !body.reason?.trim()) throw new Error("برای وضعیت مشکل باید دلیل ثبت شود.");
        const entry = { id: eventId(), at: stamp(), actorId: user.id, actorName: user.name, action: `${body.stage}_${body.status}`, detail: body.reason?.trim() };
        if (body.stage === "assembly") {
          component.assemblyStatus = body.status;
          component.assemblyHistory = [...component.assemblyHistory, entry];
        } else {
          component.installationStatus = body.status;
          component.installationHistory = [...component.installationHistory, entry];
        }
        const matchWorkflow = (item: WorkflowItem) => item.componentId === component.id;
        const sync = (items: WorkflowItem[]) => items.map((item) => matchWorkflow(item) ? { ...item, status: body.status, problemReason: body.status === "problem" ? body.reason?.trim() : body.status === "pending" ? undefined : item.problemReason, history: [...item.history, entry] } : item);
        const assemblyItems = body.stage === "assembly" ? sync(current.assemblyItems) : current.assemblyItems.map((item) => item);
        const installationItems = body.stage === "installation" ? sync(current.installationItems) : current.installationItems.map((item) => item);
        let missingParts = current.missingParts;
        if (body.stage === "assembly" && body.status === "problem" && body.reason) {
          const hasActiveMissingPart = missingParts.some((item) => item.sourceItemId === component.id || item.sourceItemId === assemblyItems.find((target) => target.componentId === component.id)?.id) && missingParts.some((item) => item.status !== "resolved");
          if (!hasActiveMissingPart) {
            missingParts = [{ id: entityId("miss"), projectId: component.projectId, companyId: component.companyId, sourceItemId: component.id, description: body.reason.trim(), reportedBy: user.id, status: "reported", createdAt: stamp() }, ...missingParts];
          }
        }
        return { ...current, componentItems: (current.componentItems ?? []).map((item) => item.id === component.id ? { ...component } : item), assemblyItems, installationItems, missingParts };
      }

      if (body.type === "confirm_shipment") {
        if (!hasModule(user, "logistics")) throw new Error("ماژول حمل برای این حساب فعال نیست.");
        const shipment = current.shipments.find((item) => item.id === body.shipmentId);
        if (!shipment) throw new Error("محموله پیدا نشد.");
        const project = current.projects.find((item) => item.id === shipment.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی مجاز نیست.");
        if (shipment[body.phase]) {
          throw new Error("این تأیید قبلاً ثبت شده و بازنویسی نمی‌شود.");
        }
        const listedIds = new Set(shipment.items.map((item) => item.id));
        const submittedIds = new Set(body.check.items.map((item) => item.id));
        if (submittedIds.size !== listedIds.size || [...listedIds].some((id) => !submittedIds.has(id))) {
          throw new Error("باید برای تمام اقلام محموله دقیقاً یک وضعیت ثبت شود.");
        }
        if (body.check.items.some((item) => item.qty > (shipment.items.find((listed) => listed.id === item.id)?.listedQty ?? 0))) {
          throw new Error("مقدار تأییدشده نمی‌تواند از مقدار فهرست‌شده بیشتر باشد.");
        }
        if (body.check.photoNote !== undefined && (typeof body.check.photoNote !== "string" || body.check.photoNote.length > 2000)) {
          throw new Error("یادداشت تصویر معتبر نیست.");
        }
        if (body.check.items.some((item) => item.note !== undefined && item.note.length > 500)) {
          throw new Error("یادداشت قلم محموله بیش از حد طولانی است.");
        }

        const check: ShipmentCheck = {
          ...body.check,
          actorId: user.id,
          actorName: user.name,
          at: stamp(),
        };
        shipment[body.phase] = check;
        shipment.history = [
          ...shipment.history,
          {
            id: eventId(),
            at: check.at,
            actorId: user.id,
            actorName: user.name,
            action: body.phase === "dispatch" ? "dispatch_confirmed" : "receipt_confirmed",
          },
        ];

        if (shipment.dispatch && shipment.receipt) {
          const listed = new Map(shipment.items.map((item) => [item.id, item.listedQty]));
          const sent = new Map(shipment.dispatch.items.map((item) => [item.id, item]));
          const received = new Map(shipment.receipt.items.map((item) => [item.id, item]));
          const issues: string[] = [];
          for (const item of shipment.items) {
            const dispatched = sent.get(item.id);
            const delivered = received.get(item.id);
            if (!dispatched || !delivered || dispatched.qty !== listed.get(item.id) || delivered.qty !== listed.get(item.id) || delivered.qty !== dispatched.qty || delivered.condition !== "good") {
              issues.push(`${item.id}: ارسال ${dispatched?.qty ?? "—"} / دریافت ${delivered?.qty ?? "—"} / وضعیت ${delivered?.condition ?? "missing"}`);
            }
          }
          shipment.discrepancies = issues;
        }

        return { ...current, shipments: current.shipments };
      }

      if (body.type === "update_missing_part") {
        if (!hasModule(user, "assembly") && !hasModule(user, "cutting")) throw new Error("ماژول مونتاژ یا برش برای این حساب فعال نیست.");
        const part = current.missingParts.find((item) => item.id === body.id);
        const project = part && current.projects.find((item) => item.id === part.projectId);
        if (!part || !project || !canAccessProject(user, project)) throw new Error("دسترسی به قطعه مفقود مجاز نیست.");
        const previousStatus = part.status;
        if (body.status === "reported" && part.status !== "reported") throw new Error("بازگرداندن وضعیت قطعه به گزارش‌شده مجاز نیست.");
        if (part.status === "resolved" && body.status !== "resolved") throw new Error("قطعه رفع‌شده قابل بازگشایی نیست.");
        part.status = body.status;
        if (previousStatus !== body.status) {
          const source = current.assemblyItems.find((item) => item.id === part.sourceItemId);
          if (source) source.history = [...source.history, { id: eventId(), at: stamp(), actorId: user.id, actorName: user.name, action: `missing_part_${body.status}`, detail: part.description }];
        }
        return { ...current, assemblyItems: [...current.assemblyItems], missingParts: [...current.missingParts] };
      }
      if (body.type === "create_workflow") {
        const moduleKey = body.kind === "assembly" ? "assembly" : "installation";
        if (!hasModule(user, moduleKey)) throw new Error("این ماژول برای حساب شما فعال نیست.");
        const title = validateWorkflowTitle(body.title);
        if (!title) throw new Error("عنوان وظیفه الزامی و حداکثر ۲۰۰ نویسه است.");
        const project = current.projects.find((item) => item.id === body.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی به این پروژه مجاز نیست.");
        const assignee = current.users.find((item) => item.id === body.assigneeId && item.companyId === project.companyId);
        if (!assignee) throw new Error("مسئول وظیفه معتبر نیست.");
        const item: WorkflowItem = { id: entityId("workflow"), projectId: project.id, companyId: project.companyId, title, assigneeId: assignee.id, status: "pending", history: [] };
        return body.kind === "assembly" ? { ...current, assemblyItems: [item, ...current.assemblyItems] } : { ...current, installationItems: [item, ...current.installationItems] };
      }

      if (body.type === "publish_faq_answer") {
        if (user.role !== "project_manager" && user.role !== "production_manager") throw new Error("فقط مدیران می‌توانند پاسخ FAQ را منتشر کنند.");
        const question = current.unansweredQuestions.find((item) => item.id === body.questionId);
        if (!question) throw new Error("سؤال پیدا نشد.");
        const answer = body.answer.trim();
        const keywords = [...new Set(body.keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean))];
        const faq = [...current.faq, { id: entityId("faq"), question: question.question, answer, keywords }];
        return { ...current, faq, unansweredQuestions: current.unansweredQuestions.filter((item) => item.id !== question.id) };
      }

      if (body.type === "add_employee") {
        if (user.role !== "project_manager" && user.role !== "production_manager") throw new Error("فقط مدیران می‌توانند کارمند اضافه کنند.");
        const phone = normalizePhone(body.phone);
        if (!phone) throw new Error("شماره تماس معتبر وارد کنید.");
        if (current.users.some((item) => normalizePhone(item.phone) === phone)) throw new Error("این شماره تماس قبلاً ثبت شده است.");
        const employee = { id: entityId("user"), name: body.name.trim(), phone, password: hashPassword(body.password), role: body.role, roleLabel: roleLabels[body.role], companyId: user.companyId, modules: ["projects"] as ModuleKey[] };
        return { ...current, users: [...current.users, employee] };
      }

      if (body.type === "remove_employee") {
        if (user.role !== "project_manager" && user.role !== "production_manager") throw new Error("فقط مدیران می‌توانند کارمند حذف کنند.");
        if (body.employeeId === user.id) throw new Error("حساب فعال خودتان را نمی‌توانید حذف کنید.");
        const employee = current.users.find((item) => item.id === body.employeeId && item.companyId === user.companyId);
        if (!employee) throw new Error("کارمند پیدا نشد.");
        const used = current.projects.some((project) => project.ownerId === employee.id || project.memberIds.includes(employee.id)) || current.assemblyItems.some((item) => item.assigneeId === employee.id) || current.installationItems.some((item) => item.assigneeId === employee.id);
        if (used) throw new Error("این کارمند در پروژه یا وظیفه استفاده شده و قابل حذف نیست.");
        return { ...current, users: current.users.filter((item) => item.id !== employee.id) };
      }

      if (body.type === "create_project") {
        if (!hasModule(user, "projects")) throw new Error("ماژول پروژه‌ها برای این حساب فعال نیست.");
        const name = validateProjectText(body.name);
        const client = validateProjectText(body.client);
        if (!name || !client) throw new Error("نام پروژه و مشتری الزامی است و باید حداکثر ۱۶۰ نویسه باشد.");
        if (body.stage !== undefined && !isProjectStage(body.stage)) throw new Error("مرحله پروژه معتبر نیست.");
        const created = {
          id: entityId("project"),
          companyId: user.companyId,
          name,
          client,
          stage: body.stage ?? "planning",
          status: "review" as const,
          ownerId: user.id,
          memberIds: [user.id],
          progress: 0,
          createdAt: stamp(),
          updatedAt: stamp(),
          auditHistory: [{ id: eventId(), at: stamp(), actorId: user.id, actorName: user.name, action: "project_created", detail: "پروژه ایجاد شد" }],
        };
        return { ...current, projects: [...current.projects, created] };
      }

      if (body.type === "update_project") {
        if (!hasModule(user, "projects")) throw new Error("ماژول پروژه‌ها برای این حساب فعال نیست.");
        const project = current.projects.find((item) => item.id === body.projectId);
        if (!project || !canAccessProject(user, project)) throw new Error("دسترسی به این پروژه مجاز نیست.");
        if (user.role !== "project_manager" && user.role !== "production_manager") {
          throw new Error("فقط مدیر پروژه یا مدیر تولید می‌تواند مشخصات پروژه را تغییر دهد.");
        }
        const patch = body.patch ?? {};
        const requestedProgress = normalizeProgress(patch.progress, project.progress);
        if (requestedProgress === null) throw new Error("درصد پیشرفت باید یک عدد معتبر باشد.");
        const progress = requestedProgress;
        if (patch.status !== undefined && !isProjectStatus(patch.status)) throw new Error("وضعیت پروژه معتبر نیست.");
        if (patch.stage !== undefined && !isProjectStage(patch.stage)) throw new Error("مرحله پروژه معتبر نیست.");
        let memberIds = project.memberIds;
        if (patch.memberIds !== undefined) {
          const uniqueMemberIds = [...new Set(patch.memberIds)];
          const companyMemberIds = new Set(current.users.filter((item) => item.companyId === project.companyId).map((item) => item.id));
          if (uniqueMemberIds.some((memberId) => !companyMemberIds.has(memberId))) throw new Error("همه اعضای انتخاب‌شده باید از شرکت همین پروژه باشند.");
          memberIds = uniqueMemberIds;
        }
        const changes = [
          patch.status !== undefined && patch.status !== project.status ? `status: ${project.status} -> ${patch.status}` : null,
          patch.stage !== undefined && patch.stage !== project.stage ? `stage: ${project.stage} -> ${patch.stage}` : null,
          progress !== project.progress ? `progress: ${project.progress} -> ${progress}` : null,
          JSON.stringify(memberIds) !== JSON.stringify(project.memberIds) ? "members updated" : null,
        ].filter(Boolean).join(", ");
        const auditHistory = changes ? [...(project.auditHistory ?? []), { id: eventId(), at: stamp(), actorId: user.id, actorName: user.name, action: "project_updated", detail: changes }] : (project.auditHistory ?? []);
        const nextProject = {
          ...project,
          status: patch.status ?? project.status,
          stage: patch.stage ?? project.stage,
          memberIds: memberIds ?? project.memberIds,
          progress,
          auditHistory,
          updatedAt: stamp(),
        };
        return { ...current, projects: current.projects.map((item) => (item.id === project.id ? nextProject : item)) };
      }

      return current;
    });

    return NextResponse.json({ ok: true, savedAt: stamp(), user, versionStamp: state.rooms.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای نامشخص";
    return NextResponse.json({ error: message }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
}
