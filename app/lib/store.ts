import fs from "fs";
import path from "path";

export type ProjectItem = {
  id: string;
  name: string;
  stage: string;
  owner: string;
  status: string;
  progress: number;
};

export type TaskItem = {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: "بالا" | "متوسط" | "کم";
  status: string;
};

export type EmployeeItem = {
  id: string;
  name: string;
  role: string;
  team: string;
};

export const defaultProjects: ProjectItem[] = [
  { id: "proj-1", name: "پروژهٔ نوسازی آشپزخانه 12", stage: "برنامه‌ریزی و اندازه‌گیری", owner: "سعید محبی", status: "در حال بررسی", progress: 72 },
  { id: "proj-2", name: "پروژهٔ دکوراسیون فروشگاه", stage: "مونتاژ", owner: "لیلا فرهادی", status: "در جریان", progress: 64 },
  { id: "proj-3", name: "پروژهٔ ویلا شمالی", stage: "نصب", owner: "محسن اسفندیاری", status: "در انتظار تایید", progress: 84 },
  { id: "proj-4", name: "پروژهٔ واحد اداری", stage: "حمل و تحویل", owner: "نرگس رحیمی", status: "تکمیل‌شده", progress: 96 },
];

export const defaultTasks: TaskItem[] = [
  { id: "task-1", title: "ثبت ابعاد آشپزخانه 12", project: "پروژهٔ نوسازی آشپزخانه 12", assignee: "سعید محبی", priority: "بالا", status: "در حال انجام" },
  { id: "task-2", title: "تأیید بازشوها و درب‌ها", project: "پروژهٔ ویلا شمالی", assignee: "نسترن قاسمی", priority: "متوسط", status: "در انتظار بازبینی" },
  { id: "task-3", title: "بررسی قطعات گمشده", project: "پروژهٔ دکوراسیون فروشگاه", assignee: "محسن اسفندیاری", priority: "بالا", status: "نیاز به اقدام" },
  { id: "task-4", title: "تأیید نهایی نصب", project: "پروژهٔ واحد اداری", assignee: "رضا کاظمی", priority: "کم", status: "تکمیل‌شده" },
];

export const defaultEmployees: EmployeeItem[] = [
  { id: "emp-1", name: "سعید محبی", role: "مدیر پروژه", team: "تیم مدیریت" },
  { id: "emp-2", name: "نسترن قاسمی", role: "متخصص اندازه‌گیری", team: "برنامه‌ریزی" },
  { id: "emp-3", name: "محسن اسفندیاری", role: "مسئول برش", team: "برش" },
  { id: "emp-4", name: "رضا کاظمی", role: "نصاب", team: "نصب" },
];

const resolveStorePath = (name: string) => path.join(process.cwd(), "app", "data", `${name}.json`);

export function ensureStore(name: string, seed: unknown) {
  const filePath = resolveStorePath(name);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), "utf8");
  }

  return filePath;
}

export function readStore<T>(name: string, seed: T): T {
  const filePath = ensureStore(name, seed);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw ? (JSON.parse(raw) as T) : seed;
  } catch {
    return seed;
  }
}

export function writeStore<T>(name: string, value: T) {
  const filePath = resolveStorePath(name);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}
