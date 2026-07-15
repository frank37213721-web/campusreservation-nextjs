import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await params;
  const user = await stackServerApp.getUser();
  if (user) {
    await user.signOut();
  }
  return NextResponse.redirect(new URL(`/${schoolSlug}`, request.url));
}
