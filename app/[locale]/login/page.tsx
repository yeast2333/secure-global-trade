"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LogIn, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// 安全技术点：登录与注册不再直接调用客户端 supabase.auth
//   - 改走 /api/auth/login 和 /api/auth/register
//   - 这两条路径在 middleware 中绑定了暴力破解防御（IP × 60s × 5 次）
//   - 服务端调用 Supabase Auth，密码全程仅以 bcrypt 哈希形态存储
//   - 成功后通过 location.assign 强制刷新页面，由 createServerClient 写入的会话 cookie 完成同步

function LoginForm() {
  const t = useTranslations("login");
  const tToast = useTranslations("toast");
  const params = useSearchParams();
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "en";
  const rawRedirect = params.get("redirect") ?? `/${locale}/profile`;
  // 防止 open-redirect：仅允许同源相对路径
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : `/${locale}/profile`;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 429) {
        const body = await response.json().catch(() => ({ retryAfter: 60 }));
        toast.error(
          tToast("rateLimited", { seconds: body.retryAfter ?? 60 }),
        );
        return;
      }

      const json = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string; message?: string; needsEmailConfirmation?: boolean }
        | null;

      if (!response.ok || !json?.ok) {
        if (json?.error === "VALIDATION_FAILED") {
          toast.error(tToast("validationFailed"));
        } else if (json?.error === "INVALID_CREDENTIALS") {
          toast.error(tToast("invalidCredentials"));
        } else if (json?.message) {
          toast.error(json.message);
        } else {
          toast.error(tToast("authFailed"));
        }
        return;
      }

      if (mode === "register" && json.needsEmailConfirmation) {
        toast.success(tToast("registerCheckEmail"));
        setMode("login");
        return;
      }

      toast.success(tToast("loginSuccess"));
      // 硬刷新：让 @supabase/ssr 重新读取服务端写入的 session cookie
      window.location.assign(redirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
        <ShieldCheck size={20} />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {mode === "login" ? t("title") : t("registerTitle")}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "login" ? t("subtitle") : t("registerSubtitle")}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            {t("email")}
          </span>
          <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Mail size={14} className="text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            {t("password")}
          </span>
          <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Lock size={14} className="text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <span className="mt-1 block text-[10px] text-slate-400">
            {t("passwordHint")}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
          {submitting
            ? "..."
            : mode === "login"
              ? t("submitLogin")
              : t("submitRegister")}
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          className="block w-full text-center text-xs text-slate-500 hover:text-slate-900"
        >
          {mode === "login" ? t("switchToRegister") : t("switchToLogin")}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
