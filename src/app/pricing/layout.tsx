import type { Metadata } from "next";

// /pricing 为 "use client" 页面，无法直接导出 metadata，
// 故在同目录创建 Server Component layout 承载静态 metadata。
export const metadata: Metadata = {
  title: { absolute: "定价 - 燃渡AI" },
  description: "查看燃渡AI的套餐和价格",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
