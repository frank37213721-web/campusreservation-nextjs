import { NextResponse } from "next/server";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getClassroomReservations } from "@/db/queries/reservations";
import { getCurrentProfile } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const classroomId = Number(url.searchParams.get("classroomId"));
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!classroomId || !from || !to) {
    return NextResponse.json({ error: "Missing classroomId/from/to" }, { status: 400 });
  }

  const rows = await getClassroomReservations(classroomId, from, to);
  return NextResponse.json({ reservations: rows });
}
