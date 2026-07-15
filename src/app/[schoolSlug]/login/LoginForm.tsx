"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStackApp } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerUser } from "@/actions/profiles";

function loginErrorMessage(errorCode: string | undefined, fallback: string) {
  switch (errorCode) {
    case "EMAIL_PASSWORD_MISMATCH":
      return "電子郵件或密碼錯誤，請重新確認。";
    case "USER_EMAIL_ALREADY_EXISTS":
      return "此信箱已經註冊過了，請直接點選上方「登入」頁籤。";
    default:
      return fallback;
  }
}

export function LoginForm({ schoolSlug }: { schoolSlug: string }) {
  const app = useStackApp();
  const router = useRouter();

  const [logEmail, setLogEmail] = useState("");
  const [logPwd, setLogPwd] = useState("");
  const [logError, setLogError] = useState<string | null>(null);
  const [logPending, startLogin] = useTransition();

  const [regEmail, setRegEmail] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [regName, setRegName] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [regPending, startRegister] = useTransition();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLogError(null);
    startLogin(async () => {
      const result = await app.signInWithCredential({
        email: logEmail,
        password: logPwd,
        noRedirect: true,
      });
      if (result.status === "error") {
        const code = (result.error as { errorCode?: string })?.errorCode;
        const message = (result.error as { message?: string })?.message ?? "登入失敗，請稍後再試。";
        setLogError(loginErrorMessage(code, message));
        return;
      }
      router.push(`/${schoolSlug}/dashboard`);
      router.refresh();
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegMessage(null);
    if (!regEmail || !regPwd || !regName || !regDept) {
      setRegMessage({ type: "error", text: "請填寫所有欄位。" });
      return;
    }
    startRegister(async () => {
      const result = await registerUser({
        email: regEmail,
        password: regPwd,
        fullName: regName,
        department: regDept,
      });
      if (!result.ok) {
        setRegMessage({ type: "error", text: result.error });
        return;
      }
      setRegMessage({
        type: "success",
        text: "註冊成功！請至您的信箱點擊驗證連結後即可登入。若沒看到信件，請檢查垃圾信箱。",
      });
      setRegEmail("");
      setRegPwd("");
      setRegName("");
      setRegDept("");
    });
  }

  return (
    <Tabs defaultValue="login" className="w-full max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="login">登入</TabsTrigger>
        <TabsTrigger value="register">註冊</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleLogin} className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="log-email">電子郵件</Label>
            <Input
              id="log-email"
              type="email"
              value={logEmail}
              onChange={(e) => setLogEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="log-pwd">密碼</Label>
            <Input
              id="log-pwd"
              type="password"
              value={logPwd}
              onChange={(e) => setLogPwd(e.target.value)}
              required
            />
          </div>
          {logError && <p className="text-sm text-destructive">{logError}</p>}
          <Button type="submit" disabled={logPending}>
            {logPending ? "登入中…" : "登入"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-email">電子郵件</Label>
            <Input
              id="reg-email"
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-pwd">密碼</Label>
            <Input
              id="reg-pwd"
              type="password"
              value={regPwd}
              onChange={(e) => setRegPwd(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-name">使用者名稱</Label>
            <Input
              id="reg-name"
              placeholder="請填寫真實姓名"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-dept">處室或科別</Label>
            <Input
              id="reg-dept"
              placeholder="教務處 或 自然科"
              value={regDept}
              onChange={(e) => setRegDept(e.target.value)}
              required
            />
          </div>
          {regMessage && (
            <p
              className={
                regMessage.type === "success" ? "text-sm text-emerald-700" : "text-sm text-destructive"
              }
            >
              {regMessage.text}
            </p>
          )}
          <Button type="submit" disabled={regPending}>
            {regPending ? "處理中…" : "註冊"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
