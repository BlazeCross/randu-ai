import type { Metadata } from "next";

// /artifacts 为 "use client" 页面，无法直接导出 metadata，
// 故在同目录创建 Server Component layout 承载静态 metadata。
export const metadata: Metadata = {
  title: { absolute: "作品空间 - 燃渡AI" },
  description: "管理你的AI创作成果",
  alternates: {
    canonical: "/artifacts",
  },
};

export default function ArtifactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
