import type { Metadata } from "next";

// /credits 为 "use client" 页面，无法直接导出 metadata，
// 故在同目录创建 Server Component layout 承载静态 metadata。
export const metadata: Metadata = {
  title: { absolute: "积分 - 燃渡AI" },
  description: "购买积分或查看积分明细",
  alternates: {
    canonical: "/credits",
  },
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
