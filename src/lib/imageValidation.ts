/**
 * 图片内容安全审核工具（Phase 4.3）
 *
 * 设计：
 * - 验证文件 magic bytes（防止伪装扩展名）
 * - 解析图片头获取尺寸（拒绝超大尺寸）
 * - 不依赖第三方库，纯字节解析
 *
 * 限制：
 * - 不做 NSFW 内容审核（需调用外部 API，成本高）
 *   生产环境可通过 OSS 内容审核 / 火山方舟审核 API 补齐
 * - 仅校验文件头，不解析完整图片
 */

// 图片格式与 magic bytes 对照
const MAGIC_BYTES: Array<{
  mime: string;
  offset: number;
  bytes: number[];
}> = [
  // JPEG: FF D8 FF
  { mime: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mime: "image/png",
    offset: 0,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  // GIF: 47 49 46 38 (GIF8)
  { mime: "image/gif", offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: RIFF....WEBP（先匹配 RIFF）
  { mime: "image/webp", offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
];

// 图片尺寸上限（宽或高任一超过此值则拒绝）
const MAX_DIMENSION = 8000;
// 图片尺寸下限（宽或高任一低于此值则拒绝，防止上传过小图标当头像误用）
const MIN_DIMENSION = 16;

export interface ImageValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 失败原因 */
  reason?: string;
  /** 检测到的实际 MIME 类型（基于 magic bytes） */
  detectedMime?: string;
  /** 图片宽度（像素，若能解析） */
  width?: number;
  /** 图片高度（像素，若能解析） */
  height?: number;
}

/**
 * 校验上传图片的内容安全性
 *
 * @param bytes    图片前 4KB 字节（足够判断格式和尺寸）
 * @param claimedMime 客户端声称的 MIME 类型
 */
export function validateImageBytes(
  bytes: Uint8Array,
  claimedMime: string,
): ImageValidationResult {
  // 1. magic bytes 校验：找出实际格式
  let detectedMime: string | undefined;
  for (const candidate of MAGIC_BYTES) {
    if (bytes.length < candidate.offset + candidate.bytes.length) continue;
    const slice = bytes.subarray(
      candidate.offset,
      candidate.offset + candidate.bytes.length,
    );
    if (candidate.bytes.every((b, i) => slice[i] === b)) {
      detectedMime = candidate.mime;
      break;
    }
  }

  if (!detectedMime) {
    return {
      valid: false,
      reason: "无法识别的图片格式（magic bytes 不匹配 JPEG/PNG/GIF/WebP）",
    };
  }

  // 2. 客户端声称的 MIME 必须与实际格式一致
  // 注意：WebP 在 JPEG magic bytes 之后才出现 WEBP 标识，所以需要特殊处理
  // JPEG 的 magic FF D8 FF 不会与 WebP 的 RIFF 冲突
  if (claimedMime !== detectedMime) {
    // 容忍声称 image/jpeg 实际 image/jpeg 之外的少量差异（如图标被声称 PNG）
    return {
      valid: false,
      reason: `文件内容与声称的类型不符：声称 ${claimedMime}，实际 ${detectedMime}`,
      detectedMime,
    };
  }

  // 3. WebP 需要额外校验：偏移 8-12 字节应为 "WEBP"
  if (detectedMime === "image/webp") {
    if (bytes.length < 12) {
      return { valid: false, reason: "WebP 文件头不完整", detectedMime };
    }
    const webpTag = String.fromCharCode(
      bytes[8],
      bytes[9],
      bytes[10],
      bytes[11],
    );
    if (webpTag !== "WEBP") {
      return {
        valid: false,
        reason: "WebP 文件头缺少 WEBP 标识（可能是 RIFF 但非 WebP）",
        detectedMime,
      };
    }
  }

  // 4. 解析图片尺寸
  const dims = parseImageDimensions(bytes, detectedMime);
  if (dims) {
    if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
      return {
        valid: false,
        reason: `图片尺寸过大：${dims.width}x${dims.height}，最大支持 ${MAX_DIMENSION}x${MAX_DIMENSION}`,
        detectedMime,
        width: dims.width,
        height: dims.height,
      };
    }
    if (dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
      return {
        valid: false,
        reason: `图片尺寸过小：${dims.width}x${dims.height}，最小要求 ${MIN_DIMENSION}x${MIN_DIMENSION}`,
        detectedMime,
        width: dims.width,
        height: dims.height,
      };
    }
    return {
      valid: true,
      detectedMime,
      width: dims.width,
      height: dims.height,
    };
  }

  // 尺寸无法解析（如完整文件头未包含在前 4KB），放行但不返回尺寸
  return { valid: true, detectedMime };
}

/**
 * 从图片字节中解析宽高
 *
 * 仅依赖前 4KB 的字节，部分格式可能无法解析（返回 null）
 */
function parseImageDimensions(
  bytes: Uint8Array,
  mime: string,
): { width: number; height: number } | null {
  try {
    switch (mime) {
      case "image/png":
        // PNG: 宽度在偏移 16-19，高度在 20-23（大端序）
        if (bytes.length < 24) return null;
        return {
          width: readUint32BE(bytes, 16),
          height: readUint32BE(bytes, 20),
        };

      case "image/gif":
        // GIF: 宽度在偏移 6-7，高度在 8-9（小端序）
        if (bytes.length < 10) return null;
        return {
          width: readUint16LE(bytes, 6),
          height: readUint16LE(bytes, 8),
        };

      case "image/jpeg":
        // JPEG 尺寸解析较复杂，需要扫描 SOF 标记
        return parseJpegDimensions(bytes);

      case "image/webp":
        // WebP VP8X: 偏移 24-26 宽度-1，27-29 高度-1（小端序 24 位）
        // WebP VP8: 偏移 26-27 宽度，28-29 高度（小端序 16 位）
        // WebP VP8L: 偏移 21-24 包含 14 位宽度-1 + 14 位高度-1
        if (bytes.length < 30) return null;
        const fourCc = String.fromCharCode(
          bytes[12],
          bytes[13],
          bytes[14],
          bytes[15],
        );
        if (fourCc === "VP8X") {
          return {
            width: (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1,
            height: (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1,
          };
        }
        if (fourCc === "VP8 " && bytes.length >= 30) {
          return {
            width: readUint16LE(bytes, 26),
            height: readUint16LE(bytes, 28),
          };
        }
        // VP8L 暂不解析（占比少）
        return null;

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * 解析 JPEG 尺寸
 * 扫描 SOF0 (FF C0) / SOF2 (FF C2) 等标记
 */
function parseJpegDimensions(bytes: Uint8Array): {
  width: number;
  height: number;
} | null {
  let i = 2; // 跳过 SOI (FF D8)
  while (i + 8 < bytes.length) {
    // 寻找标记：FF xx
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1];

    // SOF 标记（不含 SOF4/progressive 等少数变体）
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      // SOF 段：长度(2) + 精度(1) + 高度(2) + 宽度(2)
      // 高度在偏移 i+5..6，宽度在 i+7..8（大端序）
      if (i + 9 > bytes.length) return null;
      return {
        height: readUint16BE(bytes, i + 5),
        width: readUint16BE(bytes, i + 7),
      };
    }

    // 跳过当前段（长度在 i+2..3，大端序）
    if (i + 4 > bytes.length) return null;
    const segLen = readUint16BE(bytes, i + 2);
    i += 2 + segLen;
  }
  return null;
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}
