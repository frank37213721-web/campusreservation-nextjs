import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classroomAdmins, classrooms, profiles } from "@/db/schema";

export async function getClassroomsForSchool(schoolId: number) {
  return db.select().from(classrooms).where(eq(classrooms.schoolId, schoolId)).orderBy(classrooms.id);
}

export async function getClassroomById(classroomId: number) {
  const [room] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1);
  return room ?? null;
}

/** Classrooms a given ClassAdmin manages (via classroom_admins), scoped to a school. */
export async function getClassroomsManagedBy(profileId: string, schoolId: number) {
  const rows = await db
    .select({ classroom: classrooms })
    .from(classroomAdmins)
    .innerJoin(classrooms, eq(classroomAdmins.classroomId, classrooms.id))
    .where(and(eq(classroomAdmins.profileId, profileId), eq(classrooms.schoolId, schoolId)));
  return rows.map((r) => r.classroom);
}

/** classroomId -> array of admin profile ids, for classrooms in the given school. */
export async function getClassroomAdminMap(schoolId: number): Promise<Map<number, string[]>> {
  const rows = await db
    .select({ classroomId: classroomAdmins.classroomId, profileId: classroomAdmins.profileId })
    .from(classroomAdmins)
    .innerJoin(classrooms, eq(classroomAdmins.classroomId, classrooms.id))
    .where(eq(classrooms.schoolId, schoolId));

  const map = new Map<number, string[]>();
  for (const row of rows) {
    const list = map.get(row.classroomId) ?? [];
    list.push(row.profileId);
    map.set(row.classroomId, list);
  }
  return map;
}

export async function getClassroomAdminEmails(classroomId: number): Promise<string[]> {
  const rows = await db
    .select({ email: profiles.email })
    .from(classroomAdmins)
    .innerJoin(profiles, eq(classroomAdmins.profileId, profiles.id))
    .where(eq(classroomAdmins.classroomId, classroomId));
  return rows.map((r) => r.email);
}

export async function isClassroomAdmin(classroomId: number, profileId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(classroomAdmins)
    .where(and(eq(classroomAdmins.classroomId, classroomId), eq(classroomAdmins.profileId, profileId)))
    .limit(1);
  return !!row;
}

export async function setClassroomAdmins(classroomId: number, profileIds: string[]) {
  await db.transaction(async (tx) => {
    await tx.delete(classroomAdmins).where(eq(classroomAdmins.classroomId, classroomId));
    if (profileIds.length > 0) {
      await tx
        .insert(classroomAdmins)
        .values(profileIds.map((profileId) => ({ classroomId, profileId })));
    }
  });
}

export async function classroomIdsManagedBy(profileId: string): Promise<number[]> {
  const rows = await db
    .select({ classroomId: classroomAdmins.classroomId })
    .from(classroomAdmins)
    .where(eq(classroomAdmins.profileId, profileId));
  return [...new Set(rows.map((r) => r.classroomId))];
}
