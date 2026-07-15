import "server-only";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classroomAdmins, profiles } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

export type Role = "User" | "ClassAdmin" | "SiteAdmin";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  role: Role;
};

/** Returns the signed-in user's app profile, or null if not signed in / no profile row yet. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return profile ?? null;
}

/** Redirects to the school's login page if the visitor isn't signed in. */
export async function requireUser(schoolSlug: string): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${schoolSlug}/login`);
  return profile;
}

/** Redirects to the school home page if the signed-in user doesn't hold one of the given roles. */
export async function requireRole(
  schoolSlug: string,
  roles: Role[]
): Promise<CurrentProfile> {
  const profile = await requireUser(schoolSlug);
  if (!roles.includes(profile.role)) redirect(`/${schoolSlug}`);
  return profile;
}

/**
 * Redirects unless the signed-in user is a SiteAdmin or is registered as an
 * admin of the given classroom via the classroom_admins join table.
 */
export async function requireClassroomAdmin(
  schoolSlug: string,
  classroomId: number
): Promise<CurrentProfile> {
  const profile = await requireUser(schoolSlug);
  if (profile.role === "SiteAdmin") return profile;
  if (profile.role !== "ClassAdmin") redirect(`/${schoolSlug}`);

  const [membership] = await db
    .select()
    .from(classroomAdmins)
    .where(
      and(
        eq(classroomAdmins.classroomId, classroomId),
        eq(classroomAdmins.profileId, profile.id)
      )
    )
    .limit(1);

  if (!membership) redirect(`/${schoolSlug}`);
  return profile;
}
