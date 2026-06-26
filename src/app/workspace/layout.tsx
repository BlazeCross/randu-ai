import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "工作台 - 探索 AI 工作流",
  description:
    "浏览燃渡AI 提供的全部 AI 工作流：视频生成、文生图、文案创作、智能体对话等。选择工作流立即使用。",
  alternates: {
    canonical: "/workspace",
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
