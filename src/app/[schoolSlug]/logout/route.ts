import { NextResponse } from "next/server";
import { auth } from "@/lib/neon-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await params;
  await auth.signOut();
  return NextResponse.redirect(new URL(`/${schoolSlug}`, request.url));
}
