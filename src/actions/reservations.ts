"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getClassroomAdminEmails, getClassroomById, isClassroomAdmin } from "@/db/queries/classrooms";
import { getReservationById, hasConflict } from "@/db/queries/reservations";
import { requireRole, requireUser } from "@/lib/auth";
import { addDays, isWeekend, todayInTaipei, TIME_SLOTS } from "@/lib/dates";
import { notifyAdminsNewReservation } from "@/lib/email";

const BOOKING_WINDOW_DAYS = 14;

const newReservationSchema = z.object({
  classroomId: z.number().int().positive(),
  requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.enum(TIME_SLOTS),
  endTime: z.enum(TIME_SLOTS),
  purpose: z.string().min(1),
});

export type ActionResult = { ok: true } | { ok: false; error: string };
export type BulkActionResult =
  | { ok: true; count: number; warning?: string }
  | { ok: false; error: string };

export async function createReservation(
  schoolSlug: string,
  schoolId: number,
  input: z.infer<typeof newReservationSchema>
): Promise<ActionResult> {
  const profile = await requireUser(schoolSlug);
  const parsed = newReservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "輸入資料有誤。" };
  const { classroomId, requestDate, startTime, endTime, purpose } = parsed.data;

  if (startTime >= endTime) {
    return { ok: false, error: "結束時間必須晚於開始時間。" };
  }
  const today = todayInTaipei();
  const maxDate = addDays(today, BOOKING_WINDOW_DAYS);
  if (requestDate < today || requestDate > maxDate) {
    return { ok: false, error: `只能預約未來 ${BOOKING_WINDOW_DAYS} 天內的日期。` };
  }

  const room = await getClassroomById(classroomId);
  if (!room || room.schoolId !== schoolId) {
    return { ok: false, error: "找不到此教室。" };
  }

  if (await hasConflict(classroomId, requestDate, startTime, endTime)) {
    return { ok: false, error: "該時段已有預約，請選擇其他時間。" };
  }

  const [created] = await db
    .insert(reservations)
    .values({
      userId: profile.id,
      classroomId,
      schoolId,
      requestDate,
      startTime,
      endTime,
      purpose,
      status: "PENDING",
    })
    .returning({ id: reservations.id });

  const adminEmails = await getClassroomAdminEmails(classroomId);
  await notifyAdminsNewReservation(
    {
      classroomName: room.name,
      requestDate,
      startTime,
      endTime,
      purpose,
      userName: profile.fullName,
      userDept: profile.department,
    },
    adminEmails
  );

  revalidatePath(`/${schoolSlug}`);
  revalidatePath(`/${schoolSlug}/dashboard`);
  return created ? { ok: true } : { ok: false, error: "建立預約失敗，請稍後再試。" };
}

const editReservationSchema = z.object({
  startTime: z.enum(TIME_SLOTS),
  endTime: z.enum(TIME_SLOTS),
  purpose: z.string().min(1),
});

export async function updateReservation(
  schoolSlug: string,
  reservationId: number,
  input: z.infer<typeof editReservationSchema>
): Promise<ActionResult> {
  const profile = await requireUser(schoolSlug);
  const parsed = editReservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "輸入資料有誤。" };
  const { startTime, endTime, purpose } = parsed.data;

  if (startTime >= endTime) {
    return { ok: false, error: "結束時間必須晚於開始時間。" };
  }

  const existing = await getReservationById(reservationId);
  if (!existing) return { ok: false, error: "找不到此預約資料。" };
  if (existing.userId !== profile.id) return { ok: false, error: "無權限修改此預約。" };
  if (existing.status !== "PENDING") return { ok: false, error: "只能修改審核中的預約。" };

  if (await hasConflict(existing.classroomId, existing.requestDate, startTime, endTime, reservationId)) {
    return { ok: false, error: "該時段已有預約，請選擇其他時間。" };
  }

  await db
    .update(reservations)
    .set({ startTime, endTime, purpose, status: "PENDING" })
    .where(eq(reservations.id, reservationId));

  revalidatePath(`/${schoolSlug}`);
  revalidatePath(`/${schoolSlug}/dashboard`);
  return { ok: true };
}

export async function cancelReservation(schoolSlug: string, reservationId: number): Promise<ActionResult> {
  const profile = await requireUser(schoolSlug);
  const existing = await getReservationById(reservationId);
  if (!existing) return { ok: false, error: "找不到此預約資料。" };
  if (existing.userId !== profile.id) return { ok: false, error: "無權限取消此預約。" };
  if (existing.status !== "PENDING") return { ok: false, error: "只能取消審核中的預約。" };

  await db.update(reservations).set({ status: "CANCELLED" }).where(eq(reservations.id, reservationId));

  revalidatePath(`/${schoolSlug}`);
  revalidatePath(`/${schoolSlug}/dashboard`);
  return { ok: true };
}

