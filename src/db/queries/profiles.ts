import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function getAllUsers() {
  return db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      department: profiles.department,
      role: profiles.role,
    })
    .from(profiles)
    .orderBy(profiles.fullName);
}

export async function getClassAdminsAndAbove() {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "ClassAdmin" || u.role === "SiteAdmin");
}

export async function getProfile(id: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return row ?? null;
}
