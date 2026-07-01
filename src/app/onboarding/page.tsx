"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// localStorage 标记键名
const ONBOARDING_KEY = "onboarding_completed";
const ONBOARDING_CHOICES_KEY = "onboarding_choices";

// 步骤配置
const STEPS = [
  { id: "identity", title: "身份选择" },
  { id: "wechat", title: "绑定微信" },
  { id: "interests", title: "关注领域" },
  { id: "complete", title: "完成" },
] as const;

// 身份选项
const IDENTITY_OPTIONS = [
  {
    id: "learn_ai",
    icon: "📚",
    title: "我想学 AI",
    subtitle: "从零开始，系统学习 AI 技能",
   人群: "学生、转型者、终身学习者",
  },
  {
    id: "use_tools",
    icon: "⚡",
    title: "我想用工具",
    subtitle: "直接使用现成工作流，提效降本",
   人群: "电商运营、内容创作者、企业团队",
  },
] as const;

// 领域选项
const INTEREST_OPTIONS = [
  { id: "ecommerce", icon: "🛒", label: "电商运营" },
  { id: "content", icon: "📱", label: "新媒体内容" },
  { id: "education", icon: "🎓", label: "教育培训" },
  { id: "office", icon: "🏢", label: "企业办公" },
  { id: "sidejob", icon: "💰", label: "副业变现" },
  { id: "other", icon: "✨", label: "其他" },
] as const;

type IdentityId = (typeof IDENTITY_OPTIONS)[number]["id"];
type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

