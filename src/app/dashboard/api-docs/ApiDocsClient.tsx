"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 最小化的 OpenAPI 规范类型（运行时容错）
interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  description?: string;
  enum?: (string | number)[];
  default?: string | number | boolean;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  example?: unknown;
  nullable?: boolean;
  $ref?: string;
}

interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: OpenApiSchema;
    description?: string;
  }>;
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: OpenApiSchema }> }>;
  security?: Array<Record<string, unknown>>;
}

interface OpenApiPath {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
  patch?: OpenApiOperation;
}

interface OpenApiSpec {
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, OpenApiPath>;
  components?: {
    securitySchemes?: Record<string, { type: string; in?: string; name?: string; description?: string }>;
  };
}

const HTTP_METHOD_COLORS: Record<string, string> = {
  get: "bg-accent text-accent-foreground border-border",
  post: "bg-success/15 text-success border-success/30",
  put: "bg-accent text-accent-foreground border-border",
  delete: "bg-destructive/15 text-destructive border-destructive/30",
  patch: "bg-accent text-accent-foreground border-border",
};

/**
 * 渲染一个 schema 为简化的字段列表
 */
function SchemaTable({ schema, depth = 0 }: { schema: OpenApiSchema; depth?: number }) {
  if (!schema) return null;

  // 数组类型
  if (schema.type === "array" && schema.items) {
    return (
      <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
        <p className="text-xs text-muted-foreground">数组元素：</p>
        <SchemaTable schema={schema.items} depth={depth + 1} />
      </div>
    );
  }

  // 对象类型
  const props = schema.properties;
  if (!props) {
    return (
      <div className="text-xs text-muted-foreground">
        {schema.type || "any"}
        {schema.enum && ` · 可选值：${schema.enum.join(" / ")}`}
        {schema.description && ` · ${schema.description}`}
      </div>
    );
  }

  const required = new Set(schema.required ?? []);

  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">字段</th>
            <th className="py-1.5 pr-2 font-medium">类型</th>
            <th className="py-1.5 pr-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([key, prop]) => (
            <tr key={key} className="border-b border-border last:border-0">
              <td className="py-1.5 pr-2 font-mono text-foreground">
                {key}
                {required.has(key) && (
                  <span className="ml-1 text-destructive" title="必填">
                    *
                  </span>
                )}
              </td>
              <td className="py-1.5 pr-2 font-mono text-muted-foreground">
                {prop.type === "array" ? "array" : prop.type ?? "object"}
                {prop.nullable && " | null"}
                {prop.enum && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    enum: {prop.enum.join(", ")}
                  </div>
                )}
              </td>
              <td className="py-1.5 pr-2 text-muted-foreground">
                {prop.description}
                {prop.default !== undefined && (
                  <span className="ml-1 text-muted-foreground">
                    默认: <code className="font-mono">{String(prop.default)}</code>
                  </span>
                )}
                {prop.minimum !== undefined && ` · min: ${prop.minimum}`}
                {prop.maximum !== undefined && ` · max: ${prop.maximum}`}
                {prop.maxLength !== undefined && ` · 最大长度: ${prop.maxLength}`}
                {prop.example !== undefined && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    示例: {String(prop.example)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 单个接口的展开卡片
 */
function OperationCard({
  path,
  method,
  operation,
  baseUrl,
}: {
  path: string;
  method: string;
  operation: OpenApiOperation;
  baseUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const requestBodySchema =
    operation.requestBody?.content?.["application/json"]?.schema;

  // 提取成功响应的 schema
  const okResponse = operation.responses?.["200"];
  const responseSchema = okResponse?.content?.["application/json"]?.schema;

  const fullUrl = `${baseUrl}${path}`;

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted"
      >
        <span
          className={`inline-flex h-7 w-16 items-center justify-center rounded-[var(--radius-sm)] border text-xs font-bold uppercase ${HTTP_METHOD_COLORS[method] ?? "bg-muted text-foreground border-border"}`}
        >
          {method}
        </span>
        <code className="font-mono text-sm text-foreground">{path}</code>
        <span className="ml-auto flex items-center gap-3">
          {operation.summary && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {operation.summary}
            </span>
          )}
          <svg
            className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-border px-5 py-5">
          {/* 描述 */}
          {operation.description && (
            <p className="text-sm text-foreground">{operation.description}</p>
          )}

          {/* 完整 URL */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">完整地址</p>
            <code className="block break-all rounded-[var(--radius-sm)] bg-foreground px-3 py-2 font-mono text-xs text-background">
              {method.toUpperCase()} {fullUrl}
            </code>
          </div>

          {/* 鉴权 */}
          {operation.security && (
            <div className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-xs text-accent-foreground">
              鉴权：X-API-Key 请求头（在
              <Link href="/dashboard/keys" className="underline">
                {" "}
                个人中心 → API Key{" "}
              </Link>
              创建后获取）
            </div>
          )}

          {/* 查询参数 */}
          {operation.parameters && operation.parameters.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">查询参数</p>
              <SchemaTable
                schema={{
                  type: "object",
                  properties: Object.fromEntries(
                    operation.parameters.map((p) => [
                      p.name,
                      { ...(p.schema ?? {}), description: p.description },
                    ]),
                  ),
                  required: operation.parameters
                    .filter((p) => p.required)
                    .map((p) => p.name),
                }}
              />
            </div>
          )}

          {/* 请求体 */}
          {requestBodySchema && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                请求体
                {operation.requestBody?.required && (
                      <span className="ml-1 text-xs text-destructive">必填</span>
                )}
              </p>
              <SchemaTable schema={requestBodySchema} />
            </div>
          )}

          {/* 响应 */}
          {responseSchema && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                响应（200）
              </p>
              <SchemaTable schema={responseSchema} />
            </div>
          )}

          {/* 其他响应码 */}
          {operation.responses &&
            Object.entries(operation.responses).filter(([code]) => code !== "200").length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">其他响应</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(operation.responses)
                    .filter(([code]) => code !== "200")
                    .map(([code, resp]) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        <code className="font-mono font-medium text-foreground">
                          {code}
                        </code>
                        {resp.description && (
                          <span className="text-muted-foreground">{resp.description}</span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocsClient() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/docs/openapi.json", { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("加载 OpenAPI 规范失败");
        return res.json();
      })
      .then((data: OpenApiSpec) => {
        if (cancelled) return;
        setSpec(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 按 tag 分组接口
  const groupedPaths: Record<string, Array<{ path: string; method: string; op: OpenApiOperation }>> = {};
  if (spec) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!op) continue;
        const tags = op.tags ?? ["Other"];
        for (const t of tags) {
          if (!groupedPaths[t]) groupedPaths[t] = [];
          groupedPaths[t].push({ path, method, op });
        }
      }
    }
  }

  const baseUrl = spec?.servers?.[0]?.url ?? "";

  return (
    <main className="flex-1 bg-background">
      {/* 面包屑 */}
      <div className="border-b border-border bg-card">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary">
                首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-foreground" aria-current="page">
              API 文档
            </li>
          </ol>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            API 文档
          </h1>
          {spec ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {spec.info.description} ·{" "}
              <span className="font-mono">v{spec.info.version}</span>
              {baseUrl && (
                <>
                  {" "}
                  · Base URL:{" "}
                  <code className="font-mono text-primary">{baseUrl}</code>
                </>
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
          )}

          {/* 快速入口 */}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/api/docs/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              下载 OpenAPI JSON
            </a>
            <Link
              href="/dashboard/keys"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              管理 API Key
            </Link>
            <a
              href="https://github.com/BlazeCross/randu-ai/tree/main/sdks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.81 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              客户端 SDK（Python / Node.js）
            </a>
          </div>
        </div>

        {/* 鉴权说明 */}
        <div className="mb-8 rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">鉴权方式</h2>
          <p className="text-xs text-muted-foreground">
            所有接口使用 HTTP Header <code className="rounded bg-card px-1.5 py-0.5 font-mono">X-API-Key</code> 鉴权。
            在个人中心创建 API Key 后获得明文 Key，每次请求需在 Header 中携带：
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] bg-foreground p-3 text-xs text-background">
            <code>{`X-API-Key: sk_your_api_key_here
Content-Type: application/json`}</code>
          </pre>
        </div>

        {/* 加载中 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : !spec ? null : (
          <>
            {/* 标签筛选 */}
            {spec.tags && spec.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag("all")}
                  className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTag === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  全部
                </button>
                {spec.tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => setActiveTag(tag.name)}
                    className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTag === tag.name
                        ? "bg-primary text-white"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {tag.name}
                    {tag.description && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        {tag.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 接口列表 */}
            <div className="space-y-6">
              {Object.entries(groupedPaths)
                .filter(([tag]) => activeTag === "all" || activeTag === tag)
                .map(([tag, ops]) => (
                  <section key={tag}>
                    <h2 className="mb-3 text-lg font-semibold text-foreground">
                      {tag}
                    </h2>
                    <div className="space-y-3">
                      {ops.map(({ path, method, op }) => (
                        <OperationCard
                          key={`${method}-${path}`}
                          path={path}
                          method={method}
                          operation={op}
                          baseUrl={baseUrl}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>

            {/* 错误码参考 */}
            <div className="mt-10 rounded-[var(--radius)] border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                错误码参考
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">HTTP 状态码</th>
                    <th className="py-2 pr-3 font-medium">含义</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    ["200", "请求成功"],
                    ["400", "请求参数错误"],
                    ["401", "API Key 无效或缺失"],
                    ["402", "点数不足，需充值"],
                    ["403", "账号被禁用或无权访问"],
                    ["404", "资源不存在"],
                    ["429", "触发频率限制（QPS 或每日限额）"],
                    ["500", "服务器内部错误"],
                    ["502", "上游服务（火山方舟 / Coze）调用失败"],
                  ].map(([code, meaning]) => (
                    <tr key={code} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3">
                        <code className="font-mono text-foreground">{code}</code>
                      </td>
                      <td className="py-2 pr-3">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 频率限制说明 */}
            <div className="mt-6 rounded-[var(--radius)] border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                频率限制
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                每个 API Key 有独立的 QPS 限制和每日调用上限，可在
                <Link href="/dashboard/keys" className="mx-1 text-primary underline">
                  API Key 管理
                </Link>
                页面调整：
              </p>
              <ul className="space-y-1.5 text-sm text-foreground">
                <li>· QPS 限制：每秒最大请求数，默认 5 次/秒，0 表示不限制</li>
                <li>· 每日限额：每日最大调用次数，默认 1000 次/天，0 表示不限制</li>
                <li>· 触发限流时返回 429，响应头包含 Retry-After（建议重试等待秒数）</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
