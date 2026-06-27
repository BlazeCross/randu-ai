"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// 昵称长度限制（与后端一致）
const NICKNAME_MAX_LENGTH = 20;
// 头像文件大小上限：2MB
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
// 允许的头像图片类型
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProfilePage() {
  const { user, token, loading, refreshUser } = useAuth();

  // 昵称编辑
  const [nickname, setNickname] = useState("");
  const [nicknameDirty, setNicknameDirty] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 头像上传
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // user 加载后初始化昵称输入框（仅填充一次，用户编辑后不再覆盖）
  useEffect(() => {
    if (user && !nicknameDirty) {
      setNickname(user.nickname ?? "");
    }
    // 仅在 user.id 变化时初始化（避免每次 user 引用变化都重置）
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 保存昵称
   */
  const handleSaveNickname = useCallback(async () => {
    if (!token) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameMsg({ type: "error", text: "昵称不能为空" });
      return;
    }
    if (trimmed.length > NICKNAME_MAX_LENGTH) {
      setNicknameMsg({
        type: "error",
        text: `昵称长度不能超过 ${NICKNAME_MAX_LENGTH} 个字符`,
      });
      return;
    }

    setSavingNickname(true);
    setNicknameMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "保存失败");
      }
      setNicknameMsg({ type: "success", text: "昵称已更新" });
      setNicknameDirty(false);
      // 刷新 AuthContext 中的 user 信息
      await refreshUser();
    } catch (e) {
      setNicknameMsg({
        type: "error",
        text: e instanceof Error ? e.message : "保存失败",
      });
    } finally {
      setSavingNickname(false);
    }
  }, [token, nickname, refreshUser]);

  /**
   * 选择头像文件
   */
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!token) return;
      const file = e.target.files?.[0];
      if (!file) return;

      // 清空提示
      setAvatarMsg(null);

      // 校验类型
      if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
        setAvatarMsg({
          type: "error",
          text: `不支持的文件类型：${file.type || "未知"}，仅支持 JPG/PNG/WebP/GIF`,
        });
        // 重置 input，允许重新选择同一文件
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // 校验大小
      if (file.size > AVATAR_MAX_SIZE) {
        setAvatarMsg({
          type: "error",
          text: `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），头像最大支持 2MB`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // 上传头像
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/user/avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message || "头像上传失败");
        }
        setAvatarMsg({ type: "success", text: "头像已更新" });
        // 刷新 AuthContext 中的 user 信息
        await refreshUser();
      } catch (e) {
        setAvatarMsg({
          type: "error",
          text: e instanceof Error ? e.message : "头像上传失败",
        });
      } finally {
        setUploadingAvatar(false);
        // 重置 input，允许再次选择同一文件
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [token, refreshUser],
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
            登录后即可管理你的个人资料
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-muted-foreground">资料设置</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">资料设置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理你的头像和昵称
          </p>
        </div>

        {/* 头像卡片 */}
        <div className="mb-6 rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            头像
          </h2>
          <div className="flex items-center gap-5">
            {/* 头像预览 */}
            <div className="relative">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt="头像"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-ring"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 ring-2 ring-primary-100">
                  <span className="text-2xl font-bold text-primary">
                    {(user.nickname || user.email || user.phone || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40">
                  <svg
                    className="h-6 w-6 animate-spin text-primary-foreground"
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
                </div>
              )}
            </div>

            {/* 上传按钮 + 说明 */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {uploadingAvatar ? "上传中..." : "更换头像"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                支持 JPG/PNG/WebP/GIF，文件大小不超过 2MB
              </p>
              {avatarMsg && (
                <p
                  className={`mt-2 text-xs ${
                    avatarMsg.type === "success" ? "text-success" : "text-destructive"
                  }`}
                >
                  {avatarMsg.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 昵称卡片 */}
        <div className="mb-6 rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            昵称
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameDirty(true);
                  setNicknameMsg(null);
                }}
                maxLength={NICKNAME_MAX_LENGTH}
                placeholder="请输入昵称"
                className="w-full rounded-[var(--radius-sm)] border border-border px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {nickname.length}/{NICKNAME_MAX_LENGTH} 字
              </p>
            </div>
            <button
              onClick={handleSaveNickname}
              disabled={
                savingNickname ||
                !nickname.trim() ||
                (nicknameDirty && nickname.trim() === (user.nickname ?? ""))
              }
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingNickname ? "保存中..." : "保存"}
            </button>
          </div>
          {nicknameMsg && (
            <p
              className={`mt-2 text-xs ${
                nicknameMsg.type === "success"
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {nicknameMsg.text}
            </p>
          )}
        </div>

        {/* 账号信息卡片（只读） */}
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            账号信息
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">邮箱</span>
              <span className="text-sm font-medium text-foreground">
                {user.email || "未绑定"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">手机号</span>
              <span className="text-sm font-medium text-foreground">
                {user.phone || "未绑定"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">注册时间</span>
              <span className="text-sm font-medium text-foreground">
                {new Date(user.createdAt).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
