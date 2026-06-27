import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";

// 余额低于此阈值触发提醒
const LOW_BALANCE_THRESHOLD = 50;

/**
 * 检查用户积分是否过期，过期则清零并标记（17.3）
 *
 * 触发条件：creditsExpiresAt 早于当前时间，且尚未标记过期。
 * 处理：将 credits 置 0、creditsExpired 置 true，并发送"积分已过期"通知。
 * 幂等：已标记过期的用户不会重复处理。
 * 静默失败：数据库或通知写入失败不抛错，仅记录日志，避免阻断主流程。
 *
 * @param userId 用户 ID
 * @returns { expired, credits }：expired 表示本次是否发生过期，credits 为过期后的最新余额
 */
export async function checkAndExpireCredits(
  userId: string,
): Promise<{ expired: boolean; credits: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, creditsExpiresAt: true, creditsExpired: true },
    });

    if (!user) {
      return { expired: false, credits: 0 };
    }

    // 已标记过期或未设置过期时间：无需处理
    if (user.creditsExpired || !user.creditsExpiresAt) {
      return { expired: false, credits: user.credits };
    }

    // 未到期
    if (user.creditsExpiresAt.getTime() > Date.now()) {
      return { expired: false, credits: user.credits };
    }

    // 已到期但未标记：清零并标记
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: 0,
        creditsExpired: true,
      },
    });

    // 发送过期通知（静默失败）
    await createNotification({
      userId,
      type: "system",
      title: "积分已过期",
      content: "您的积分已超过有效期并被清零，如需继续使用请前往充值。",
      link: "/dashboard",
    });

    return { expired: true, credits: 0 };
  } catch (error) {
    // 过期检查失败不应阻断主流程，仅记录日志
    console.error("检查积分过期失败:", error);
    return { expired: false, credits: 0 };
  }
}

/**
 * 余额低于阈值时创建提醒通知（17.3）
 *
 * 当 credits < LOW_BALANCE_THRESHOLD 时发送一条余额不足通知。
 * 仅在用户尚未收到过同类提醒时发送，避免重复打扰（通过最近通知去重）。
 * 静默失败：不影响主流程。
 *
 * @param userId  用户 ID
 * @param credits 当前余额
 */
export async function notifyLowBalance(
  userId: string,
  credits: number,
): Promise<void> {
  try {
    // 余额充足：无需提醒
    if (credits >= LOW_BALANCE_THRESHOLD) {
      return;
    }

    // 去重：若最近 24 小时内已发送过余额不足通知，则跳过
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await prisma.notification.findFirst({
      where: {
        userId,
        title: "余额不足提醒",
        createdAt: { gte: oneDayAgo },
      },
      select: { id: true },
    });
    if (recent) {
      return;
    }

    await createNotification({
      userId,
      type: "system",
      title: "余额不足提醒",
      content: `您的积分余额仅剩 ${credits}，为避免影响使用请及时充值。`,
      link: "/dashboard",
    });
  } catch (error) {
    // 余额提醒失败不应影响主流程，仅记录日志
    console.error("发送余额不足提醒失败:", error);
  }
}
