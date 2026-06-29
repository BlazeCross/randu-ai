import type { ReactNode } from "react";

// /academy/videos 为 "use client" 列表页（无详情页路由），
// 在此 Server Component layout 中注入 ItemList JSON-LD 结构化数据。
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://randuai.cn";

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "视频教程 - 燃渡AI",
  description:
    "燃渡AI 平台视频教程列表，跟随视频实操快速掌握 Coze、Seedance、Seedream、豆包等 AI 工作流应用方法",
  url: `${SITE_URL}/academy/videos`,
};

export default function AcademyVideosLayout({
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
