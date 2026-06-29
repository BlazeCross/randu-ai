import type { NextConfig } from "next";

// 安全响应头配置
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; media-src 'self' https: blob:; frame-ancestors 'none';",
  },
];

const nextConfig: NextConfig = {
  // ali-oss 依赖 urllib，其中存在对 proxy-agent 的可选 require，
  // Turbopack 无法自动处理该可选依赖，将其标记为外部包以避免打包错误。
  serverExternalPackages: ["ali-oss"],
  // 性能与安全配置
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // next/image 允许的远程图片域名
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "randu-ai.oss-cn-chengdu.aliyuncs.com" },
      { protocol: "https", hostname: "ark-content-generation-cn-beijing.tos-cn-beijing.volces.com" },
      { protocol: "https", hostname: "**.volces.com" },
      { protocol: "https", hostname: "**.aliyuncs.com" },
    ],
  },
  // 安全响应头
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
