"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTrack } from "@/hooks/useTrack";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { track } = useTrack();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 提交登录表单
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // 前端基础校验
    if (!account.trim()) {
      setError("请输入邮箱或手机号");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: account.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "登录失败，请重试");
        return;
      }

      // 保存 token 并获取用户信息，然后跳转
      await login(data.token);
      track("login");
      // 优先跳转到 redirect 参数指定的页面，否则默认 /dashboard
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/dashboard");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-60 w-60 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:"linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",backgroundSize:"48px 48px"}} />
      </div>
      <div className="relative w-full max-w-md">
        {/* 品牌 Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent font-bold">
                燃渡AI
              </span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            欢迎回来，请登录你的账号
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 账号输入框 */}
            <div>
              <label
                htmlFor="account"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                账号
              </label>
              <input
                id="account"
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="邮箱或手机号"
                autoComplete="username"
                className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
              />
            </div>

            {/* 密码输入框（含显示/隐藏切换） */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-muted-foreground"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    // 眼睛关闭图标
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // 眼睛打开图标
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-[var(--radius-sm)] bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-500 px-4 py-3 text-base font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  {/* 加载动画 */}
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>
        </div>

        {/* 底部注册链接 */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          还没有账号？
          <Link
            href="/register"
            className="ml-1 font-medium text-primary hover:text-primary-hover"
          >
            立即注册
          </Link>
        </p>
      </div>
    </main>
  );
}
