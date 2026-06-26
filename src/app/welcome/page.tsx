"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  credits: number;
  totalUsed: number;
  trialExpiresAt: string;
  isTrialExpired: boolean;
  daysRemaining: number;
}

interface ProfileResponse {
  message?: string;
  nickname?: string;
}

const NICKNAME_MAX_LENGTH = 20;

// 引导卡片配置
const GUIDE_CARDS = [
  {
    title: "浏览工作流",
    description: "100+ 精选 AI 工作流，覆盖视频生成、内容创作等场景",
    href: "/workspace",
    cta: "立即体验",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    ),
    gradient: "from-primary-500 to-primary-700",
    bg: "bg-primary-50",
  },
  {
    title: "智能体对话",
    description: "AI 助手在线问答，输入「画一张...」还能直接生成图片",
    href: "/chat",
    cta: "开始对话",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
    gradient: "from-success-500 to-success-700",
    bg: "bg-success-50",
  },
  {
    title: "查看教程",
    description: "详尽的工作流使用教程和最佳实践文档",
    href: "/docs",
    cta: "查看教程",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    gradient: "from-blue-500 to-indigo-700",
    bg: "bg-blue-50",
  },
  {
    title: "个人中心",
    description: "查看积分余额、用量记录、订阅状态与 API Key 管理",
    href: "/dashboard",
    cta: "进入个人中心",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
    gradient: "from-purple-500 to-pink-700",
    bg: "bg-purple-50",
  },
];

/**
 * 新用户引导页（/welcome）
 *
 * - 仅注册成功后由注册页跳转进入
 * - 顶部欢迎横幅（含试用期信息）
 * - 完善昵称表单（可选，调用 /api/user/profile PATCH）
 * - 4 个功能引导卡片
 * - 底部「进入个人中心」按钮
 */
export default function WelcomePage() {
  const router = useRouter();
  const { token, user, loading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // 昵称表单
  const [nickname, setNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState(false);

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // 拉取用户资料（用于展示试用期信息）
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as UserProfile;
        if (cancelled) return;
        setProfile(data);
        // 预填当前昵称
        if (data.nickname) {
          setNickname(data.nickname);
        }
      } catch {
        // 静默失败，不阻塞引导
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // 提交昵称
  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setNicknameError(null);
    setNicknameSuccess(false);

    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError("昵称不能为空");
      return;
    }
    if (trimmed.length > NICKNAME_MAX_LENGTH) {
      setNicknameError(`昵称长度不能超过 ${NICKNAME_MAX_LENGTH} 个字符`);
      return;
    }

    setSavingNickname(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as ProfileResponse;
      if (!res.ok) {
        setNicknameError(data.message || "保存失败");
        return;
      }
      setNicknameSuccess(true);
      // 同步更新本地 profile
      if (profile) {
        setProfile({ ...profile, nickname: trimmed });
      }
    } catch {
      setNicknameError("网络错误，请稍后重试");
    } finally {
      setSavingNickname(false);
    }
  }

  // loading 时显示骨架
  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </main>
    );
  }

  // 试用信息
  const isTrialExpired = profile?.isTrialExpired ?? false;
  const daysRemaining = profile?.daysRemaining ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 顶部欢迎横幅 */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-3xl shadow-lg shadow-primary-600/25">
            <span role="img" aria-label="欢迎">
              🎉
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {profile?.nickname ? `欢迎，${profile.nickname}！` : "欢迎加入燃渡AI！"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-neutral-600 sm:text-lg">
            您的账号已创建成功，{isTrialExpired
              ? "试用期已结束，立即升级套餐解锁全部能力"
              : `当前处于 7 天免费试用期，剩余 ${daysRemaining} 天，全功能开放`}
          </p>
          {profile && (
            <div className="mt-4 inline-flex items-center gap-4 rounded-full border border-success-200 bg-success-50 px-4 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-success-700">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                积分余额：<strong className="font-semibold">{profile.credits}</strong>
              </span>
              <span className="text-success-200">|</span>
              <span className="text-success-700">
                累计使用：<strong className="font-semibold">{profile.totalUsed ?? 0}</strong> 次
              </span>
            </div>
          )}
        </div>

        {/* 完善昵称卡片（仅在未设置时显示） */}
        {!profile?.nickname && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-primary-50/50 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-900">
                完善你的资料
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                设置一个昵称，方便我们在工作流和通知中称呼你（可随时修改）
              </p>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleSaveNickname} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="nickname"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    昵称
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNicknameSuccess(false);
                      setNicknameError(null);
                    }}
                    placeholder="如：燃渡探索者"
                    maxLength={NICKNAME_MAX_LENGTH}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    {nickname.length}/{NICKNAME_MAX_LENGTH} 字 · 可选，跳过也没关系
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingNickname || !nickname.trim()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {savingNickname ? "保存中..." : "保存昵称"}
                </button>
              </form>
              {nicknameError && (
                <p className="mt-2 text-sm text-red-600">{nicknameError}</p>
              )}
              {nicknameSuccess && (
                <p className="mt-2 text-sm text-success-700">
                  ✓ 昵称已保存
                </p>
              )}
            </div>
          </div>
        )}

        {/* 功能引导卡片 */}
        <div className="mb-10">
          <h2 className="mb-5 text-center text-lg font-semibold text-neutral-900">
            从这里开始你的 AI 之旅
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {GUIDE_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      {card.icon}
                    </svg>
                  </div>
                  {/* 内容 */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {card.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors group-hover:text-primary-hover">
                      {card.cta}
                      <svg
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 底部跳过按钮 */}
        <div className="flex flex-col items-center gap-3 border-t border-neutral-200 pt-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover hover:shadow-xl active:scale-[0.98]"
          >
            进入个人中心
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
          <p className="text-xs text-neutral-400">
            引导页仅在注册后展示一次，可随时通过上方卡片访问各功能
          </p>
        </div>
      </div>
    </main>
  );
}
