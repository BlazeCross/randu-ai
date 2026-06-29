"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ===== 类型定义 =====

// 订阅套餐（对应 /api/payment/packages 返回的 plans 元素）
interface PlanItem {
  id: string;
  name: string;
  monthlyPrice: number;
  dailyLimit: number;
  features: string[];
  type: "subscription" | "credits_pack";
  credits?: number;
  validDays?: number;
}

// /api/payment/packages 接口返回结构
interface PackagesResponse {
  paymentEnabled: boolean;
  plans: PlanItem[];
  creditsPackages: Array<{
    id: string;
    credits: number;
    price: number;
    label: string;
    bonus?: string;
  }>;
}

// /api/payment/create 接口返回结构
interface CreatePaymentResponse {
  orderId: string;
  orderNo: string;
  payUrl: string;
  message?: string;
}

// ===== 本地默认数据（接口失败时回退使用） =====

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "default-basic",
    name: "基础版",
    monthlyPrice: 99,
    dailyLimit: 30,
    features: ["每日30次调用", "基础工作流", "邮件支持"],
    type: "subscription",
  },
  {
    id: "default-pro",
    name: "专业版",
    monthlyPrice: 299,
    dailyLimit: 100,
    features: ["每日100次调用", "全部工作流", "优先支持", "API接入"],
    type: "subscription",
  },
  {
    id: "default-enterprise",
    name: "企业版",
    monthlyPrice: 999,
    dailyLimit: 1000,
    features: [
      "每日1000次调用",
      "全部工作流",
      "专属客服",
      "定制工作流",
      "API接入",
    ],
    type: "subscription",
  },
];

// 免费版卡片（仅展示用，不参与下单）
const FREE_TIER = {
  name: "免费版",
  price: 0,
  credits: "试用额度",
  features: ["7 天免费试用", "10 次试用调用", "基础工作流体验", "社区支持"],
};

// 功能对比表数据：每行展示功能名称及各套餐的支持情况
const COMPARISON_ROWS: Array<{
  feature: string;
  // 按 [免费版, 基础版, 专业版, 企业版] 顺序，值为 string | boolean
  values: [string | boolean, string | boolean, string | boolean, string | boolean];
}> = [
  {
    feature: "每日调用次数",
    values: ["10 次", "30 次", "100 次", "1000 次"],
  },
  {
    feature: "工作流库",
    values: ["基础", "基础", "全部", "全部 + 定制"],
  },
  {
    feature: "API 接入",
    values: [false, false, true, true],
  },
  {
    feature: "响应速度",
    values: ["标准", "标准", "加速", "优先"],
  },
  {
    feature: "技术支持",
    values: ["社区", "邮件", "优先", "专属客服"],
  },
  {
    feature: "团队协作",
    values: [false, false, true, true],
  },
  {
    feature: "自定义工作流",
    values: [false, false, false, true],
  },
  {
    feature: "SLA 服务保障",
    values: [false, false, false, true],
  },
];

// FAQ 列表
const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "免费试用需要绑定支付方式吗？",
    answer:
      "不需要。注册账号即可获得 7 天免费试用与 10 次试用调用额度，无需绑定支付方式，试用到期后可自由选择是否升级套餐。",
  },
  {
    question: "套餐订阅后可以更换或取消吗？",
    answer:
      "可以随时在个人中心的订单管理页升级或更换套餐。取消订阅后，当前计费周期内的权益仍然有效，到期后不再续费。",
  },
  {
    question: "积分和套餐调用次数有什么区别？",
    answer:
      "订阅套餐按月提供每日固定调用次数；积分则为一次性额度，可用于点数包套餐或单独充值，积分按实际消耗扣减，有效期见对应套餐说明。",
  },
  {
    question: "API 调用是如何计费的？",
    answer:
      "API 调用同样消耗套餐每日调用次数或积分。专业版及以上套餐开放 API 接入能力，可在个人中心的 API Key 管理页面创建密钥并查看调用日志。",
  },
  {
    question: "支付后多久能生效？",
    answer:
      "支付宝支付成功后，订单会在回调到达后自动结算，套餐权益与积分将立即发放到账。如长时间未到账，可在订单管理页点击刷新或联系客服。",
  },
  {
    question: "企业版支持定制吗？",
    answer:
      "企业版支持专属工作流定制、私有化部署与 SLA 服务保障，如有定制需求可联系客服沟通具体方案与报价。",
  },
];

