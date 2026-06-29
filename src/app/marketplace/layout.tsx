import type { Metadata } from "next";

// /marketplace 为 "use client" 页面，无法直接导出 metadata，
// 故在同目录创建 Server Component layout 承载静态 metadata。
export const metadata: Metadata = {
  title: { absolute: "工作流市场 - 燃渡AI" },
  description: "探索丰富的AI工作流",
  alternates: {
    canonical: "/marketplace",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
