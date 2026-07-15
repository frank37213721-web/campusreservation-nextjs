import "server-only";
import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "zh";
}
