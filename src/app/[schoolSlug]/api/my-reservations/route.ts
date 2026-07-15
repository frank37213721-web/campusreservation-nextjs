import { NextResponse } from "next/server";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getUserReservations } from "@/db/queries/reservations";
import { getCurrentProfile } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await getUserReservations(profile.id, school.id);
  return NextResponse.json({ reservations: rows });
}