// 套餐展示卡片数据结构
interface DisplayCard {
  id: string;
  name: string;
  price: number;
  priceSuffix: string;
  description: string;
  features: string[];
  highlighted: boolean;
  ctaLabel: string;
  // 下单时需要传给 /api/payment/create 的 planName（免费版为 null）
  planName: string | null;
}

// 简单的 className 拼接工具
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export default function PricingPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [packages, setPackages] = useState<PackagesResponse | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(true);
  // 创建订单中状态（记录哪个按钮在 loading）
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 拉取套餐数据（失败时回退到默认数据）
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment/packages")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PackagesResponse | null) => {
        if (cancelled) return;
        if (data) {
          setPackages(data);
        } else {
          // 接口失败：使用默认数据
          setPackages({
            paymentEnabled: false,
            plans: DEFAULT_PLANS,
            creditsPackages: [],
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPackages({
          paymentEnabled: false,
          plans: DEFAULT_PLANS,
          creditsPackages: [],
        });
      })
      .finally(() => {
        if (!cancelled) setPackagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 仅展示订阅套餐（按价格升序）
  const subscriptionPlans = (packages?.plans ?? []).filter(
    (p) => p.type === "subscription",
  );

  // 构造展示卡片：免费版 + 订阅套餐
  // 中间一张（订阅套餐的第二张，即"专业版"）高亮"推荐"
  const displayCards: DisplayCard[] = [
    {
      id: "free",
      name: FREE_TIER.name,
      price: FREE_TIER.price,
      priceSuffix: "/永久",
      description: "适合新用户试用体验",
      features: FREE_TIER.features,
      highlighted: false,
      ctaLabel: user ? "当前套餐" : "免费注册",
      planName: null,
    },
    ...subscriptionPlans.map((plan, idx) => {
      // 订阅套餐中间项高亮；如果只有 1 张则不高亮，2 张则第 1 张，3+ 张则中间
      const midIdx =
        subscriptionPlans.length <= 1
          ? -1
          : subscriptionPlans.length === 2
            ? 0
            : Math.floor(subscriptionPlans.length / 2);
      const highlighted = idx === midIdx;
      const isCurrent = !!user && user.subscriptionPlan === plan.name;
      return {
        id: plan.id,
        name: plan.name,
        price: plan.monthlyPrice,
        priceSuffix: "/月",
        description: getPlanDescription(plan.name),
        features: plan.features,
        highlighted,
        ctaLabel: isCurrent
          ? "当前套餐"
          : highlighted
            ? "立即订阅"
            : "选择套餐",
        planName: plan.name,
      };
    }),
  ];

  // 创建支付订单并跳转支付宝
  const handleSubscribe = useCallback(
    async (card: DisplayCard) => {
      // 免费版：未登录跳转注册，已登录无操作
      if (card.planName === null) {
        if (!user) {
          router.push("/register");
        }
        return;
      }

      // 未登录：跳转登录页
      if (!user || !token) {
        router.push("/login");
        return;
      }

      // 支付功能未开通
      if (!packages?.paymentEnabled) {
        setErrorMsg("支付功能暂未开放，请联系管理员开通");
        return;
      }

      const key = `plan-${card.id}`;
      setCreatingKey(key);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "subscription",
            planName: card.planName,
          }),
        });
        const data = (await res
          .json()
          .catch(() => ({}))) as CreatePaymentResponse;
        if (!res.ok || !data.payUrl) {
          throw new Error(data.message || "创建订单失败");
        }
        // 跳转支付宝支付页面
        window.location.href = data.payUrl;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "创建订单失败");
      } finally {
        setCreatingKey(null);
      }
    },
    [user, token, packages, router],
  );

  return (
    <main className="flex-1 bg-background">
      {/* ===== Hero 区域 ===== */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary/3 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            定价方案
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            选择适合你的套餐
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            灵活的订阅方案与积分包，满足个人到企业的不同使用需求。所有套餐均含 7 天免费试用。
          </p>
        </div>
      </section>

      {/* ===== 套餐对比卡片 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {errorMsg && (
          <div className="mx-auto mb-8 max-w-3xl rounded-[var(--radius-sm)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {packagesLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[var(--radius)] border border-border bg-card"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
            {displayCards.map((card) => {
              const isCurrent =
                user?.subscriptionPlan === card.planName;
              const isCreating = creatingKey === `plan-${card.id}`;
              const isFree = card.planName === null;
              return (
                <div
                  key={card.id}
                  className={cx(
                    "relative flex flex-col rounded-[var(--radius)] border bg-card p-6 transition-all duration-300",
                    card.highlighted
                      ? "border-primary shadow-[var(--shadow-md)] lg:scale-105 lg:-translate-y-2"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  {/* 推荐标签 */}
                  {card.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-primary-400 px-4 py-1 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-sm)]">
                        推荐
                      </span>
                    </div>
                  )}

                  {/* 套餐名 */}
                  <h3 className="text-lg font-semibold text-foreground">
                    {card.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>

                  {/* 价格 */}
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ¥{card.price}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      {card.priceSuffix}
                    </span>
                  </div>

                  {/* CTA 按钮 */}
                  <button
                    type="button"
                    disabled={
                      isCreating ||
                      (isCurrent && !isFree) ||
                      (!packages?.paymentEnabled && !isFree)
                    }
                    onClick={() => handleSubscribe(card)}
                    className={cx(
                      "mt-6 w-full rounded-full px-4 py-3 text-center text-sm font-semibold transition-all duration-200",
                      card.highlighted
                        ? "bg-gradient-to-r from-primary to-primary-400 text-primary-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:brightness-110"
                        : "border border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent/30",
                      (isCreating ||
                        (isCurrent && !isFree) ||
                        (!packages?.paymentEnabled && !isFree)) &&
                        "cursor-not-allowed opacity-60",
                    )}
                  >
                    {isCreating
                      ? "创建订单中..."
                      : isCurrent && !isFree
                        ? "当前套餐"
                        : card.ctaLabel}
                  </button>

                  {/* 功能列表 */}
                  <ul className="mt-6 space-y-3">
                    {card.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* 支付功能提示 */}
        {!packagesLoading && !packages?.paymentEnabled && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            支付功能暂未开放，如需订阅请联系客服
          </p>
        )}
      </section>

      {/* ===== 功能对比表 ===== */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              功能对比
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              详细对比各套餐的功能差异，找到最适合你的方案
            </p>
          </div>

          {/* 桌面端表格 */}
          <div className="mt-10 hidden overflow-hidden rounded-[var(--radius)] border border-border bg-card lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    功能
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    免费版
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    基础版
                  </th>
                  <th className="bg-primary/5 px-6 py-4 text-center font-semibold text-primary">
                    专业版
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    企业版
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={cx(
                      idx % 2 === 1 && "bg-muted/30",
                      "border-b border-border last:border-b-0",
                    )}
                  >
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {row.feature}
                    </td>
                    {row.values.map((value, vIdx) => (
                      <td
                        key={vIdx}
                        className={cx(
                          "px-6 py-3.5 text-center",
                          vIdx === 2 && "bg-primary/5",
                        )}
                      >
                        {typeof value === "boolean" ? (
                          value ? (
                            <svg
                              className="mx-auto h-5 w-5 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="mx-auto h-5 w-5 text-muted-foreground/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )
                        ) : (
                          <span className="text-foreground">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片列表 */}
          <div className="mt-8 space-y-4 lg:hidden">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.feature}
                className="rounded-[var(--radius-sm)] border border-border bg-card p-4"
              >
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {row.feature}
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {(["免费版", "基础版", "专业版", "企业版"] as const).map(
                    (planName, idx) => {
                      const value = row.values[idx];
                      return (
                        <div
                          key={planName}
                          className="flex items-center justify-between gap-2"
                        >
                          <dt className="text-muted-foreground">{planName}</dt>
                          <dd className="font-medium text-foreground">
                            {typeof value === "boolean"
                              ? value
                                ? "✓"
                                : "—"
                                : value}
                          </dd>
                        </div>
                      );
                    },
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ 板块 ===== */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              常见问题
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              关于定价与套餐的常见疑问解答
            </p>
          </div>
          <div className="mt-10 space-y-4">
            {FAQS.map((faq) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="border-t border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            准备好开始了吗？
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            注册即可获得 7 天免费试用，无需绑定支付方式。有任何疑问欢迎随时联系客服。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:brightness-110"
              >
                进入个人中心
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:brightness-110"
              >
                免费注册
              </Link>
            )}
            <Link
              href="/credits"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              查看积分
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ===== 辅助组件 =====

// FAQ 折叠项
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <svg
          className={cx(
            "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

// 根据套餐名返回描述文案
function getPlanDescription(name: string): string {
  switch (name) {
    case "基础版":
      return "适合个人用户和小团队起步";
    case "专业版":
      return "适合专业团队和成长型企业";
    case "企业版":
      return "适合大型企业和定制化需求";
    default:
      return "适合个人到企业的不同需求";
  }
}