// 选择数据结构
interface OnboardingChoices {
  identity: IdentityId | null;
  interests: InterestId[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<OnboardingChoices>({
    identity: null,
    interests: [],
  });

  // 初始化：从 localStorage 读取已保存的选择
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_CHOICES_KEY);
      if (saved) {
        setChoices(JSON.parse(saved));
      }
    } catch {
      // 忽略
    }
  }, []);

  // 保存选择到 localStorage
  const saveChoices = (newChoices: OnboardingChoices) => {
    setChoices(newChoices);
    try {
      localStorage.setItem(ONBOARDING_CHOICES_KEY, JSON.stringify(newChoices));
    } catch {
      // 忽略
    }
  };

  // 完成 onboarding
  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // 忽略
    }
    router.push("/dashboard");
  };

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  // 步骤 1：身份选择
  const handleIdentitySelect = (id: IdentityId) => {
    saveChoices({ ...choices, identity: id });
  };

  // 步骤 3：领域选择切换
  const toggleInterest = (id: InterestId) => {
    const current = choices.interests;
    const newInterests = current.includes(id)
      ? current.filter((i) => i !== id)
      : current.length < 3
        ? [...current, id]
        : current; // 最多 3 个
    saveChoices({ ...choices, interests: newInterests });
  };

  // 前进验证
  const canGoNext = () => {
    if (step === 0) return !!choices.identity;
    if (step === 2) return choices.interests.length > 0;
    return true;
  };

  const handleNext = () => {
    if (canGoNext()) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setStep((s) => s - 1);
    }
  };

  // 获取推荐内容
  const getRecommendations = () => {
    if (choices.identity === "learn_ai") {
      return {
        type: "learning",
        items: [
          { title: "电商 AI 7 天入门", desc: "零基础学习 AI 电商应用" },
          { title: "AI 提示词工程", desc: "掌握与 AI 高效沟通的技巧" },
          { title: "新媒体内容创作", desc: "用 AI 提升内容生产效率" },
        ],
      };
    } else {
      return {
        type: "workflow",
        items: [
          { title: "商品主图生成", desc: "一键生成多风格主图" },
          { title: "短视频文案创作", desc: "AI 批量生成爆款文案" },
          { title: "智能客服工作流", desc: "自动化处理客户咨询" },
        ],
      };
    }
  };

  // 渲染步骤条
  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            {/* 步骤圆圈 */}
            <div
              className={`
                flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold
                transition-all duration-200
                ${
                  i < step
                    ? "border-[#E67E22] bg-[#E67E22] text-white"
                    : i === step
                      ? "border-[#E67E22] bg-white text-[#E67E22]"
                      : "border-[#E8E0D8] bg-white text-[#999999]"
                }
              `}
            >
              {i < step ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {/* 步骤标题 */}
            <span
              className={`
                ml-2 text-sm font-medium hidden sm:block
                transition-colors duration-200
                ${i === step ? "text-[#2C2C2C]" : "text-[#999999]"}
              `}
            >
              {s.title}
            </span>
            {/* 连接线 */}
            {i < totalSteps - 1 && (
              <div
                className={`
                  mx-3 h-0.5 w-8 sm:w-16 transition-colors duration-200
                  ${i < step ? "bg-[#E67E22]" : "bg-[#E8E0D8]"}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] text-center mb-2">
              你希望通过燃渡AI实现什么？
            </h2>
            <p className="text-[#666666] text-center mb-8">
              选择最符合你需求的身份类型
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {IDENTITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleIdentitySelect(option.id)}
                  className={`
                    group relative rounded-xl border-2 p-6 text-left transition-all duration-200
                    ${
                      choices.identity === option.id
                        ? "border-[#E67E22] bg-[#FDF2E9] shadow-md"
                        : "border-[#E8E0D8] bg-white hover:border-[#E67E22]/50 hover:bg-[#FDF2E9]/50"
                    }
                  `}
                >
                  {/* 选中标记 */}
                  {choices.identity === option.id && (
                    <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#E67E22]">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                  {/* 图标 */}
                  <span className="text-4xl mb-3 block">{option.icon}</span>
                  {/* 标题 */}
                  <h3 className="text-lg font-bold text-[#2C2C2C] mb-1">
                    {option.title}
                  </h3>
                  {/* 副标题 */}
                  <p className="text-sm text-[#666666] mb-2">
                    {option.subtitle}
                  </p>
                  {/* 适用人群 */}
                  <p className="text-xs text-[#999999]">{option.人群}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="animate-fade-in text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] mb-2">
              绑定微信，方便下次快速登录
            </h2>
            <p className="text-[#666666] mb-8">
              扫码绑定微信账号，下次登录更便捷
            </p>
            {/* 微信二维码占位区域 */}
            <div className="mx-auto w-56 h-56 rounded-2xl border-2 border-dashed border-[#E8E0D8] bg-[#FAF7F2] flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#E67E22]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#999999]">微信扫码绑定区域</p>
              <p className="text-xs text-[#CCCCCC]">（即将上线）</p>
            </div>
            {/* 跳过提示 */}
            <p className="mt-6 text-sm text-[#999999]">
              可以随时在设置中绑定微信
            </p>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] text-center mb-2">
              你关注哪些应用场景？
            </h2>
            <p className="text-[#666666] text-center mb-2">
              选择你感兴趣的领域（可选 1-3 个）
            </p>
            <p className="text-sm text-[#E67E22] text-center mb-6">
              已选择 {choices.interests.length}/3 个
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {INTEREST_OPTIONS.map((option) => {
                const isSelected = choices.interests.includes(option.id);
                const isDisabled =
                  !isSelected && choices.interests.length >= 3;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleInterest(option.id)}
                    disabled={isDisabled}
                    className={`
                      group relative rounded-xl border-2 p-4 text-left transition-all duration-200
                      ${
                        isSelected
                          ? "border-[#E67E22] bg-[#FDF2E9]"
                          : isDisabled
                            ? "border-[#E8E0D8] bg-white opacity-50 cursor-not-allowed"
                            : "border-[#E8E0D8] bg-white hover:border-[#E67E22]/50"
                      }
                    `}
                  >
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E67E22]">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl mb-2 block">{option.icon}</span>
                    <span
                      className={`
                      text-sm font-medium
                      ${isSelected ? "text-[#E67E22]" : "text-[#2C2C2C]"}
                    `}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        const recommendations = getRecommendations();
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF2E9] mb-4">
                <svg
                  className="h-8 w-8 text-[#E67E22]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] mb-1">
                准备就绪！
              </h2>
              <p className="text-[#666666]">
                根据你的选择，我们为你准备了以下内容
              </p>
            </div>

            {/* 选择总结 */}
            <div className="rounded-xl border border-[#E8E0D8] bg-white p-4 mb-4">
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">
                你的选择
              </h3>
              <div className="flex flex-wrap gap-2">
                {choices.identity && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF2E9] px-3 py-1 text-sm text-[#E67E22]">
                    {choices.identity === "learn_ai" ? "📚 我想学 AI" : "⚡ 我想用工具"}
                  </span>
                )}
                {choices.interests.map((id) => {
                  const interest = INTEREST_OPTIONS.find((i) => i.id === id);
                  return interest ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-3 py-1 text-sm text-[#666666]"
                    >
                      {interest.icon} {interest.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* 推荐内容 */}
            <div className="rounded-xl border border-[#E8E0D8] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">
                {recommendations.type === "learning"
                  ? "📚 推荐学习路径"
                  : "⚡ 热门工作流"}
              </h3>
              <div className="space-y-2">
                {recommendations.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-[#FAF7F2] p-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E67E22]/10 text-sm font-semibold text-[#E67E22]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#2C2C2C]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#999999]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染底部按钮
  const renderFooter = () => (
    <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#E8E0D8]">
      {isFirst ? (
        <Link
          href="/dashboard"
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#666666] transition-colors hover:bg-[#F5F0E8]"
        >
          跳过
        </Link>
      ) : (
        <button
          type="button"
          onClick={handlePrev}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#666666] transition-colors hover:bg-[#F5F0E8]"
        >
          上一步
        </button>
      )}

      {isLast ? (
        <div className="flex flex-col sm:flex-row gap-2">
          {choices.identity === "learn_ai" && (
            <Link
              href="/academy"
              className="rounded-xl border-2 border-[#E8E0D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2C2C] transition-colors hover:bg-[#F5F0E8]"
            >
              进入学院
            </Link>
          )}
          {choices.identity === "use_tools" && (
            <Link
              href="/workspace"
              className="rounded-xl border-2 border-[#E8E0D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2C2C] transition-colors hover:bg-[#F5F0E8]"
            >
              进入工作台
            </Link>
          )}
          <button
            type="button"
            onClick={completeOnboarding}
            className="rounded-xl bg-[#E67E22] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#D35400]"
          >
            进入首页
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext()}
          className={`
            rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200
            ${
              canGoNext()
                ? "bg-[#E67E22] text-white hover:bg-[#D35400] active:scale-[0.98]"
                : "bg-[#E8E0D8] text-[#999999] cursor-not-allowed"
            }
          `}
        >
          {step === 1 ? "跳过" : "下一步"}
        </button>
      )}
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8E0D8] border-t-[#E67E22]" />
          <p className="text-sm text-[#999999]">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* 顶部装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#E67E22]/5 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#E67E22]/8 transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E67E22]">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#2C2C2C]">燃渡AI</span>
        </div>

        {/* 卡片 */}
        <div className="rounded-2xl border border-[#E8E0D8] bg-white p-6 shadow-lg sm:p-8">
          {/* 步骤条 */}
          {renderStepper()}

          {/* 步骤内容 */}
          {renderStepContent()}

          {/* 底部按钮 */}
          {renderFooter()}
        </div>

        {/* 底部链接 */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-[#999999] transition-colors hover:text-[#666666]"
          >
            稍后完成 →
          </Link>
        </div>
      </div>
    </div>
  );
}
