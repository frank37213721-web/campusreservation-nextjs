import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/db/queries/schools";
import { getCurrentProfile } from "@/lib/auth";
import { getLang } from "@/lib/get-lang";
import { Sidebar } from "@/components/nav/Sidebar";

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const [profile, lang] = await Promise.all([getCurrentProfile(), getLang()]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar schoolSlug={schoolSlug} schoolName={school.name} lang={lang} profile={profile} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
