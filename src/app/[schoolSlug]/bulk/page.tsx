import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/db/queries/schools";
import { classroomIdsManagedBy, getClassroomsForSchool } from "@/db/queries/classrooms";
import { requireRole } from "@/lib/auth";
import { BulkCalendar } from "./BulkCalendar";

export default async function BulkReservationPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const allClassrooms = await getClassroomsForSchool(school.id);

  let classrooms = allClassrooms;
  if (profile.role !== "SiteAdmin") {
    const managedIds = new Set(await classroomIdsManagedBy(profile.id));
    classrooms = allClassrooms.filter((c) => managedIds.has(c.id));
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-2 text-xl font-medium tracking-wide">📚 大量預約</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        您可以透過在月曆上拖曳選擇多個日期，或是直接填寫表單來建立大量預約。
      </p>

      {classrooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">您目前沒有管理的教室權限。</p>
      ) : (
        <BulkCalendar
          schoolSlug={schoolSlug}
          schoolId={school.id}
          classrooms={classrooms}
          defaultDepartment={profile.department}
        />
      )}
    </div>
  );
}
