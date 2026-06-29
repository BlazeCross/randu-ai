import type { Metadata } from "next";
import HeroCarousel from "@/components/home/HeroCarousel";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import WorkflowCategories from "@/components/home/WorkflowCategories";
import ScenarioShowcase from "@/components/home/ScenarioShowcase";
import AdBanner from "@/components/home/AdBanner";
import PricingSection from "@/components/home/PricingSection";
import TestimonialWall from "@/components/home/TestimonialWall";
import Footer from "@/components/home/Footer";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import PageViewTracker from "@/components/PageViewTracker";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://randuai.cn";

export const metadata: Metadata = {
  title: "燃渡AI - AI工作流服务平台",
  description:
    "燃渡AI 提供 Coze 工作流执行、Seedance 视频生成、Seedream 文生图、豆包文案生成等 AI 能力。开放 API 与 SDK，支持第三方快速集成。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "燃渡AI - AI工作流服务平台",
    description:
      "Coze 工作流 + Seedance 视频 + Seedream 文生图 + 豆包文案，开放 API 与 Python/Node.js SDK。",
    url: SITE_URL,
    type: "website",
  },
};

/**
 * 首页 JSON-LD 结构化数据
 *
 * 帮助搜索引擎理解站点信息，可能获得富媒体展示。
 */
function StructuredData() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "燃渡AI",
    alternateName: "Randu AI",
    url: SITE_URL,
    description:
      "AI 工作流服务平台，提供 Coze 工作流、AI 视频生成、文生图、文案生成等能力，开放 API 供第三方集成。",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/workspace?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <PageViewTracker page="home" />
      <AnnouncementBanner />
      <HeroCarousel />
      <HeroSection />
      <StatsSection />
      <WorkflowCategories />
      <ScenarioShowcase />
      <PricingSection />
      <TestimonialWall />
      <AdBanner />
      <Footer />
    </>
  );
}
