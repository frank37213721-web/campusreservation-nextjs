"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, type roleEnum } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { auth } from "@/lib/neon-auth";

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
 * Creates the Neon Auth identity, then immediately upserts the app-level
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

  const { data, error } = await auth.signUp.email({
    email,
    password,
    name: fullName,
  });

  if (error) {
    const message = error.message ?? "註冊過程發生錯誤。";
    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("exist")) {
      return { ok: false, error: "此信箱已經註冊過了，請直接前往登入。" };
    }
    if (message.toLowerCase().includes("password")) {
      return { ok: false, error: "密碼長度不足，請設定至少 6 個字元。" };
    }
    return { ok: false, error: `註冊過程發生錯誤：${message}` };
  }

  // signUp.email establishes a session cookie on success; read it back to get
  // the new user's id (defends against signUp's own response shape varying).
  const userId = data?.user?.id ?? (await auth.getSession()).data?.user?.id;
  if (!userId) {
    return { ok: false, error: "帳號已建立，但個人資料儲存失敗，請聯絡管理員。" };
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginUser(input: { email: string; password: string }): Promise<RegisterResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "請輸入電子郵件與密碼。" };
  }

  const { error } = await auth.signIn.email(parsed.data);
  if (error) {
    const message = (error.message ?? "").toLowerCase();
    if (message.includes("invalid") || message.includes("password") || message.includes("credential")) {
      return { ok: false, error: "電子郵件或密碼錯誤，請重新確認。" };
    }
    if (message.includes("verify") || message.includes("verified")) {
      return { ok: false, error: "請先至信箱點擊驗證連結，完成電子郵件驗證後再登入。" };
    }
    return { ok: false, error: "登入失敗，請稍後再試。" };
  }

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
