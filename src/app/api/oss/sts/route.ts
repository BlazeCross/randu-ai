import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSTSCredentials } from "@/lib/oss";

/**
 * GET /api/oss/sts - 获取 OSS STS 临时上传凭证
 *
 * 用于前端直传 OSS：客户端拿到凭证后用 ali-oss SDK 在浏览器直接上传文件，
 * 无需经过服务端中转，可显著降低服务端带宽/内存压力。
 *
 * 鉴权：需要登录（任意角色）
 *
 * 响应：
 * - 200 { enabled: true, credentials: {...} }  STS 已配置，返回临时凭证
 * - 200 { enabled: false }                    STS 未配置，前端应回退到 /api/upload 服务端中转
 * - 401 未登录
 * - 500 STS 凭证获取失败
 *
 * 安全说明：
 * - STS 凭证有效期 1 小时，过期后前端需重新请求
 * - 推荐为 RAM 角色配置仅允许 `oss:PutObject` 到 uploads/images/ 前缀的策略
 * - 凭证仅返回 accessKeyId / accessKeySecret / securityToken / expiration / bucket / region，
 *   不返回主账号密钥
 *
 * OSS Bucket CORS 配置（前端直传必需，需在阿里云控制台手动配置）：
 * - AllowedOrigin: https://randuai.cn, http://localhost:3000
 * - AllowedMethod: GET, PUT, POST, HEAD
 * - AllowedHeader: *
 * - ExposeHeader: ETag, x-oss-request-id
 */
export const GET = requireAuth(async () => {
  try {
    const credentials = await getSTSCredentials();

    if (!credentials) {
      // STS 未配置：返回标记让前端回退到服务端中转（/api/upload）
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({ enabled: true, credentials });
  } catch (error) {
    console.error("[/api/oss/sts] 获取 STS 凭证失败:", error);
    return NextResponse.json(
      { message: "获取上传凭证失败，请稍后重试" },
      { status: 500 },
    );
  }
});
