import { getSchoolBySlug } from "@/db/queries/schools";
import { getClassroomsForSchool } from "@/db/queries/classrooms";
import { getCurrentProfile } from "@/lib/auth";
import { getLang } from "@/lib/get-lang";
import { HomeView } from "./HomeView";
import { notFound } from "next/navigation";

export default async function SchoolHomePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const [classrooms, profile, lang] = await Promise.all([
    getClassroomsForSchool(school.id),
    getCurrentProfile(),
    getLang(),
  ]);

  return (
    <HomeView
      schoolSlug={schoolSlug}
      lang={lang}
      classrooms={classrooms}
      isAuthenticated={!!profile}
    />
  );
}
