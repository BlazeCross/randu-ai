import Link from "next/link";
import { default as Navbar } from "@/components/layout/Navbar";

/**
 * 全局 404 页面
 *
 * Next.js App Router 自动捕获未匹配路由的访问。
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-7xl font-bold tracking-tight text-primary-200">
            404
          </div>
          <h1 className="mb-3 text-2xl font-bold text-foreground">
            页面走丢了
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            你访问的页面不存在或已被移除，请检查链接是否正确
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
            >
              返回首页
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              浏览工作流
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
