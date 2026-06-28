"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// 邀请信息（对应 GET /api/user/invite 返回结构）
interface InviteInfo {
  inviteCode: string;
  inviteCount: number;
  inviteReward: number;
  inviteUrl: string;
}

// 邀请奖励金额：邀请人 +50，被邀请人 +50
const INVITER_REWARD = 50;
const INVITEE_REWARD = 50;

export default function InvitePage() {
  const { token, loading, user } = useAuth();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"code" | "url" | null>(null);

  /**
   * 获取邀请信息
   */
  const fetchInviteInfo = useCallback(async () => {
    if (!token) return;
    setFetchLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/invite", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "获取邀请信息失败");
      }
      const data = (await res.json()) as InviteInfo;
      setInviteInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取邀请信息失败");
    } finally {
      setFetchLoading(false);
    }
  }, [token]);

  // 登录后加载邀请信息
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        void fetchInviteInfo();
      });
    return () => {
      cancelled = true;
    };
  }, [token, fetchInviteInfo]);

  /**
   * 复制文本到剪贴板
   */
  const copyToClipboard = useCallback(
    async (text: string, field: "code" | "url") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        // 剪贴板 API 不可用时静默失败
      }
    },
    [],
  );

  // 加载中
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background">
        <svg
          className="h-10 w-10 animate-spin text-primary"
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
      </main>
    );
  }

  // 未登录
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            登录后即可查看你的邀请奖励
          </p>
          <Link
            href="/login"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover"
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-muted-foreground">邀请奖励</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">邀请奖励</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            邀请好友注册，双方均可获得积分奖励
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-4">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="flex-1 text-sm text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-destructive/60 hover:text-destructive"
            >
              ✕
            </button>
          </div>
        )}

        {/* 加载中骨架屏 */}
        {fetchLoading && !inviteInfo ? (
          <div className="mb-6 h-48 animate-pulse rounded-[var(--radius)] bg-card" />
        ) : null}

        {/* 邀请码 + 邀请链接卡片 */}
        {inviteInfo && (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 邀请码（左侧大卡，占 2 列） */}
            <div className="rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/5 to-background p-6 lg:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                我的邀请码
              </h2>
              <div className="flex items-center gap-3">
                <code className="flex-1 break-all rounded-[var(--radius-sm)] bg-card px-5 py-4 font-mono text-2xl font-bold tracking-[0.3em] text-primary ring-2 ring-primary/20">
                  {inviteInfo.inviteCode}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(inviteInfo.inviteCode, "code")
                  }
                  className="flex-shrink-0 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 transition-transform"
                >
                  {copiedField === "code" ? "已复制" : "复制"}
                </button>
              </div>

              {/* 邀请链接 */}
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  邀请链接
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteInfo.inviteUrl}
                    className="w-full truncate rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(inviteInfo.inviteUrl, "url")
                    }
                    className="flex-shrink-0 rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground active:scale-95 transition-transform"
                  >
                    {copiedField === "url" ? "已复制" : "复制链接"}
                  </button>
                </div>
              </div>
            </div>

            {/* 二维码占位（右侧 1 列） */}
            <div className="rounded-[var(--radius)] border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                扫码邀请
              </h2>
              <div className="flex items-center justify-center">
                {/* 二维码占位图：使用纯 CSS 绘制的视觉占位 */}
                <div className="relative h-40 w-40 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-background">
                  <div
                    className="h-full w-full opacity-80"
                    style={{
                      backgroundImage:
                        "repeating-conic-gradient(#1f2937 0% 25%, #f9fafb 25% 50%)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-[1px]">
                    <span className="rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      二维码占位
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                扫描二维码即可访问邀请链接
              </p>
            </div>
          </div>
        )}

        {/* 邀请统计 */}
        {inviteInfo && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">成功邀请人数</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {inviteInfo.inviteCount}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  人
                </span>
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">获得奖励积分</p>
              <p className="mt-2 text-3xl font-bold text-success">
                {inviteInfo.inviteReward}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  积分
                </span>
              </p>
            </div>
          </div>
        )}

        {/* 邀请规则说明 */}
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            邀请规则
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                1
              </span>
              <span>
                将你的邀请码或邀请链接分享给好友，好友通过链接注册时邀请码会自动填入。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                2
              </span>
              <span>
                好友注册成功后，你将获得
                <strong className="mx-1 text-success">
                  {INVITER_REWARD} 积分
                </strong>
                奖励，多邀多得，上不封顶。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                3
              </span>
              <span>
                被邀请的好友首次注册将额外获得
                <strong className="mx-1 text-success">
                  {INVITEE_REWARD} 积分
                </strong>
                奖励（与注册赠送 500 积分不冲突，叠加发放）。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                4
              </span>
              <span>
                每个被邀请人仅能被一位邀请人绑定，邀请关系一经建立不可修改。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                !
              </span>
              <span className="text-muted-foreground">
                严禁通过机器批量注册、虚假账号等方式刷邀请奖励，违规账号将被扣除奖励积分并封禁。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
