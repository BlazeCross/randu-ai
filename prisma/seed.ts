import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const plansData: Array<{
  name: string;
  dailyLimit: number;
  monthlyPrice: number;
  features: string[];
}> = [
  {
    name: "基础版",
    dailyLimit: 30,
    monthlyPrice: 99,
    features: ["每日30次调用", "基础工作流", "邮件支持"],
  },
  {
    name: "专业版",
    dailyLimit: 100,
    monthlyPrice: 299,
    features: ["每日100次调用", "全部工作流", "优先支持", "API接入"],
  },
  {
    name: "企业版",
    dailyLimit: 1000,
    monthlyPrice: 999,
    features: [
      "每日1000次调用",
      "全部工作流",
      "专属客服",
      "定制工作流",
      "API接入",
    ],
  },
];

const workflowsData: Array<{
  name: string;
  description: string;
  category: string;
  cozeWorkflowId: string;
  icon: string;
  feishuDocUrl: string;
  inputSchema: Prisma.InputJsonValue;
  creditsRequired: number;
  outputType: string;
}> = [
  {
    name: "服装换装视频生成",
    description: "上传服装图片，AI自动生成换装视频",
    category: "视频生成",
    cozeWorkflowId: "7654310872097488946",
    icon: "shirt",
    feishuDocUrl: process.env.FEISHU_DOC_URL || "https://feishu.cn/doc/placeholder",
    inputSchema: {
      fields: [
        {
          name: "yuansitu",
          label: "原图",
          type: "image",
          required: true,
          placeholder: "请上传服装原图",
        },
      ],
    } as Prisma.InputJsonValue,
    creditsRequired: 1,
    outputType: "video",
  },
];

async function main() {
  console.log("开始种子数据初始化...");

  // 1. 初始化 plans 表
  for (const plan of plansData) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        dailyLimit: plan.dailyLimit,
        monthlyPrice: plan.monthlyPrice,
        features: plan.features,
      },
      create: {
        name: plan.name,
        dailyLimit: plan.dailyLimit,
        monthlyPrice: plan.monthlyPrice,
        features: plan.features,
      },
    });
    console.log(`✓ Plan 已就绪: ${plan.name}`);
  }

  // 2. 初始化 workflows 表
  for (const workflow of workflowsData) {
    const existing = await prisma.workflow.findFirst({
      where: { name: workflow.name },
    });
    if (existing) {
      await prisma.workflow.update({
        where: { id: existing.id },
        data: {
          description: workflow.description,
          category: workflow.category,
          cozeWorkflowId: workflow.cozeWorkflowId,
          icon: workflow.icon,
          feishuDocUrl: workflow.feishuDocUrl,
        },
      });
    } else {
      await prisma.workflow.create({
        data: {
          name: workflow.name,
          description: workflow.description,
          category: workflow.category,
          cozeWorkflowId: workflow.cozeWorkflowId,
          icon: workflow.icon,
          feishuDocUrl: workflow.feishuDocUrl,
        },
      });
    }
    console.log(`✓ Workflow 已就绪: ${workflow.name}`);
  }

  console.log("种子数据初始化完成！");
}

main()
  .catch((e) => {
    console.error("种子数据初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
