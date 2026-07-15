import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { schools } from "@/db/schema";

export const getAllSchools = unstable_cache(
  async () => {
    return db.select().from(schools).orderBy(schools.id);
  },
  ["schools:all"],
  { revalidate: 600, tags: ["schools"] }
);

export const getSchoolBySlug = unstable_cache(
  async (slug: string) => {
    const [school] = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
    return school ?? null;
  },
  ["schools:by-slug"],
  { revalidate: 600, tags: ["schools"] }
);
