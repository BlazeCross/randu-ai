import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";

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
    <AppShell
      title={workflow.name}
      sidebar={
        <div className="flex flex-col gap-4 p-3">
          {/* 工作流图标 + 名称 */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
              {workflow.icon || "🤖"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {workflow.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  {workflow.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {workflow.status === "active" ? "已上线" : workflow.status}
                </span>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="px-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              快速操作
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/workspace/${workflow.id}/use`}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
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
              {workflow.feishuDocUrl ? (
                <a
                  href={workflow.feishuDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  查看教程
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                  暂无教程
                </span>
              )}
            </div>
          </div>

          {/* 附加信息 */}
          <div className="border-t border-border px-2 pt-2">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">分类</dt>
                <dd className="font-medium text-foreground">
                  {workflow.category}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">状态</dt>
                <dd className="font-medium text-foreground">
                  {workflow.status === "active" ? "已上线" : workflow.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">上线</dt>
                <dd className="font-medium text-foreground">{createdAtStr}</dd>
              </div>
            </dl>
          </div>

          {/* 相关推荐 */}
          {related.length > 0 && (
            <div className="border-t border-border px-2 pt-2">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                相关推荐
              </div>
              <div className="flex flex-col gap-1">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/workflow/${item.id}`}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="text-lg">{item.icon || "🤖"}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    >
      {/* 主内容：工作流介绍 + 使用说明 */}
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          {/* 工作流介绍 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground">工作流介绍</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {workflow.description || "暂无描述"}
            </p>
          </section>

          {/* 使用说明 */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">使用说明</h2>
            <ol className="mt-4 space-y-4">
              {USAGE_STEPS.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
