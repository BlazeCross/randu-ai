import { prisma } from "@/lib/prisma";

/**
 * 通知类型（与 schema Notification.type 一致）
 */
export type NotificationType =
  | "task_complete"
  | "task_failed"
  | "system"
  | "announcement";

/**
 * 创建站内通知
 *
 * 静默失败（仅记录日志），不抛错以避免影响主流程。
 * 例如：任务完成时发通知，不应因通知写入失败导致任务接口报错。
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        link: data.link,
      },
    });
  } catch (error) {
    // 通知写入失败不应影响主流程，仅记录日志
    console.error("创建通知失败:", error);
  }
}
