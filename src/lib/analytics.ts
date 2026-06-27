import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * 用户行为埋点工具（18.1）- 服务端专用
 *
 * 将事件写入 event_logs 表，用于关键指标统计与留存分析。
 * 设计原则：
 * - 异步且静默失败，绝不阻断主流程（埋点失败不应影响用户体验）
 * - 服务端调用：trackEvent / trackEventWithContext
 * - 客户端调用：trackEventClient（已迁移至 src/lib/analytics-client.ts，走 /api/track 接口）
 *
 * ⚠️ 此文件引入了 Prisma，仅可在服务端组件/API route 中使用，
 *    不可被 "use client" 组件直接或间接引用，否则会把 Prisma 打包进客户端 bundle。
 */

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

// 客户端埋点函数 trackEventClient 已迁移至 src/lib/analytics-client.ts
// 避免将 Prisma 等服务端依赖打包进客户端 bundle
// 客户端代码请直接 import from "@/lib/analytics-client"
