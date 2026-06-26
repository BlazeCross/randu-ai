import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，生成独立可运行的服务器
  // 用于 Docker 部署，无需安装 node_modules 即可运行
  output: "standalone",
  // ali-oss 依赖 urllib，其中存在对 proxy-agent 的可选 require，
  // Turbopack 无法自动处理该可选依赖，将其标记为外部包以避免打包错误。
  serverExternalPackages: ["ali-oss"],
  // 性能与安全配置
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
