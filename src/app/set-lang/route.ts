import { NextResponse } from "next/server";
import { isLang, LANG_COOKIE } from "@/lib/i18n";

export async function POST(request: Request) {
  const formData = await request.formData();
  const lang = formData.get("lang");
  const redirectTo = formData.get("redirectTo");

  const target = typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/";
  const response = NextResponse.redirect(new URL(target, request.url));

  if (typeof lang === "string" && isLang(lang)) {
    response.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}
