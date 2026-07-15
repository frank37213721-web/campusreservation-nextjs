import { auth } from "@/lib/neon-auth";

// Handles Neon Auth's own flows: session cookies, email verification links,
// password reset. Our own sign-in/sign-up forms call auth.signIn.email() /
// auth.signUp.email() directly from server actions (see src/actions/profiles.ts
// and src/app/[schoolSlug]/login/actions.ts).
export const { GET, POST } = auth.handler();
