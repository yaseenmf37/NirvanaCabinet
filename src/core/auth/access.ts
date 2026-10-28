import type { ModuleKey, Project, SessionUser } from "../types";

export function hasModule(user: SessionUser, moduleKey: ModuleKey) {
  return user.modules.includes(moduleKey);
}

export function canAccessCompany(user: SessionUser, companyId: string) {
  return user.companyId === companyId;
}

export function canAccessProject(user: SessionUser, project: Project) {
  if (!canAccessCompany(user, project.companyId)) {
    return false;
  }

  if (user.role === "project_manager" || user.role === "production_manager") {
    return true;
  }

  return project.ownerId === user.id || project.memberIds.includes(user.id);
}

export function canManageWorkflow(user: SessionUser, assigneeId: string) {
  return user.role === "project_manager" || user.role === "production_manager" || user.id === assigneeId;
}

export function requireProjectAccess(user: SessionUser, project: Project | undefined) {
  if (!project || !canAccessProject(user, project)) {
    return false;
  }
  return true;
}

