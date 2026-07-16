import { notFound } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getClassroomsForSchool } from "@/db/queries/classrooms";
import { getUserReservations } from "@/db/queries/reservations";
import { requireUser } from "@/lib/auth";
import { DashboardCalendar } from "./DashboardCalendar";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const profile = await requireUser(schoolSlug);
  const [classrooms, myReservations] = await Promise.all([
    getClassroomsForSchool(school.id),
    getUserReservations(profile.id, school.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-2 flex items-center gap-2 page-heading">
        <LayoutDashboard className="size-6 text-primary" />
        一般預約
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        您可以提前預約 14 天內的空間。點選月曆的日期空白處進行新預約；點選已有的預約可檢視或修改。
      </p>

      {classrooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前尚無教室資料。</p>
      ) : (
        <DashboardCalendar
          schoolSlug={schoolSlug}
          schoolId={school.id}
          currentUserId={profile.id}
          classrooms={classrooms}
          initialMyReservations={myReservations}
        />
      )}
    </div>
  );
}
