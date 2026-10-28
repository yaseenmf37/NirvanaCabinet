import test from "node:test";
import assert from "node:assert/strict";
import { canAccessCompany, canAccessProject, canManageWorkflow, hasModule, requireProjectAccess } from "./access.ts";
import type { Project, SessionUser } from "../types/index.ts";

const user: SessionUser = {
  id: "u-1",
  name: "کاربر",
  phone: "09120000001",
  role: "installer",
  roleLabel: "نصاب",
  companyId: "co-1",
  modules: ["projects", "installation"],
};

const manager: SessionUser = { ...user, role: "project_manager", roleLabel: "مدیر پروژه", modules: ["projects"] };
const project: Project = {
  id: "p-1",
  companyId: "co-1",
  name: "پروژه",
  client: "مشتری",
  stage: "installation",
  status: "active",
  ownerId: "u-1",
  memberIds: ["u-1"],
  progress: 40,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

test("hasModule checks module membership", () => {
  assert.equal(hasModule(user, "installation"), true);
  assert.equal(hasModule(user, "cutting"), false);
});

test("company access requires same company", () => {
  assert.equal(canAccessCompany(user, "co-1"), true);
  assert.equal(canAccessCompany(user, "co-2"), false);
});

test("manager can access any company project", () => {
  assert.equal(canAccessProject(manager, project), true);
});

test("member can access assigned project only", () => {
  assert.equal(canAccessProject(user, project), true);
  assert.equal(canAccessProject(user, { ...project, ownerId: "other", memberIds: ["other"] }), false);
});

test("workflow access is limited to the assignee or managers", () => {
  assert.equal(canManageWorkflow(user, user.id), true);
  assert.equal(canManageWorkflow(user, "other"), false);
  assert.equal(canManageWorkflow(manager, "other"), true);
});
test("requireProjectAccess rejects missing or inaccessible project", () => {
  assert.equal(requireProjectAccess(user, undefined), false);
  assert.equal(requireProjectAccess(user, project), true);
});
