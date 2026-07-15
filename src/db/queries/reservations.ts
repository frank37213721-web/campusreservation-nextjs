import "server-only";
import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { classrooms, profiles, reservations } from "@/db/schema";
import { timesOverlap } from "@/lib/dates";

const NON_CANCELLED = ne(reservations.status, "CANCELLED");

/**
 * Reservations across a whole school within a date range, joined with classroom
 * name only (no requester PII) — used for the public home calendar.
 */
export async function getSchoolReservationsPublic(schoolId: number, from: string, to: string) {
  return db
    .select({
      id: reservations.id,
      classroomId: reservations.classroomId,
      classroomName: classrooms.name,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(classrooms, eq(reservations.classroomId, classrooms.id))
    .where(
      and(
        eq(reservations.schoolId, schoolId),
        gte(reservations.requestDate, from),
        lte(reservations.requestDate, to),
        inArray(reservations.status, ["APPROVED", "PENDING"])
      )
    )
    .orderBy(reservations.requestDate, reservations.startTime);
}

/** Same as above, but joined with requester name/department/purpose for authenticated users. */
export async function getSchoolReservationsDetailed(schoolId: number, from: string, to: string) {
  return db
    .select({
      id: reservations.id,
      classroomId: reservations.classroomId,
      classroomName: classrooms.name,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
      purpose: reservations.purpose,
      userName: profiles.fullName,
      userDept: profiles.department,
    })
    .from(reservations)
    .innerJoin(classrooms, eq(reservations.classroomId, classrooms.id))
    .innerJoin(profiles, eq(reservations.userId, profiles.id))
    .where(
      and(
        eq(reservations.schoolId, schoolId),
        gte(reservations.requestDate, from),
        lte(reservations.requestDate, to),
        inArray(reservations.status, ["APPROVED", "PENDING"])
      )
    )
    .orderBy(reservations.requestDate, reservations.startTime);
}

/** All (non-cancelled) reservations for a single classroom in a date range, with requester info. */
export async function getClassroomReservations(classroomId: number, from: string, to: string) {
  return db
    .select({
      id: reservations.id,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
      purpose: reservations.purpose,
      userId: reservations.userId,
      userName: profiles.fullName,
      userDept: profiles.department,
    })
    .from(reservations)
    .innerJoin(profiles, eq(reservations.userId, profiles.id))
    .where(
      and(
        eq(reservations.classroomId, classroomId),
        gte(reservations.requestDate, from),
        lte(reservations.requestDate, to),
        NON_CANCELLED
      )
    )
    .orderBy(reservations.requestDate, reservations.startTime);
}

export async function getUserReservations(userId: string, schoolId: number) {
  return db
    .select({
      id: reservations.id,
      classroomId: reservations.classroomId,
      classroomName: classrooms.name,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
      purpose: reservations.purpose,
    })
    .from(reservations)
    .innerJoin(classrooms, eq(reservations.classroomId, classrooms.id))
    .where(and(eq(reservations.userId, userId), eq(reservations.schoolId, schoolId), NON_CANCELLED))
    .orderBy(reservations.requestDate, reservations.startTime);
}

export async function getReservationById(id: number) {
  const [row] = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return row ?? null;
}

/** Pending queue for admin dashboard, optionally scoped to a set of classroom ids (ClassAdmin) or all (SiteAdmin). */
export async function getPendingReservations(schoolId: number, classroomIds?: number[]) {
  const conditions = [eq(reservations.schoolId, schoolId), eq(reservations.status, "PENDING")];
  if (classroomIds) {
    if (classroomIds.length === 0) return [];
    conditions.push(inArray(reservations.classroomId, classroomIds));
  }

  return db
    .select({
      id: reservations.id,
      classroomId: reservations.classroomId,
      classroomName: classrooms.name,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      purpose: reservations.purpose,
      userEmail: profiles.email,
      userName: profiles.fullName,
    })
    .from(reservations)
    .innerJoin(classrooms, eq(reservations.classroomId, classrooms.id))
    .innerJoin(profiles, eq(reservations.userId, profiles.id))
    .where(and(...conditions))
    .orderBy(reservations.requestDate, reservations.startTime);
}

export async function getActionedReservations(schoolId: number, classroomIds?: number[]) {
  const conditions = [eq(reservations.schoolId, schoolId), ne(reservations.status, "PENDING")];
  if (classroomIds) {
    if (classroomIds.length === 0) return [];
    conditions.push(inArray(reservations.classroomId, classroomIds));
  }

  return db
    .select({
      id: reservations.id,
      classroomId: reservations.classroomId,
      classroomName: classrooms.name,
      requestDate: reservations.requestDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(classrooms, eq(reservations.classroomId, classrooms.id))
    .where(and(...conditions))
    .orderBy(sql`${reservations.requestDate} desc`, sql`${reservations.startTime} desc`)
    .limit(100);
}

/**
 * True if [startTime, endTime) overlaps any non-cancelled reservation for this
 * classroom/date (APPROVED + PENDING) — tightened vs the old app, which only
 * checked APPROVED reservations.
 */
export async function hasConflict(
  classroomId: number,
  requestDate: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: number
) {
  const conditions = [
    eq(reservations.classroomId, classroomId),
    eq(reservations.requestDate, requestDate),
    NON_CANCELLED,
  ];
  if (excludeReservationId) {
    conditions.push(ne(reservations.id, excludeReservationId));
  }

  const candidates = await db
    .select({ startTime: reservations.startTime, endTime: reservations.endTime })
    .from(reservations)
    .where(and(...conditions));

  return candidates.some((c) => timesOverlap(startTime, endTime, c.startTime, c.endTime));
}
