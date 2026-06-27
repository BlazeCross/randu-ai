import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * 用户行为埋点工具（18.1）
 *
 * 将事件写入 event_logs 表，用于关键指标统计与留存分析。
 * 设计原则：
 * - 异步且静默失败，绝不阻断主流程（埋点失败不应影响用户体验）
 * - 服务端调用：trackEvent
 * - 客户端调用：trackEventClient（走 /api/track 接口）
 */

// localStorage 中存储 token 的键名（与 auth-context.tsx 保持一致）
const TOKEN_KEY = "randu_token";

/**
 * 服务端埋点：将事件写入 event_logs 表
 *
 * 失败时仅记录日志，不抛错，确保主流程不受影响。
 *
 * @param userId     用户 ID
 * @param event      事件名（page_view | button_click | workflow_run | chat_message | register | login | purchase）
 * @param properties 附加属性（可选，JSON 可序列化对象）
 */
export async function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        userId,
        event,
        ...(properties
          ? { properties: properties as Prisma.InputJsonValue }
          : {}),
      },
    });
  } catch (error) {
    // 埋点失败不影响主流程，仅记录日志
    console.error("埋点记录失败:", error);
  }
}

/**
 * 服务端埋点（带请求上下文）：记录 clientIp / userAgent
 *
 * @param userId     用户 ID
 * @param event      事件名
 * @param properties 附加属性
 * @param clientIp   客户端 IP
 * @param userAgent  User-Agent
 */
export async function trackEventWithContext(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
  clientIp?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        userId,
        event,
        ...(properties
          ? { properties: properties as Prisma.InputJsonValue }
          : {}),
        clientIp,
        userAgent,
      },
    });
  } catch (error) {
    console.error("埋点记录失败:", error);
  }
}

/**
 * 客户端埋点：通过 /api/track 接口上报事件
 *
 * 从 localStorage 读取 token 鉴权；未登录时静默跳过。
 * 使用 keepalive 保证页面跳转时请求也能发出。
 * 失败时静默处理，不影响任何交互。
 *
 * @param eventName  事件名
 * @param properties 附加属性
 */
export function trackEventClient(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  try {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;

    // 未登录用户不上报（/api/track 需鉴权）
    if (!token) return;

    void fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event: eventName, properties }),
      keepalive: true,
    }).catch(() => {
      // 埋点失败静默处理
    });
  } catch {
    // 静默失败
  }
}
