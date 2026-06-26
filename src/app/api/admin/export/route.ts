import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toCSV, csvResponse, formatCsvDate } from "@/lib/csv";

// 单次导出上限（防止内存爆炸）
const MAX_EXPORT_ROWS = 10000;

/**
 * GET /api/admin/export?type=users|callLogs|orders - 导出 CSV
 *
 * 查询参数：
 * - type: 导出类型（必填）
 *   - users: 用户列表
 *   - callLogs: API 调用日志
 *   - orders: 订单记录
 * - startDate: 起始日期（YYYY-MM-DD，可选）
 * - endDate: 结束日期（YYYY-MM-DD，可选）
 *
 * admin 及以上权限可调用。
 * 单次最多导出 10000 行。
 */
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim();
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();

  if (!type || !["users", "callLogs", "orders"].includes(type)) {
    return NextResponse.json(
      { message: "type 参数不合法，允许值：users | callLogs | orders" },
      { status: 400 },
    );
  }

  // 解析日期范围（startDate 00:00:00 至 endDate 23:59:59）
  const dateFilter: Record<string, unknown> = {};
  if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    const start = new Date(`${startDate}T00:00:00+08:00`);
    if (!isNaN(start.getTime())) dateFilter.gte = start;
  }
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const end = new Date(`${endDate}T23:59:59+08:00`);
    if (!isNaN(end.getTime())) dateFilter.lte = end;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (type === "users") {
    const users = await prisma.user.findMany({
      where: Object.keys(dateFilter).length
        ? { createdAt: dateFilter }
        : undefined,
      select: {
        id: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isSubscribed: true,
        subscriptionPlan: true,
        credits: true,
        totalUsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT_ROWS,
    });

    const csv = toCSV(
      users.map((u) => ({
        id: u.id,
        nickname: u.nickname ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        role: u.role,
        status: u.status,
        isSubscribed: u.isSubscribed ? "是" : "否",
        subscriptionPlan: u.subscriptionPlan ?? "",
        credits: u.credits,
        totalUsed: u.totalUsed,
        createdAt: formatCsvDate(u.createdAt),
        updatedAt: formatCsvDate(u.updatedAt),
      })),
      [
        { key: "id", header: "用户ID" },
        { key: "nickname", header: "昵称" },
        { key: "email", header: "邮箱" },
        { key: "phone", header: "手机号" },
        { key: "role", header: "角色" },
        { key: "status", header: "状态" },
        { key: "isSubscribed", header: "已订阅" },
        { key: "subscriptionPlan", header: "订阅套餐" },
        { key: "credits", header: "剩余点数" },
        { key: "totalUsed", header: "累计使用点数" },
        { key: "createdAt", header: "创建时间" },
        { key: "updatedAt", header: "更新时间" },
      ],
    );
    return csvResponse(csv, `users-${today}.csv`);
  }

  if (type === "callLogs") {
    const logs = await prisma.callLog.findMany({
      where: Object.keys(dateFilter).length
        ? { createdAt: dateFilter }
        : undefined,
      select: {
        id: true,
        apiKeyId: true,
        userId: true,
        workflowId: true,
        endpoint: true,
        method: true,
        creditsCost: true,
        status: true,
        errorMessage: true,
        responseTime: true,
        clientIp: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT_ROWS,
    });

    const csv = toCSV(
      logs.map((l) => ({
        id: l.id,
        apiKeyId: l.apiKeyId,
        userId: l.userId,
        workflowId: l.workflowId ?? "",
        endpoint: l.endpoint,
        method: l.method,
        creditsCost: l.creditsCost,
        status: l.status,
        errorMessage: l.errorMessage ?? "",
        responseTime: l.responseTime ?? "",
        clientIp: l.clientIp ?? "",
        createdAt: formatCsvDate(l.createdAt),
      })),
      [
        { key: "id", header: "日志ID" },
        { key: "createdAt", header: "调用时间" },
        { key: "userId", header: "用户ID" },
        { key: "apiKeyId", header: "API Key ID" },
        { key: "endpoint", header: "接口" },
        { key: "method", header: "方法" },
        { key: "status", header: "状态" },
        { key: "creditsCost", header: "扣点" },
        { key: "responseTime", header: "响应时间(ms)" },
        { key: "workflowId", header: "任务ID" },
        { key: "errorMessage", header: "错误信息" },
        { key: "clientIp", header: "客户端IP" },
      ],
    );
    return csvResponse(csv, `call-logs-${today}.csv`);
  }

  // orders
  const orders = await prisma.order.findMany({
    where: Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : undefined,
    select: {
      id: true,
      orderNo: true,
      userId: true,
      type: true,
      planId: true,
      credits: true,
      amount: true,
      status: true,
      paymentMethod: true,
      paymentId: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  const csv = toCSV(
    orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      userId: o.userId,
      type: o.type,
      planId: o.planId ?? "",
      credits: o.credits,
      amount: o.amount.toString(),
      status: o.status,
      paymentMethod: o.paymentMethod ?? "",
      paymentId: o.paymentId ?? "",
      paidAt: formatCsvDate(o.paidAt),
      createdAt: formatCsvDate(o.createdAt),
    })),
    [
      { key: "id", header: "订单ID" },
      { key: "orderNo", header: "订单号" },
      { key: "createdAt", header: "下单时间" },
      { key: "paidAt", header: "支付时间" },
      { key: "userId", header: "用户ID" },
      { key: "type", header: "订单类型" },
      { key: "planId", header: "套餐ID" },
      { key: "credits", header: "点数" },
      { key: "amount", header: "金额(元)" },
      { key: "status", header: "状态" },
      { key: "paymentMethod", header: "支付方式" },
      { key: "paymentId", header: "支付流水号" },
    ],
  );
  return csvResponse(csv, `orders-${today}.csv`);
});
