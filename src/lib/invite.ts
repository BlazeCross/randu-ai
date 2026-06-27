import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// 邀请码字符集：去除易混淆字符 0/O/I/L/1，共 31 个字符
// 包含大写字母（去掉 I/L/O）+ 数字（去掉 0/1）
const INVITE_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// 邀请码长度：8 位
const INVITE_CODE_LENGTH = 8;
// 生成邀请码时的最大重试次数（极小概率发生碰撞）
const MAX_GENERATE_RETRIES = 5;
// 邀请码格式正则：8 位大写字母+数字（字符集与上面一致）
const INVITE_CODE_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

/**
 * 校验字符串是否为合法邀请码格式
 * 字符集：ABCDEFGHJKMNPQRSTUVWXYZ23456789，长度 8
 */
export function isValidInviteCodeFormat(code: string): boolean {
  return INVITE_CODE_REGEX.test(code);
}

/**
 * 生成 8 位邀请码（大写字母+数字，去除易混淆字符 0/O/I/L/1）
 *
 * 使用 crypto.randomBytes 确保随机性，对字符集取模映射。
 * 注意：使用拒绝采样避免模偏差（MOD_REJECTION）。
 *
 * 不依赖 userId 的内容，仅做随机生成；userId 仅用于避免与自身已有码碰撞。
 *
 * @param userId 用户 ID（保留参数以便未来扩展，当前不参与生成）
 */
export function generateInviteCode(userId: string): string {
  // userId 当前不参与生成，保留参数以匹配接口契约
  void userId;
  // 字符集大小
  const charsLen = INVITE_CODE_CHARS.length;
  // 拒绝采样的阈值：256 以内 charsLen 的最大倍数
  // 避免取模导致的字符偏差（每个字符出现概率均等）
  const maxAccepted = Math.floor(256 / charsLen) * charsLen;

  let code = "";
  while (code.length < INVITE_CODE_LENGTH) {
    // 每次取 1 字节
    const buf = crypto.randomBytes(INVITE_CODE_LENGTH - code.length);
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      // 拒绝采样：超过 maxAccepted 的字节丢弃，避免偏差
      if (v >= maxAccepted) continue;
      code += INVITE_CODE_CHARS[v % charsLen];
      if (code.length >= INVITE_CODE_LENGTH) break;
    }
  }
  return code;
}

/**
 * 确保用户拥有邀请码：
 * 1. 查询用户当前 inviteCode
 * 2. 若已存在则直接返回
 * 3. 若不存在则生成并保存（带碰撞重试）
 *
 * 邀请码生成可能出现极小概率的碰撞，重试 MAX_GENERATE_RETRIES 次。
 *
 * @param userId 用户 ID
 * @returns 用户的邀请码
 */
export async function ensureInviteCode(userId: string): Promise<string> {
  // 1. 先查询是否已有邀请码
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });

  if (user?.inviteCode) {
    return user.inviteCode;
  }

  // 2. 生成并保存（带碰撞重试）
  for (let attempt = 0; attempt < MAX_GENERATE_RETRIES; attempt++) {
    const code = generateInviteCode(userId);

    try {
      // 条件更新：仅在 inviteCode 为空时写入，避免并发覆盖已有码
      // 使用 updateMany 的 WHERE 过滤实现原子 CAS
      const result = await prisma.user.updateMany({
        where: { id: userId, inviteCode: null },
        data: { inviteCode: code },
      });

      if (result.count > 0) {
        return code;
      }

      // count === 0 可能是：
      // a) 并发已被其他请求填充 → 重新查询返回已有码
      // b) 邀请码碰撞（其他用户已占用此 code）→ 由 unique 触发错误
      // 重新查询一次
      const refreshed = await prisma.user.findUnique({
        where: { id: userId },
        select: { inviteCode: true },
      });
      if (refreshed?.inviteCode) {
        return refreshed.inviteCode;
      }
      // 否则继续重试（碰撞场景）
    } catch (error) {
      // 碰撞（P2002 unique constraint）→ 继续重试
      // 其他错误则重新查询一次，避免误报
      const refreshed = await prisma.user.findUnique({
        where: { id: userId },
        select: { inviteCode: true },
      });
      if (refreshed?.inviteCode) {
        return refreshed.inviteCode;
      }
      // 仍未拿到 → 继续重试
      void error;
    }
  }

  // 重试耗尽，最后兜底查询一次
  const final = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });
  if (final?.inviteCode) {
    return final.inviteCode;
  }

  throw new Error("生成邀请码失败：多次重试后仍发生碰撞");
}

/**
 * 构建邀请链接
 *
 * 形如：${NEXT_PUBLIC_BASE_URL}/register?ref=${inviteCode}
 * 若未配置 NEXT_PUBLIC_BASE_URL，则返回相对路径 /register?ref=xxx
 */
export function buildInviteUrl(inviteCode: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  // 拼接，避免出现双斜杠
  const separator = base.endsWith("/") ? "" : "";
  return `${base}${separator}/register?ref=${inviteCode}`;
}
