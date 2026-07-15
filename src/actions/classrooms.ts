"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { classrooms } from "@/db/schema";
import { getClassroomById, isClassroomAdmin, setClassroomAdmins } from "@/db/queries/classrooms";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/actions/reservations";

const classroomSchema = z.object({
  name: z.string().min(1, "請輸入教室名稱"),
  location: z.string().min(1, "請輸入位置"),
  description: z.string().optional(),
  accessMethod: z.string().optional(),
});

export async function createClassroom(
  schoolSlug: string,
  schoolId: number,
  input: z.infer<typeof classroomSchema> & { adminIds?: string[] }
): Promise<ActionResult> {
  await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const parsed = classroomSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "輸入資料有誤。" };

  const [created] = await db
    .insert(classrooms)
    .values({ ...parsed.data, schoolId })
    .returning({ id: classrooms.id });

  if (created && input.adminIds && input.adminIds.length > 0) {
    await setClassroomAdmins(created.id, input.adminIds);
  }

  revalidatePath(`/${schoolSlug}/classrooms`);
  revalidatePath(`/${schoolSlug}/site-admin`);
  revalidatePath(`/${schoolSlug}`);
  return { ok: true };
}

export async function updateClassroom(
  schoolSlug: string,
  classroomId: number,
  input: z.infer<typeof classroomSchema>
): Promise<ActionResult> {
  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const parsed = classroomSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "輸入資料有誤。" };

  if (profile.role !== "SiteAdmin") {
    const allowed = await isClassroomAdmin(classroomId, profile.id);
    if (!allowed) return { ok: false, error: "無權限編輯此教室。" };
  }

  const room = await getClassroomById(classroomId);
  if (!room) return { ok: false, error: "找不到此教室。" };

  await db.update(classrooms).set(parsed.data).where(eq(classrooms.id, classroomId));

  revalidatePath(`/${schoolSlug}/classrooms`);
  revalidatePath(`/${schoolSlug}`);
  return { ok: true };
}

export async function updateClassroomAdmins(
  schoolSlug: string,
  classroomId: number,
  profileIds: string[]
): Promise<ActionResult> {
  await requireRole(schoolSlug, ["SiteAdmin"]);
  await setClassroomAdmins(classroomId, profileIds);

  revalidatePath(`/${schoolSlug}/site-admin`);
  revalidatePath(`/${schoolSlug}/classrooms`);
  revalidatePath(`/${schoolSlug}/bulk`);
  return { ok: true };
}
