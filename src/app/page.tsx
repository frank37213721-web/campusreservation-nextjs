import Link from "next/link";
import { Building2 } from "lucide-react";
import { getAllSchools } from "@/db/queries/schools";

export default async function SchoolSelectPage() {
  const schools = await getAllSchools();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-6 pt-32 text-center">
      <div className="muji-label mb-5">Campus Reservation System</div>
      <h1 className="mb-20 text-[1.8rem] font-semibold leading-tight tracking-tight text-foreground">
        校園空間借用系統
      </h1>

      <div className="flex w-full flex-col gap-3">
        {schools.map((school) => (
          <Link
            key={school.id}
            href={`/${school.slug}`}
            className="muji-block-button flex items-center justify-center gap-2 text-center"
          >
            <Building2 className="size-4 text-muted-foreground" />
            {school.name}
          </Link>
        ))}
        {schools.length === 0 && (
          <p className="text-sm text-muted-foreground">
            尚未設定任何學校，請先執行 <code>npm run db:seed</code>。
          </p>
        )}
      </div>

      <div className="mt-36 text-[0.7rem] tracking-wide text-muted-foreground uppercase">
        © Kaohsiung Municipal Sanmin Senior High School
      </div>
    </div>
  );
}
