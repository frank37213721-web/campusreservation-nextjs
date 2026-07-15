"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, type roleEnum } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { stackServerApp } from "@/stack/server";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "密碼長度不足，請設定至少 6 個字元。"),
  fullName: z.string().min(1, "請輸入使用者名稱。"),
  department: z.string().min(1, "請輸入處室或科別。"),
});

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Creates the Stack Auth user, then immediately upserts the app-level
 * `profiles` row (full_name/department/role) keyed by that user's id.
 * Mirrors the old `db.update_user_profile_at_reg` behavior.
 */
export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
  department: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "輸入資料有誤。" };
  }
  const { email, password, fullName, department } = parsed.data;

  let userId: string;
  try {
    const created = await stackServerApp.createUser({
      primaryEmail: email,
      password,
      primaryEmailAuthEnabled: true,
      primaryEmailVerified: false,
    });
    userId = created.id;
    await created.sendVerificationEmail();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("already")) {
      return { ok: false, error: "此信箱已經註冊過了，請直接前往登入。" };
    }
    return { ok: false, error: `註冊過程發生錯誤：${message}` };
  }

  await db
    .insert(profiles)
    .values({ id: userId, email, fullName, department, role: "User" })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { email, fullName, department },
    });

  return { ok: true };
}

export async function updateUserRole(
  schoolSlug: string,
  targetProfileId: string,
  role: (typeof roleEnum.enumValues)[number]
) {
  await requireRole(schoolSlug, ["SiteAdmin"]);
  await db.update(profiles).set({ role }).where(eq(profiles.id, targetProfileId));
}
