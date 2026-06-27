import { redirect } from "next/navigation";

/**
 * /docs 已迁移至 /tutorial（独立教程中心）
 * 保留此路由以兼容旧链接与搜索引擎已收录地址。
 */
export default function DocsPage() {
  redirect("/tutorial");
}
