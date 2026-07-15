import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/db/queries/schools";
import { classroomIdsManagedBy, getClassroomsForSchool } from "@/db/queries/classrooms";
import { getClassAdminsAndAbove } from "@/db/queries/profiles";
import { requireRole } from "@/lib/auth";
import { ClassroomsView } from "./ClassroomsView";

export default async function ClassroomsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const allClassrooms = await getClassroomsForSchool(school.id);

  let visibleClassrooms = allClassrooms;
  if (profile.role !== "SiteAdmin") {
    const managedIds = new Set(await classroomIdsManagedBy(profile.id));
    visibleClassrooms = allClassrooms.filter((c) => managedIds.has(c.id));
  }

  const classAdmins = profile.role === "SiteAdmin" ? await getClassAdminsAndAbove() : [];

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="mb-2 text-xl font-medium tracking-wide">ℹ️ 教室資訊</h1>
      <p className="mb-6 text-sm text-muted-foreground">管理教室的詳細資訊、描述與門禁方式。</p>

      <ClassroomsView
        schoolSlug={schoolSlug}
        schoolId={school.id}
        myClassrooms={visibleClassrooms}
        isSiteAdmin={profile.role === "SiteAdmin"}
        classAdmins={classAdmins}
      />
    </div>
  );
}
