/**
 * 内容审核模块（Phase 15.1）
 *
 * 设计：
 * - 本地内置敏感词库，同步纯函数计算，无 IO
 * - 按类别组织：政治/色情/暴力/赌博/毒品/广告违法/垃圾信息
 * - 大小写不敏感匹配（英文敏感词转小写后比对）
 * - 命中时返回脱敏后的敏感词前缀（如"代开***"）
 *
 * 应用场景：
 * - chat 接口：输入审核 + 输出审核
 * - external/generate/copy 接口：输入审核 + 输出审核
 * - external/generate/image 接口：输入审核
 *
 * 性能：
 * - 词库约 100+ 条，数组遍历 + includes 匹配
 * - 对 1000 字以内的文本耗时 < 1ms
 *
 * 升级路径：
 * - 规模化后可替换为阿里云内容安全 API（约 0.001 元/次）
 * - 词库可改为从外部文件或数据库加载
 */

// ===== 审核结果接口 =====

export interface ModerationResult {
  /** 是否通过审核 */
  passed: boolean;
  /** 命中的敏感词列表（脱敏后的前缀，如"代开***"） */
  blockedWords: string[];
  /** 违规类别（politics/porn/violence/gambling/drug/ad/spam/null） */
  category: string | null;
  /** 拒绝原因（用于返回给用户或日志记录） */
  reason: string | null;
}

// ===== 类别中文说明 =====

const CATEGORY_LABELS: Record<string, string> = {
  politics: "政治敏感",
  porn: "色情",
  violence: "暴力",
  gambling: "赌博",
  drug: "毒品",
  ad: "广告违法",
  spam: "垃圾信息",
};

// ===== 敏感词库 =====

interface SensitiveWord {
  word: string;
  category: keyof typeof CATEGORY_LABELS;
}

// 敏感词库（按类别组织）
// 注意：避免包含过于宽泛的词，防止误伤正常对话
const SENSITIVE_WORDS: SensitiveWord[] = [
  // ===== 政治（politics） =====
  { word: "反动", category: "politics" },
  { word: "颠覆", category: "politics" },
  { word: "分裂国家", category: "politics" },
  { word: "卖国", category: "politics" },
  { word: "汉奸", category: "politics" },
  { word: "恐怖袭击", category: "politics" },
  { word: "恐怖组织", category: "politics" },
  { word: "极端主义", category: "politics" },
  { word: "邪教", category: "politics" },
  { word: "法轮功", category: "politics" },
  { word: "全能神", category: "politics" },
  { word: "六四事件", category: "politics" },
  { word: "天安门事件", category: "politics" },
  { word: "西藏独立", category: "politics" },
  { word: "新疆独立", category: "politics" },
  { word: "台湾独立", category: "politics" },
  { word: "港独", category: "politics" },
  { word: "台独", category: "politics" },
  { word: "藏独", category: "politics" },
  { word: "颜色革命", category: "politics" },
  { word: "政权颠覆", category: "politics" },
  { word: "反华", category: "politics" },
  { word: "辱华", category: "politics" },

  // ===== 色情（porn） =====
  { word: "色情", category: "porn" },
  { word: "黄色视频", category: "porn" },
  { word: "黄色网站", category: "porn" },
  { word: "成人视频", category: "porn" },
  { word: "成人网站", category: "porn" },
  { word: "裸聊", category: "porn" },
  { word: "裸体", category: "porn" },
  { word: "裸照", category: "porn" },
  { word: "卖淫", category: "porn" },
  { word: "嫖娼", category: "porn" },
  { word: "嫖资", category: "porn" },
  { word: "援交", category: "porn" },
  { word: "一夜情", category: "porn" },
  { word: "包夜", category: "porn" },
  { word: "包小姐", category: "porn" },
  { word: "找小姐", category: "porn" },
  { word: "上门服务", category: "porn" },
  { word: "特殊服务", category: "porn" },
  { word: "AV女优", category: "porn" },
  { word: "成人电影", category: "porn" },
  { word: "黄色电影", category: "porn" },
  { word: "黄色图片", category: "porn" },
  { word: "淫秽", category: "porn" },
  { word: "淫荡", category: "porn" },
  { word: "性服务", category: "porn" },

  // ===== 暴力（violence） =====
  { word: "杀人", category: "violence" },
  { word: "杀人方法", category: "violence" },
  { word: "杀人技巧", category: "violence" },
  { word: "自杀方法", category: "violence" },
  { word: "自杀指南", category: "violence" },
  { word: "上吊", category: "violence" },
  { word: "割腕", category: "violence" },
  { word: "跳楼自杀", category: "violence" },
  { word: "服毒自杀", category: "violence" },
  { word: "制造炸弹", category: "violence" },
  { word: "炸弹制作", category: "violence" },
  { word: "爆炸物制作", category: "violence" },
  { word: "枪支制造", category: "violence" },
  { word: "枪支买卖", category: "violence" },
  { word: "买枪", category: "violence" },
  { word: "卖枪", category: "violence" },
  { word: "弹药", category: "violence" },
  { word: "管制刀具", category: "violence" },
  { word: "砍人", category: "violence" },
  { word: "血腥暴力", category: "violence" },

  // ===== 赌博（gambling） =====
  { word: "赌博网站", category: "gambling" },
  { word: "博彩平台", category: "gambling" },
  { word: "网络赌博", category: "gambling" },
  { word: "网上赌场", category: "gambling" },
  { word: "在线赌博", category: "gambling" },
  { word: "六合彩", category: "gambling" },
  { word: "澳门赌场", category: "gambling" },
  { word: "外围赌博", category: "gambling" },
  { word: "赌球", category: "gambling" },
  { word: "赌马", category: "gambling" },
  { word: "百家乐", category: "gambling" },
  { word: "私彩", category: "gambling" },

  // ===== 毒品（drug） =====
  { word: "毒品交易", category: "drug" },
  { word: "买卖毒品", category: "drug" },
  { word: "出售毒品", category: "drug" },
  { word: "购买毒品", category: "drug" },
  { word: "海洛因", category: "drug" },
  { word: "冰毒", category: "drug" },
  { word: "摇头丸", category: "drug" },
  { word: "大麻", category: "drug" },
  { word: "可卡因", category: "drug" },
  { word: "鸦片", category: "drug" },
  { word: "吗啡", category: "drug" },
  { word: "甲基苯丙胺", category: "drug" },
  { word: "吸食毒品", category: "drug" },
  { word: "吸毒工具", category: "drug" },

  // ===== 广告违法（ad） =====
  { word: "代开发票", category: "ad" },
  { word: "代开增值税", category: "ad" },
  { word: "虚假发票", category: "ad" },
  { word: "办证", category: "ad" },
  { word: "办证件", category: "ad" },
  { word: "办学历", category: "ad" },
  { word: "办文凭", category: "ad" },
  { word: "假学历", category: "ad" },
  { word: "假文凭", category: "ad" },
  { word: "假证件", category: "ad" },
  { word: "刷单", category: "ad" },
  { word: "刷信誉", category: "ad" },
  { word: "刷好评", category: "ad" },
  { word: "刷销量", category: "ad" },
  { word: "代刷", category: "ad" },
  { word: "兼职刷单", category: "ad" },
  { word: "网络刷单", category: "ad" },
  { word: "高仿", category: "ad" },
  { word: "A货", category: "ad" },
  { word: "山寨货", category: "ad" },

  // ===== 垃圾信息（spam） =====
  { word: "加微信", category: "spam" },
  { word: "加微信号", category: "spam" },
  { word: "加我微信", category: "spam" },
  { word: "加扣扣", category: "spam" },
  { word: "加QQ", category: "spam" },
  { word: "免费领", category: "spam" },
  { word: "免费送", category: "spam" },
  { word: "零元购", category: "spam" },
  { word: "点击链接", category: "spam" },
  { word: "限时免费", category: "spam" },
  { word: "马上领取", category: "spam" },
  { word: "微信号", category: "spam" },
];

