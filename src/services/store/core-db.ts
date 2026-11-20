import { eq } from "drizzle-orm";
import { getSqlRepository } from "@/src/services/store/sql-repository";
import { companies, users, projects, projectMembers } from "@/src/db/schema";

export async function findUserDb(id: string) {
  return (await getSqlRepository().select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function listProjectsForUserDb(userId: string) {
  const database = getSqlRepository();
  const userRows = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return [];
  if (user.role === "project_manager" || user.role === "production_manager") {
    return database.select().from(projects).where(eq(projects.companyId, user.companyId));
  }
  return database.select({ project: projects }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id)).where(eq(projectMembers.userId, userId)).then((rows) => rows.map((row) => row.project));
}

export async function findCompanyDb(id: string) {
  return (await getSqlRepository().select().from(companies).where(eq(companies.id, id)).limit(1))[0];
}
