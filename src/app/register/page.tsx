"use client";

import { useState, useEffect, useCallback, useRef, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTrack } from "@/hooks/useTrack";

type InviteStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; inviterNickname: string | null }
  | { state: "invalid" };

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { track } = useTrack();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>({ state: "idle" });
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      const normalized = ref.trim().toUpperCase();
      Promise.resolve().then(() => setInviteCode(normalized));
    }
  }, [searchParams]);

  const verifyInviteCode = useCallback(async (code: string) => {
    if (!code) {
      setInviteStatus({ state: "idle" });
      return;
    }
    setInviteStatus({ state: "checking" });
    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      if (!res.ok) {
        setInviteStatus({ state: "invalid" });
        return;
      }
      const data = (await res.json()) as {
        valid: boolean;
        inviterNickname?: string | null;
      };
      if (data.valid) {
        setInviteStatus({ state: "valid", inviterNickname: data.inviterNickname ?? null });
      } else {
        setInviteStatus({ state: "invalid" });
      }
    } catch {
      setInviteStatus({ state: "idle" });
    }
  }, []);

  useEffect(() => {
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
    }
    if (!inviteCode) {
      Promise.resolve().then(() => setInviteStatus({ state: "idle" }));
      return;
    }
    verifyTimerRef.current = setTimeout(() => {
      void verifyInviteCode(inviteCode);
    }, 500);

    return () => {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
    };
  }, [inviteCode, verifyInviteCode]);

  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setError("请至少填写邮箱或手机号其中之一");
      return;
    }

    if (password.length < 6) {
      setError("密码长度不能少于 6 位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const trimmedInvite = inviteCode.trim().toUpperCase();
      const payloadInviteCode = trimmedInvite && inviteStatus.state === "valid" ? trimmedInvite : undefined;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          password,
          inviteCode: payloadInviteCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "注册失败，请重试");
        return;
      }

      await login(data.token);
      track("register");
      // 注册完成后直接跳转到 onboarding
      router.push("/onboarding");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1">
      {/* 左侧品牌区域 - 桌面端左半屏，移动端隐藏 */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-[#FAF7F2]">
        {/* 装饰性几何图形 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#E67E22]/5 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#E67E22]/8 transform -translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-xl bg-[#E67E22]/6 transform rotate-12" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-[#E67E22]/10" />
        </div>

        {/* 品牌内容 */}
        <div className="relative z-10 flex flex-col items-center px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#E67E22] flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-[#2C2C2C]">燃渡Ai</span>
          </div>

          {/* 品牌 slogan */}
          <p className="text-lg text-[#666666] text-center mb-12 max-w-sm">
            用 AI 赋能创意<br />让工作更高效
          </p>

          {/* 微信扫码区域占位 */}
          <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-[#E8E0D8] bg-white/60 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#E67E22]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm text-[#999999]">微信扫码登录区域</p>
            <p className="text-xs text-[#CCCCCC]">（即将上线）</p>
          </div>

          <p className="mt-6 text-sm text-[#999999]">
            微信登录 · 安全便捷
          </p>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* 移动端 Logo - 仅移动端显示 */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#E67E22] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#2C2C2C]">燃渡Ai</span>
          </div>

          {/* 移动端微信登录按钮 - 仅移动端显示 */}
          <div className="md:hidden mb-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#E67E22] bg-white px-4 py-3 text-[#E67E22] font-medium hover:bg-[#FDF2E9] transition-all duration-150"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.407-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              微信登录
            </button>
          </div>

          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C]">创建账号</h2>
            <p className="mt-1 text-sm text-[#666666]">
              注册即享 7 天免费试用
            </p>
          </div>

          {/* 注册卡片 */}
          <div className="rounded-2xl border border-[#E8E0D8] bg-white p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-medium text-[#999999] mb-4">基本信息</h3>
                <div className="space-y-4">
                  {/* 用户名输入框 */}
                  <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                      用户名
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="请输入用户名"
                      autoComplete="nickname"
                      className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150"
                    />
                  </div>

                  {/* 手机号输入框 */}
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                      手机号
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="h-px bg-[#E8E0D8]" />

              {/* 账号信息 */}
              <div>
                <h3 className="text-sm font-medium text-[#999999] mb-4">账号信息</h3>
                <div className="space-y-4">
                  {/* 邮箱输入框 */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                      邮箱 <span className="text-[#999999]">（可选）</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150"
                    />
                    <p className="mt-1 text-xs text-[#999999]">邮箱和手机号至少填写一个</p>
                  </div>

                  {/* 密码输入框 */}
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少 6 位密码"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 pr-12 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150"
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

                  {/* 确认密码输入框 */}
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                      确认密码
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="h-px bg-[#E8E0D8]" />

              {/* 邀请码输入框 */}
              <div>
                <label htmlFor="inviteCode" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
                  邀请码 <span className="text-[#999999]">（可选）</span>
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                  placeholder="请输入邀请码"
                  maxLength={8}
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-[#2C2C2C] placeholder:text-[#999999] focus:border-[#E67E22] focus:outline-none transition-all duration-150 ${
                    inviteStatus.state === "valid"
                      ? "border-green-500"
                      : inviteStatus.state === "invalid"
                      ? "border-red-500"
                      : "border-[#E8E0D8]"
                  }`}
                />
                {inviteStatus.state === "checking" && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-[#999999]">
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    正在校验邀请码...
                  </p>
                )}
                {inviteStatus.state === "valid" && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    邀请码有效
                    {inviteStatus.inviterNickname && <span className="text-[#666666]">，邀请人：<strong className="text-[#2C2C2C]">{inviteStatus.inviterNickname}</strong></span>}
                    <span className="text-green-600">· 注册可获额外 50 积分</span>
                  </p>
                )}
                {inviteStatus.state === "invalid" && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    邀请码无效，请检查后重新输入
                  </p>
                )}
                {inviteStatus.state === "idle" && (
                  <p className="mt-1 text-xs text-[#999999]">有邀请码？填写后注册可获额外 50 积分奖励</p>
                )}
              </div>

              {/* 分隔线 */}
              <div className="h-px bg-[#E8E0D8]" />

              {/* 协议同意 */}
              <div>
                <h3 className="text-sm font-medium text-[#999999] mb-4">协议同意</h3>
                {/* 用户协议同意复选框 */}
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="agree-terms" className="mt-1 w-4 h-4 accent-[#E67E22]" required />
                  <label htmlFor="agree-terms" className="text-sm text-[#666666]">
                    我已阅读并同意
                    <a href="/terms" className="text-[#E67E22] hover:underline mx-1">《用户协议》</a>
                    和
                    <a href="/privacy" className="text-[#E67E22] hover:underline mx-1">《隐私政策》</a>
                  </label>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 注册按钮 */}
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
                    注册中...
                  </span>
                ) : (
                  "注册"
                )}
              </button>

              {/* 分隔线 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E8E0D8]" />
                <span className="text-sm text-[#999999]">或</span>
                <div className="flex-1 h-px bg-[#E8E0D8]" />
              </div>

              {/* 微信登录按钮 */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#F5F0E8] transition-all duration-150"
              >
                <svg className="w-5 h-5 text-[#07C160]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.407-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
                微信登录
              </button>
            </form>
          </div>

          {/* 登录链接 */}
          <p className="mt-6 text-center text-sm text-[#666666]">
            已有账号？
            <Link href="/login" className="ml-1 font-medium text-[#E67E22] hover:text-[#D35400] transition-colors">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
