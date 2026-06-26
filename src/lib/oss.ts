import OSS from "ali-oss";

/**
 * 阿里云 OSS 客户端（仅在服务端使用）
 *
 * 通过环境变量配置：
 * - OSS_ACCESS_KEY_ID     访问密钥 ID
 * - OSS_ACCESS_KEY_SECRET 访问密钥 Secret
 * - OSS_BUCKET            Bucket 名称
 * - OSS_REGION            地域，如 oss-cn-hangzhou
 * - OSS_CDN_DOMAIN        CDN 域名，如 https://cdn.example.com
 *
 * 注意：本模块只能在服务端（API Route / Server Component）中导入，
 *       严禁在客户端组件中引用，否则会泄露密钥。
 */

let clientInstance: OSS | null = null;

/**
 * 获取 OSS 客户端单例
 * 第一次调用时根据环境变量初始化，后续复用同一实例
 */
function getOssClient(): OSS {
  if (clientInstance) {
    return clientInstance;
  }

  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION;

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    throw new Error(
      "OSS 环境变量未配置完整，请检查 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET / OSS_REGION",
    );
  }

  clientInstance = new OSS({
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    // 使用 HTTPS，更安全
    secure: true,
  });

  return clientInstance;
}

/**
 * 生成随机字符串，用于文件名去重
 * @param length 字符串长度，默认 8
 */
function randomString(length = 8): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成唯一的 OSS 文件路径
 * 规则：uploads/images/{年}/{月}/{时间戳}_{随机串}{原扩展名}
 * 示例：uploads/images/2026/06/1718123456789_aB3xY9Kp.jpg
 *
 * @param originalFileName 原始文件名，用于提取扩展名
 */
function generateUniqueFileName(originalFileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  // 月份补零
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const timestamp = now.getTime();
  const random = randomString(8);

  // 提取扩展名（保留点号），未匹配到时默认为空
  const extMatch = originalFileName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : "";

  return `uploads/images/${year}/${month}/${timestamp}_${random}${ext}`;
}

/**
 * 拼接 CDN 完整 URL
 * - 配置了 OSS_CDN_DOMAIN 时使用 CDN 域名
 * - 未配置时回退到 OSS Bucket 默认外网域名（自动拼接 https://{bucket}.{region}.aliyuncs.com/{objectKey}）
 * @param objectKey OSS 中的对象路径
 */
function buildCdnUrl(objectKey: string): string {
  const cdnDomain = process.env.OSS_CDN_DOMAIN;
  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION;

  // 优先使用 CDN 域名
  if (cdnDomain) {
    const base = cdnDomain.replace(/\/+$/, "").replace(/^https?:\/\//, "");
    return `https://${base}/${objectKey}`;
  }

  // 未配置 CDN 时回退到 OSS 默认域名
  if (bucket && region) {
    return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;
  }

  throw new Error("OSS 环境变量未配置完整：需要 OSS_CDN_DOMAIN 或 (OSS_BUCKET + OSS_REGION)");
}

/**
 * 上传文件到阿里云 OSS
 *
 * @param file        文件内容（Buffer）
 * @param fileName    原始文件名（用于提取扩展名）
 * @param contentType 文件 MIME 类型
 * @returns 上传成功后的 CDN URL
 */
export async function uploadToOss(
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const client = getOssClient();
  const objectKey = generateUniqueFileName(fileName);

  // 调用 OSS SDK 上传，headers 中指定 Content-Type
  const result = await client.put(objectKey, file, {
    headers: {
      "Content-Type": contentType,
    },
  });

  // SDK 返回的 url 是 OSS 默认域名，统一改用 CDN 域名
  if (!result?.name) {
    throw new Error("OSS 上传失败：未返回对象名称");
  }

  return buildCdnUrl(result.name);
}
