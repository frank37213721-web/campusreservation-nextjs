import { NextResponse } from "next/server";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getSchoolReservationsDetailed, getSchoolReservationsPublic } from "@/db/queries/reservations";
import { getCurrentProfile } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Missing from/to" }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  const rows = profile
    ? await getSchoolReservationsDetailed(school.id, from, to)
    : await getSchoolReservationsPublic(school.id, from, to);

  return NextResponse.json({ reservations: rows });
}