export async function setReservationStatus(
  schoolSlug: string,
  reservationId: number,
  status: "APPROVED" | "REJECTED"
): Promise<ActionResult> {
  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const existing = await getReservationById(reservationId);
  if (!existing) return { ok: false, error: "找不到此預約資料。" };

  if (profile.role !== "SiteAdmin") {
    const allowed = await isClassroomAdmin(existing.classroomId, profile.id);
    if (!allowed) return { ok: false, error: "無權限審核此教室的預約。" };
  }

  await db.update(reservations).set({ status }).where(eq(reservations.id, reservationId));

  revalidatePath(`/${schoolSlug}/admin`);
  revalidatePath(`/${schoolSlug}`);
  return { ok: true };
}

const bulkMultiDaySchema = z.object({
  classroomId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string(),
  purpose: z.string().min(1),
  weekdaysOnly: z.boolean(),
});

export async function createBulkMultiDayReservations(
  schoolSlug: string,
  schoolId: number,
  input: z.infer<typeof bulkMultiDaySchema>
): Promise<BulkActionResult> {
  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const parsed = bulkMultiDaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "輸入資料有誤。" };
  const { classroomId, startDate, endDate, department, purpose, weekdaysOnly } = parsed.data;

  if (profile.role !== "SiteAdmin") {
    const allowed = await isClassroomAdmin(classroomId, profile.id);
    if (!allowed) return { ok: false, error: "您沒有這間教室的管理權限。" };
  }

  const fullPurpose = department ? `[${department}] ${purpose}` : purpose;
  const rows: (typeof reservations.$inferInsert)[] = [];
  let conflicts = 0;
  let cursor = startDate;
  while (cursor <= endDate) {
    if (!(weekdaysOnly && isWeekend(cursor))) {
      if (await hasConflict(classroomId, cursor, "08:00", "17:00")) {
        conflicts += 1;
      }
      rows.push({
        userId: profile.id,
        classroomId,
        schoolId,
        requestDate: cursor,
        startTime: "08:00",
        endTime: "17:00",
        purpose: fullPurpose,
        status: "APPROVED",
      });
    }
    cursor = addDays(cursor, 1);
  }

  if (rows.length === 0) return { ok: false, error: "選取的區間內沒有可預約的日期。" };

  await db.insert(reservations).values(rows);

  revalidatePath(`/${schoolSlug}/bulk`);
  revalidatePath(`/${schoolSlug}`);
  return {
    ok: true,
    count: rows.length,
    ...(conflicts > 0
      ? { warning: `已建立 ${rows.length} 筆預約，其中 ${conflicts} 筆與既有預約時段重疊，請留意。` }
      : {}),
  };
}

const bulkRecurringSchema = z.object({
  classroomId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.enum(TIME_SLOTS),
  endTime: z.enum(TIME_SLOTS),
  department: z.string(),
  purpose: z.string().min(1),
  weeks: z.number().int().min(1).max(21),
});

export async function createBulkRecurringReservations(
  schoolSlug: string,
  schoolId: number,
  input: z.infer<typeof bulkRecurringSchema>
): Promise<BulkActionResult> {
  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const parsed = bulkRecurringSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "輸入資料有誤。" };
  const { classroomId, startDate, startTime, endTime, department, purpose, weeks } = parsed.data;

  if (startTime >= endTime) {
    return { ok: false, error: "結束時間必須晚於開始時間。" };
  }
  if (profile.role !== "SiteAdmin") {
    const allowed = await isClassroomAdmin(classroomId, profile.id);
    if (!allowed) return { ok: false, error: "您沒有這間教室的管理權限。" };
  }

  const fullPurpose = department ? `[${department}] ${purpose}` : purpose;
  const rows: (typeof reservations.$inferInsert)[] = [];
  let conflicts = 0;
  for (let i = 0; i < weeks; i++) {
    const date = addDays(startDate, i * 7);
    if (await hasConflict(classroomId, date, startTime, endTime)) {
      conflicts += 1;
    }
    rows.push({
      userId: profile.id,
      classroomId,
      schoolId,
      requestDate: date,
      startTime,
      endTime,
      purpose: fullPurpose,
      status: "APPROVED",
    });
  }

  await db.insert(reservations).values(rows);

  revalidatePath(`/${schoolSlug}/bulk`);
  revalidatePath(`/${schoolSlug}`);
  return {
    ok: true,
    count: rows.length,
    ...(conflicts > 0
      ? { warning: `已建立 ${rows.length} 筆預約，其中 ${conflicts} 筆與既有預約時段重疊，請留意。` }
      : {}),
  };
}
