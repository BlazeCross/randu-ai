/**
 * 客户端埋点工具（18.1）
 *
 * 仅在浏览器端运行，通过 /api/track 接口上报事件到服务端。
 * 此文件独立于 analytics.ts，避免将 Prisma 等服务端依赖打包进客户端 bundle。
 *
 * 设计原则：
 * - 异步且静默失败，绝不阻断主流程
 * - 使用 keepalive 保证页面跳转时请求也能发出
 */

// localStorage 中存储 token 的键名（与 auth-context.tsx 保持一致）
const TOKEN_KEY = "randu_token";

/**
 * 客户端埋点：通过 /api/track 接口上报事件
 *
 * 从 localStorage 读取 token 鉴权；未登录时静默跳过。
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
