import { KeyRound } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  return (
    <div className="flex flex-col items-center px-4 py-16">
      <h1 className="mb-8 flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
        <KeyRound className="size-5 text-primary" />
        登入 / 註冊
      </h1>
      <div className="card-shadow w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <LoginForm schoolSlug={schoolSlug} />
      </div>
    </div>
  );
}
