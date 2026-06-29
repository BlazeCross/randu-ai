import crypto from "node:crypto";
import { Readable } from "node:stream";
import OSS from "ali-oss";

/**
 * 阿里云 OSS 客户端（仅在服务端使用）
 *
 * 通过环境变量配置：
 * - OSS_ACCESS_KEY_ID     访问密钥 ID（服务端中转上传使用）
 * - OSS_ACCESS_KEY_SECRET 访问密钥 Secret（服务端中转上传使用）
 * - OSS_BUCKET            Bucket 名称
 * - OSS_REGION            地域，如 oss-cn-hangzhou
 * - OSS_CDN_DOMAIN        CDN 域名，如 https://cdn.example.com
 *
 * STS 直传相关环境变量（可选，未配置时回退到服务端中转）：
 * - ALIYUN_STS_ACCESS_KEY_ID     阿里云 RAM 子账号 AccessKey ID
 * - ALIYUN_STS_ACCESS_KEY_SECRET 阿里云 RAM 子账号 AccessKey Secret
 * - ALIYUN_STS_ROLE_ARN          RAM 角色的 ARN（acs:ram::<uid>:role/<roleName>）
 *
 * 注意：本模块只能在服务端（API Route / Server Component）中导入，
 *       严禁在客户端组件中引用，否则会泄露密钥。
 */

/*
 * OSS CORS 配置（需在阿里云控制台手动配置）：
 * 前端直传（STS 模式）需要 Bucket 配置 CORS 规则，否则浏览器会拦截跨域请求。
 *
 * AllowedOrigin:
 *   - https://randuai.cn
 *   - http://localhost:3000
 * AllowedMethod: GET, PUT, POST, HEAD
 * AllowedHeader: *
 * ExposeHeader: ETag, x-oss-request-id
 *
 * 配置路径：阿里云 OSS 控制台 → Bucket → 权限管理 → 跨域设置 → 创建规则
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
 * 生成随机字符串，用于文件名去重（使用 crypto 安全随机源）
 * @param length 字符串长度，默认 8
 */
function randomString(length = 8): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
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
 * 以流式方式上传文件到阿里云 OSS
 *
 * 流式上传不会将整个文件加载到内存，
 * 适合大文件上传，可显著降低服务端内存占用。
 *
 * @param stream        Web ReadableStream（来自 File.stream()）
 * @param fileName      原始文件名（用于提取扩展名）
 * @param contentType   文件 MIME 类型
 * @param contentLength 文件大小（字节），用于 OSS SDK 设置 Content-Length
 * @returns 上传成功后的 CDN URL
 */
export async function uploadStreamToOss(
  stream: ReadableStream,
  fileName: string,
  contentType: string,
  contentLength: number,
): Promise<string> {
  const client = getOssClient();
  const objectKey = generateUniqueFileName(fileName);

  // 将 Web ReadableStream 转换为 Node.js Readable
  // 注：DOM lib 的 ReadableStream 类型与 node:stream/web 的类型定义存在差异，
  // 但在 Node.js 运行时中二者是同一实现，此处进行类型转换以兼容 tsconfig 的 dom lib
  const nodeStream = Readable.fromWeb(
    stream as unknown as import("node:stream/web").ReadableStream,
  );

  // 使用 putStream 流式上传，避免将整个文件读入内存
  const result = await client.putStream(objectKey, nodeStream, {
    contentLength,
    mime: contentType,
    // 上传超时 60 秒
    timeout: 60000,
  } as Parameters<typeof client.putStream>[2]);

  if (!result?.name) {
    throw new Error("OSS 流式上传失败：未返回对象名称");
  }

  return buildCdnUrl(result.name);
}

// ============ STS 临时凭证（前端直传） ============

