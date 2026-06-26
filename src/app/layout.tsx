import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://randu.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "燃渡AI - AI工作流服务平台",
    template: "%s | 燃渡AI",
  },
  description:
    "燃渡AI 是一个让 AI 工作流触手可及的服务平台，提供 Coze 工作流执行、Seedance 视频生成、Seedream 文生图、豆包文案生成等 AI 能力，并开放 API 供第三方集成。",
  keywords: [
    "燃渡AI",
    "AI工作流",
    "Coze",
    "Seedance",
    "Seedream",
    "豆包",
    "AI视频生成",
    "文生图",
    "AI API",
    "火山方舟",
  ],
  authors: [{ name: "燃渡AI" }],
  creator: "燃渡AI",
  publisher: "燃渡AI",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "燃渡AI",
    title: "燃渡AI - AI工作流服务平台",
    description:
      "提供 Coze 工作流执行、Seedance 视频生成、Seedream 文生图、豆包文案生成等 AI 能力，开放 API 供第三方集成。",
  },
  twitter: {
    card: "summary_large_image",
    title: "燃渡AI - AI工作流服务平台",
    description: "提供 Coze 工作流、AI 视频生成、文生图、文案生成等 AI 能力，开放 API 供第三方集成。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
