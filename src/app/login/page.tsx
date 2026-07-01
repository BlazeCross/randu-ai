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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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

      await login(data.token);
      track("login");

      // 检查是否完成过 onboarding，未完成则跳转
      const onboardingDone = localStorage.getItem("onboarding_completed");
      const redirect = searchParams.get("redirect");
      if (!onboardingDone) {
        router.push("/onboarding");
      } else {
        router.push(redirect || "/dashboard");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1">
      {/* 左侧品牌区域 - 桌面端左半屏，移动端隐藏 */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500">
        {/* 装饰性光晕 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/10 transform translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 transform -translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-white/5" />
        </div>

        {/* 品牌内容 */}
        <div className="relative z-10 flex flex-col items-center px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-white">燃渡Ai</span>
          </div>

          {/* 品牌 slogan */}
          <p className="text-lg text-white/90 text-center mb-12 max-w-sm">
            用 AI 赋能创意<br />让工作更高效
          </p>

          {/* 微信扫码区域占位 */}
          <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-white/30 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm text-white/80">微信扫码登录区域</p>
            <p className="text-xs text-white/50">（即将上线）</p>
          </div>

          <p className="mt-6 text-sm text-white/80">
            微信登录 · 安全便捷
          </p>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* 移动端 Logo - 仅移动端显示 */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#2C2C2C]">燃渡Ai</span>
          </div>

          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C]">登录到燃渡Ai</h2>
            <p className="mt-1 text-sm text-[#666666]">
              欢迎回来，请登录你的账号
            </p>
          </div>

          {/* 微信登录主按钮 - 渐变背景 */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3.5 text-base font-semibold text-white hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] transition-all duration-150 mb-6 shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.407-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
            微信扫码登录
          </button>

          {/* 移动端微信登录按钮 - 仅移动端显示 */}
          <div className="md:hidden mb-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 bg-white px-4 py-3 text-indigo-500 font-medium hover:bg-indigo-50 transition-all duration-150"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.407-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              微信登录
            </button>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E8E0D8]" />
            <span className="text-sm text-[#999999]">或使用邮箱登录</span>
            <div className="flex-1 h-px bg-[#E8E0D8]" />
          </div>

          {/* 登录卡片 */}
          <div className="rounded-2xl border border-[#E8E0D8] bg-white p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 账号输入框 */}
              <div>
                <label
                  htmlFor="account"
                  className="mb-1.5 block text-sm font-medium text-[#2C2C2C]"
                >
                  邮箱/手机号
                </label>
                <input
                  id="account"
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="请输入邮箱或手机号"
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150"
                />
              </div>

              {/* 密码输入框 */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-[#2C2C2C]"
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
                    className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 pr-12 text-[#2C2C2C] placeholder:text-[#999999] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] transition-colors hover:text-[#666666]"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E8E0D8] accent-indigo-500" />
                  <span className="text-sm text-[#666666]">记住我</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors">
                  忘记密码？
                </Link>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E67E22] px-4 py-3 text-base font-semibold text-white hover:bg-[#D35400] active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </span>
                ) : (
                  "登 录"
                )}
              </button>
            </form>
          </div>

          {/* 注册链接 */}
          <p className="mt-6 text-center text-sm text-[#666666]">
            还没有账号？
            <Link href="/register" className="ml-1 font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
              注册账号
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
