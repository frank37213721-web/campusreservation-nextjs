import { StackHandler } from "@stackframe/stack";

// Catch-all for Stack Auth's own flows (email verification links, password
// reset, account settings). Day-to-day sign in/up uses our own branded pages
// under /[schoolSlug]/login, which call the Stack Auth client SDK directly.
export default function Handler() {
  return <StackHandler fullPage />;
}