// ===== 预处理：构建小写敏感词数组用于匹配 =====

interface CompiledSensitiveWord {
  wordLower: string;
  original: SensitiveWord;
}

// 预处理：将所有敏感词转为小写，便于大小写不敏感匹配
const COMPILED_WORDS: CompiledSensitiveWord[] = SENSITIVE_WORDS.map((w) => ({
  wordLower: w.word.toLowerCase(),
  original: w,
}));

// ===== 工具函数 =====

/**
 * 脱敏处理：截取敏感词前 2 个字符 + ***
 * 长度 <= 2 的敏感词只返回首字符 + ***
 */
function maskWord(word: string): string {
  if (word.length <= 2) {
    return word[0] + "***";
  }
  return word.slice(0, 2) + "***";
}

// ===== 主审核函数 =====

/**
 * 审核文本是否包含敏感词
 *
 * 同步纯函数，无 IO，无副作用
 * 大小写不敏感匹配（英文敏感词转小写后比对）
 *
 * @param text 待审核文本
 * @returns 审核结果
 */
export function moderateText(text: string): ModerationResult {
  // 空文本/纯空白直接通过
  if (!text || !text.trim()) {
    return {
      passed: true,
      blockedWords: [],
      category: null,
      reason: null,
    };
  }

  const textLower = text.toLowerCase();
  const blockedWords: string[] = [];
  const hitCategories = new Set<string>();

  for (const compiled of COMPILED_WORDS) {
    if (textLower.includes(compiled.wordLower)) {
      blockedWords.push(maskWord(compiled.original.word));
      hitCategories.add(compiled.original.category);
    }
  }

  if (blockedWords.length === 0) {
    return {
      passed: true,
      blockedWords: [],
      category: null,
      reason: null,
    };
  }

  // 取第一个命中的类别作为主类别
  const category = Array.from(hitCategories)[0];
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const reason = `内容包含${categoryLabel}类违规信息`;

  return {
    passed: false,
    blockedWords,
    category,
    reason,
  };
}

/**
 * 批量审核多段文本
 *
 * 任一段落命中敏感词即视为未通过
 * 返回所有命中的敏感词（去重）
 *
 * @param texts 待审核文本数组
 * @returns 审核结果（合并所有命中）
 */
export function moderateTexts(texts: string[]): ModerationResult {
  if (!texts || texts.length === 0) {
    return {
      passed: true,
      blockedWords: [],
      category: null,
      reason: null,
    };
  }

  const allBlockedWords = new Set<string>();
  const hitCategories = new Set<string>();

  for (const text of texts) {
    const result = moderateText(text);
    if (!result.passed) {
      result.blockedWords.forEach((w) => allBlockedWords.add(w));
      if (result.category) hitCategories.add(result.category);
    }
  }

  if (allBlockedWords.size === 0) {
    return {
      passed: true,
      blockedWords: [],
      category: null,
      reason: null,
    };
  }

  const category = Array.from(hitCategories)[0];
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const reason = `内容包含${categoryLabel}类违规信息`;

  return {
    passed: false,
    blockedWords: Array.from(allBlockedWords),
    category,
    reason,
  };
}
