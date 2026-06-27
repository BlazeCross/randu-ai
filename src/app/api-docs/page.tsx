import { redirect } from "next/navigation";

/**
 * /api-docs 已迁移至 /dashboard/api-docs（个人中心下）
 * 保留此路由以兼容旧链接与搜索引擎已收录地址。
 */
export default function ApiDocsPage() {
  redirect("/dashboard/api-docs");
}
