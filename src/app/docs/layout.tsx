import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教程文档中心",
  description:
    "查看每个 AI 工作流的详细使用教程，包含 Coze 工作流配置、提示词工程、智能体搭建等实战指南。",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