// STS 凭证返回结构（与前端 ali-oss SDK 初始化参数对齐）
export interface STSCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  // ISO 8601 UTC 过期时间字符串
  expiration: string;
  bucket: string;
  region: string;
  // CDN 域名（可选，配置了 OSS_CDN_DOMAIN 时返回）
  // 前端直传后用此域名拼接最终 URL，与服务端中转模式返回的 URL 保持一致
  cdnDomain?: string;
}

/**
 * 获取 OSS STS 临时上传凭证
 *
 * 用于前端直传 OSS：客户端调用 /api/oss/sts 获取临时凭证，
 * 然后用 ali-oss SDK 在浏览器中直接上传文件到 OSS，
 * 无需经过服务端中转，可显著降低服务端带宽/内存压力。
 *
 * 安全模型：
 * - STS 凭证由阿里云 RAM 子账号签发，权限受 RoleArn + 策略限制
 * - 凭证有效期 1 小时，过期后前端需重新获取
 * - 推荐为该 RAM 角色配置仅允许 `oss:PutObject` 到指定前缀的策略
 *
 * 向后兼容：
 * - 若 ALIYUN_STS_* 环境变量未配置，则返回 null
 * - 调用方（API 路由 / 前端组件）应根据 null 自动回退到服务端中转模式
 *
 * 环境变量：
 * - ALIYUN_STS_ACCESS_KEY_ID     RAM 子账号 AK
 * - ALIYUN_STS_ACCESS_KEY_SECRET RAM 子账号 SK
 * - ALIYUN_STS_ROLE_ARN          RAM 角色 ARN
 *
 * @returns STS 凭证对象；未配置时返回 null（调用方应回退到服务端中转）
 */
export async function getSTSCredentials(): Promise<STSCredentials | null> {
  const accessKeyId = process.env.ALIYUN_STS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_STS_ACCESS_KEY_SECRET;
  const roleArn = process.env.ALIYUN_STS_ROLE_ARN;

  // STS 未配置：返回 null，由调用方回退到服务端中转模式
  if (!accessKeyId || !accessKeySecret || !roleArn) {
    return null;
  }

  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION;
  if (!bucket || !region) {
    // STS 已配置但 OSS_BUCKET/OSS_REGION 缺失：无法直传，回退
    console.warn(
      "[OSS] STS 凭证已配置但 OSS_BUCKET/OSS_REGION 缺失，回退到服务端中转",
    );
    return null;
  }

  // 使用 ali-oss 内置的 STS 类（ali-oss 包内 lib/sts.js 模块）
  // @types/ali-oss 将 STS 类声明在 OSS 命名空间下，通过 OSS.STS 访问
  const sts = new OSS.STS({
    accessKeyId,
    accessKeySecret,
  });

  // assumeRole(roleArn, policy, expirationSeconds, session)
  // - roleArn: RAM 角色 ARN（权限由该角色的授权策略控制）
  // - policy: 不传，使用角色自身的授权策略
  // - expirationSeconds: 3600（1 小时有效期）
  // - session: 'randu-ai-upload'（会话名，用于审计日志识别）
  const result = await sts.assumeRole(
    roleArn,
    undefined,
    3600,
    "randu-ai-upload",
  );

  if (!result?.credentials) {
    throw new Error("STS assumeRole 返回为空");
  }

  // CDN 域名（可选）：配置了 OSS_CDN_DOMAIN 时返回，前端直传后用此拼接最终 URL
  // 去除协议和尾斜杠，统一为 host 形式（如 cdn.example.com）
  const rawCdnDomain = process.env.OSS_CDN_DOMAIN;
  const cdnDomain = rawCdnDomain
    ? rawCdnDomain.replace(/\/+$/, "").replace(/^https?:\/\//, "")
    : undefined;

  return {
    accessKeyId: result.credentials.AccessKeyId,
    accessKeySecret: result.credentials.AccessKeySecret,
    securityToken: result.credentials.SecurityToken,
    expiration: result.credentials.Expiration,
    bucket,
    region,
    cdnDomain,
  };
}
