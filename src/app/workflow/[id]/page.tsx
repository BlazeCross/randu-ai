import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

// 工作流详情页（服务端组件）
// 通过 params.id 直接查询数据库获取工作流详情

// 相关推荐数量
const RELATED_LIMIT = 4;

/**
 * 根据工作流 ID 查询详情
 * 不存在返回 null（由调用方触发 notFound）
 */
async function getWorkflow(id: string) {
  return prisma.workflow.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      cozeWorkflowId: true,
      icon: true,
      status: true,
      feishuDocUrl: true,
      createdAt: true,
    },
  });
}

/**
 * 动态生成工作流详情页 SEO 元数据
 *
 * Next.js 16 中 params 为 Promise，需 await
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) {
    return {
      title: "工作流不存在",
      robots: { index: false, follow: false },
    };
  }

  const title = `${workflow.name} - 使用教程与立即体验`;
  const description =
    workflow.description ??
    `${workflow.name} 是燃渡AI 提供的 ${workflow.category} 工作流，立即体验 AI 能力。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/workflow/${id}`,
    },
    openGraph: {
      title: `${workflow.name} | 燃渡AI`,
      description,
      type: "article",
    },
  };
}

/**
 * 查询同分类下的其他工作流作为相关推荐
 */
async function getRelatedWorkflows(category: string, excludeId: string) {
  return prisma.workflow.findMany({
    where: {
      category,
      id: { not: excludeId },
      status: "active",
    },
    orderBy: { sortOrder: "asc" },
    take: RELATED_LIMIT,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      icon: true,
      status: true,
    },
  });
}

// 使用说明步骤（通用文案，所有工作流共用）
const USAGE_STEPS = [
  {
    title: "点击「立即使用」",
    desc: "进入工作流使用页面，准备开始你的 AI 创作之旅。",
  },
  {
    title: "填写输入内容",
    desc: "根据工作流要求，填写或上传所需的输入素材，如文本、图片等。",
  },
  {
    title: "提交任务",
    desc: "确认输入无误后提交任务，系统将调用 AI 工作流进行处理。",
  },
  {
    title: "查看与下载结果",
    desc: "任务完成后，可在使用页面查看处理结果并下载保存。",
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  // Next.js 16 中 params 为 Promise
  const { id } = await params;

  // 查询工作流详情
  const workflow = await getWorkflow(id);
  if (!workflow) {
    notFound();
  }

  // 查询相关推荐（同分类的其他工作流）
  const related = await getRelatedWorkflows(workflow.category, workflow.id);

  // 格式化创建时间
  const createdAtStr = workflow.createdAt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex-1 bg-neutral-50">
      {/* 面包屑 */}
      <div className="border-b border-neutral-200 bg-white">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-primary">
                首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/workspace" className="hover:text-primary">
                工作台
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-neutral-900" aria-current="page">
              {workflow.name}
            </li>
          </ol>
        </nav>
      </div>

      {/* 主体内容 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 左侧：工作流信息 */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
              {/* 头部：图标 + 名称 + 分类 */}
              <div className="flex items-start gap-5">
                <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-4xl">
                  {workflow.icon || "🤖"}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    {workflow.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                      {workflow.category}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      {workflow.status === "active" ? "已上线" : workflow.status}
                    </span>
                    <span className="text-xs text-neutral-500">
                      上线时间：{createdAtStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* 详细描述 */}
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-neutral-900">
                  工作流介绍
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-600">
                  {workflow.description || "暂无描述"}
                </p>
              </section>

              {/* 使用说明 */}
              <section className="mt-10">
                <h2 className="text-lg font-semibold text-neutral-900">
                  使用说明
                </h2>
                <ol className="mt-4 space-y-4">
                  {USAGE_STEPS.map((step, idx) => (
                    <li key={idx} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-neutral-600">
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>

          {/* 右侧：操作卡片 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl border border-neutral-200 bg-white p-6">
              <h3 className="text-base font-semibold text-neutral-900">
                快速操作
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                立即体验或查看详细教程
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {/* 立即使用按钮 */}
                <Link
                  href={`/workspace/${workflow.id}/use`}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary-600/30"
                >
                  立即使用
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>

                {/* 查看教程按钮 */}
                {workflow.feishuDocUrl ? (
                  <a
                    href={workflow.feishuDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                  >
                    查看教程
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-3 text-sm font-medium text-neutral-400">
                    暂无教程
                  </span>
                )}
              </div>

              {/* 附加信息 */}
              <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-6 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">分类</dt>
                  <dd className="font-medium text-neutral-900">
                    {workflow.category}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">状态</dt>
                  <dd className="font-medium text-neutral-900">
                    {workflow.status === "active" ? "已上线" : workflow.status}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 相关推荐 */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              相关推荐
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              同分类下的其他工作流
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/workflow/${item.id}`}
                  className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-600/5"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-xl transition-colors group-hover:bg-primary-100">
                    {item.icon || "🤖"}
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-neutral-900">
                    {item.name}
                  </h3>
                  <p className="line-clamp-2 flex-1 text-xs leading-5 text-neutral-600">
                    {item.description || "暂无描述"}
                  </p>
                  <span className="mt-3 inline-flex items-center text-xs font-medium text-primary-600">
                    查看详情
                    <svg
                      className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
