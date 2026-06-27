import { redirect } from "next/navigation";

/**
 * /courses 已迁移至 /academy（燃渡学院）
 * 保留此路由以兼容旧链接与搜索引擎已收录地址。
 */
export default function CoursesPage() {
  redirect("/academy");
}
