import type { ReactNode } from "react";

// /academy/articles 为 "use client" 列表页（无详情页路由），
// 在此 Server Component layout 中注入 ItemList JSON-LD 结构化数据。
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://randuai.cn";

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "图文教程 - 燃渡AI",
  description:
    "燃渡AI 平台图文教程列表，涵盖 Coze 工作流、Seedance 视频生成、Seedream 文生图、豆包文案等 AI 工作流的详细使用教程",
  url: `${SITE_URL}/academy/articles`,
};

export default function AcademyArticlesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {children}
    </>
  );
}
