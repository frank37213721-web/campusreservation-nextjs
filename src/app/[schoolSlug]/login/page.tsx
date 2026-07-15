import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  return (
    <div className="flex flex-col items-center py-16 px-4">
      <h1 className="mb-8 text-lg font-medium tracking-wide">🔑 登入 / 註冊</h1>
      <LoginForm schoolSlug={schoolSlug} />
    </div>
  );
}
