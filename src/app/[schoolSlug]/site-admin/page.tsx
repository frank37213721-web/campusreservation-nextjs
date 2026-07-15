import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getClassroomAdminMap, getClassroomsForSchool } from "@/db/queries/classrooms";
import { getAllUsers } from "@/db/queries/profiles";
import { requireRole } from "@/lib/auth";
import { SiteAdminView } from "./SiteAdminView";

export default async function SiteAdminPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  await requireRole(schoolSlug, ["SiteAdmin"]);

  const [users, classrooms, adminMapRaw] = await Promise.all([
    getAllUsers(),
    getClassroomsForSchool(school.id),
    getClassroomAdminMap(school.id),
  ]);

  const adminMap: Record<number, string[]> = {};
  for (const [classroomId, ids] of adminMapRaw) {
    adminMap[classroomId] = ids;
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="mb-6 text-xl font-medium tracking-wide">⚙️ 網站系統管理</h1>
      <SiteAdminView
        schoolSlug={schoolSlug}
        schoolId={school.id}
        users={users}
        classrooms={classrooms}
        adminMap={adminMap}
      />
    </div>
  );
}
