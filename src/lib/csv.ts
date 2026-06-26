/**
 * CSV 导出工具
 *
 * 将对象数组转为符合 RFC 4180 的 CSV 字符串：
 * - 字段以逗号分隔
 * - 含逗号、双引号或换行的字段用双引号包裹
 * - 字段内的双引号转义为两个双引号
 * - 行以 \r\n 分隔
 * - 首行输出表头
 */

/**
 * 转义 CSV 字段
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  // 含 ", \n, \r 时需要包裹
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 将对象数组转为 CSV 字符串
 *
 * @param rows 对象数组
 * @param columns 列定义（顺序即输出顺序），未指定时取首行的所有 key
 *
 * @example
 * const csv = toCSV(
 *   [{ name: "Alice", age: 30 }],
 *   [{ key: "name", header: "姓名" }, { key: "age", header: "年龄" }],
 * );
 */
export function toCSV<
  T extends Record<string, unknown>,
  K extends keyof T & string,
>(
  rows: T[],
  columns?: Array<{ key: K; header: string }>,
): string {
  if (rows.length === 0 && !columns) {
    return "";
  }

  // 未指定列时，取首行所有 key 作为列
  const cols =
    columns ??
    (Object.keys(rows[0]) as K[]).map((key) => ({ key, header: key as string }));

  const headerLine = cols.map((c) => escapeField(c.header)).join(",");
  const lines = rows.map((row) =>
    cols
      .map((c) => escapeField(row[c.key]))
      .join(","),
  );

  return [headerLine, ...lines].join("\r\n") + "\r\n";
}

/**
 * 日期格式化为人类可读形式（YYYY-MM-DD HH:mm:ss）
 */
export function formatCsvDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  // 转为本地时区 YYYY-MM-DD HH:mm:ss
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * 构造 CSV 下载响应（带 BOM 头，确保 Excel 正确识别 UTF-8 中文）
 *
 * @param csv CSV 字符串
 * @param filename 建议的文件名
 */
export function csvResponse(csv: string, filename: string): Response {
  // 加 UTF-8 BOM 头，Excel 打开 CSV 时才能正确显示中文
  const BOM = "\uFEFF";
  const body = BOM + csv;
  const encodedFilename = encodeURIComponent(filename);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
