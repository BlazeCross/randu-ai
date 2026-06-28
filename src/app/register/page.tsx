"use client";

import { useState, useEffect, useCallback, useRef, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTrack } from "@/hooks/useTrack";

// 邀请码校验状态
type InviteStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; inviterNickname: string | null }
  | { state: "invalid" };

// 注册页面内容（使用 useSearchParams，必须包裹在 Suspense 边界中）
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

  // 邀请码相关状态
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>({
    state: "idle",
  });
  // 防抖定时器引用
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：从 URL 参数 ?ref=xxx 读取邀请码
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // 统一格式：大写 + 去除空白
      const normalized = ref.trim().toUpperCase();
      // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
      Promise.resolve().then(() => setInviteCode(normalized));
      // 由 useEffect[inviteCode] 自动触发校验
    }
  }, [searchParams]);

  /**
   * 调用验证 API 校验邀请码
   */
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
        setInviteStatus({
          state: "valid",
          inviterNickname: data.inviterNickname ?? null,
        });
      } else {
        setInviteStatus({ state: "invalid" });
      }
    } catch {
      // 网络错误时不阻断，设为 idle
      setInviteStatus({ state: "idle" });
    }
  }, []);

  // 邀请码输入变化时，防抖触发校验
  useEffect(() => {
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
    }
    // 空值立即重置（通过微任务延迟，避免 effect 内同步 setState 触发级联渲染）
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

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
    };
  }, []);

  // 提交注册表单
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // 校验：邮箱或手机号至少填一个
    if (!trimmedEmail && !trimmedPhone) {
      setError("请至少填写邮箱或手机号其中之一");
      return;
    }

    // 校验：密码长度 >= 6
    if (password.length < 6) {
      setError("密码长度不能少于 6 位");
      return;
    }

    // 校验：两次密码一致
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      // 仅当邀请码校验有效时才传给后端
      const trimmedInvite = inviteCode.trim().toUpperCase();
      const payloadInviteCode =
        trimmedInvite && inviteStatus.state === "valid"
          ? trimmedInvite
          : undefined;

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

      // 保存 token 并获取用户信息，然后跳转到新用户引导页
      await login(data.token);
      track("register");
      router.push("/welcome");
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
            创建账号，开启 AI 工作流之旅
          </p>
        </div>

        {/* 试用期说明 */}
        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-sm)] border border-success/30 bg-success/10 px-4 py-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-success-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-success">
            注册即享 7 天免费试用，全功能体验
          </p>
        </div>

        {/* 注册卡片 */}
        <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入框（可选） */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                邮箱 <span className="text-muted-foreground">（可选）</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                autoComplete="email"
                className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
              />
            </div>

            {/* 手机号输入框（可选） */}
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                手机号 <span className="text-muted-foreground">（可选）</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                autoComplete="tel"
                  className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                邮箱和手机号至少填写一个
              </p>
            </div>

            {/* 密码输入框 */}
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
                  placeholder="至少 6 位密码"
                  autoComplete="new-password"
                  className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-muted-foreground"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
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

            {/* 确认密码输入框 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                确认密码
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
              />
            </div>

            {/* 邀请码输入框（可选） */}
            <div>
              <label
                htmlFor="inviteCode"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                邀请码 <span className="text-muted-foreground">（可选）</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(e.target.value.trim().toUpperCase())
                }
                placeholder="请输入邀请码"
                maxLength={8}
                autoComplete="off"
                className={`w-full rounded-[var(--radius-sm)] border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200 ${
                  inviteStatus.state === "valid"
                    ? "border-success"
                    : inviteStatus.state === "invalid"
                      ? "border-destructive"
                      : "border-border"
                }`}
              />
              {/* 邀请码状态提示 */}
              {inviteStatus.state === "checking" && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <svg
                    className="h-3 w-3 animate-spin"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  正在校验邀请码...
                </p>
              )}
              {inviteStatus.state === "valid" && (
                <p className="mt-1.5 flex items-center gap-1 animate-fade-scale text-xs text-success">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  邀请码有效
                  {inviteStatus.inviterNickname && (
                    <span className="text-muted-foreground">
                      ，邀请人：
                      <strong className="text-foreground">
                        {inviteStatus.inviterNickname}
                      </strong>
                    </span>
                  )}
                  <span className="text-success-500">
                    · 注册可获额外 50 积分
                  </span>
                </p>
              )}
              {inviteStatus.state === "invalid" && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  邀请码无效，请检查后重新输入
                </p>
              )}
              {inviteStatus.state === "idle" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  有邀请码？填写后注册可获额外 50 积分奖励
                </p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-[var(--radius-sm)] bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-500 px-4 py-3 text-base font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
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
                  注册中...
                </>
              ) : (
                "注册"
              )}
            </button>
          </form>
        </div>

        {/* 底部登录链接 */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          已有账号？
          <Link
            href="/login"
            className="ml-1 font-medium text-primary hover:text-primary-hover"
          >
            立即登录
          </Link>
        </p>
      </div>
    </main>
  );
}

// 注册页面默认导出：用 Suspense 包裹使用 useSearchParams 的子组件
// Next.js 16 生产构建要求 useSearchParams 必须在 Suspense 边界内
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
