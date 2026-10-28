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

const storageKeys = {
  projects: "newnirvana-projects",
  tasks: "newnirvana-tasks",
};

export const defaultProjects: ProjectItem[] = [
  {
    id: "proj-1",
    name: "پروژهٔ نوسازی آشپزخانه 12",
    stage: "برنامه‌ریزی و اندازه‌گیری",
    owner: "سعید محبی",
    status: "در حال بررسی",
    progress: 72,
  },
  {
    id: "proj-2",
    name: "پروژهٔ دکوراسیون فروشگاه",
    stage: "مونتاژ",
    owner: "لیلا فرهادی",
    status: "در جریان",
    progress: 64,
  },
  {
    id: "proj-3",
    name: "پروژهٔ ویلا شمالی",
    stage: "نصب",
    owner: "محسن اسفندیاری",
    status: "در انتظار تایید",
    progress: 84,
  },
  {
    id: "proj-4",
    name: "پروژهٔ واحد اداری",
    stage: "حمل و تحویل",
    owner: "نرگس رحیمی",
    status: "تکمیل‌شده",
    progress: 96,
  },
];

export const defaultTasks: TaskItem[] = [
  {
    id: "task-1",
    title: "ثبت ابعاد آشپزخانه 12",
    project: "پروژهٔ نوسازی آشپزخانه 12",
    assignee: "سعید محبی",
    priority: "بالا",
    status: "در حال انجام",
  },
  {
    id: "task-2",
    title: "تأیید بازشوها و درب‌ها",
    project: "پروژهٔ ویلا شمالی",
    assignee: "نسترن قاسمی",
    priority: "متوسط",
    status: "در انتظار بازبینی",
  },
  {
    id: "task-3",
    title: "بررسی قطعات گمشده",
    project: "پروژهٔ دکوراسیون فروشگاه",
    assignee: "محسن اسفندیاری",
    priority: "بالا",
    status: "نیاز به اقدام",
  },
  {
    id: "task-4",
    title: "تأیید نهایی نصب",
    project: "پروژهٔ واحد اداری",
    assignee: "رضا کاظمی",
    priority: "کم",
    status: "تکمیل‌شده",
  },
];

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readProjects() {
  return readStoredValue<ProjectItem[]>(storageKeys.projects, defaultProjects);
}

export function writeProjects(projects: ProjectItem[]) {
  writeStoredValue(storageKeys.projects, projects);
}

export function readTasks() {
  return readStoredValue<TaskItem[]>(storageKeys.tasks, defaultTasks);
}

export function writeTasks(tasks: TaskItem[]) {
  writeStoredValue(storageKeys.tasks, tasks);
}
