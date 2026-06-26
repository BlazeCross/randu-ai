/**
 * OpenAPI 3.0 规范定义（静态）
 *
 * 描述对外暴露的 API 接口，供：
 * - /api/docs/openapi.json 端点返回原始规范
 * - /api-docs 页面渲染时引用
 *
 * 仅包含对外（第三方开发者）使用的接口，不含管理后台接口。
 */

export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "燃渡AI 开放 API",
    version: "1.0.0",
    description:
      "燃渡AI 工作流服务平台对外开放的 API，提供 AI 视频生成、文生图、文案生成等能力。所有接口均使用 X-API-Key 鉴权。",
    contact: {
      name: "燃渡AI",
      url: "https://randu.ai",
    },
  },
  servers: [
    {
      url: "https://randu.ai",
      description: "生产环境",
    },
  ],
  tags: [
    { name: "Auth", description: "API Key 鉴权与有效性校验" },
    { name: "Video", description: "Seedance 视频生成（异步）" },
    { name: "Image", description: "Seedream 文生图" },
    { name: "Text", description: "豆包文案生成" },
    { name: "Usage", description: "用量与余额查询" },
    { name: "Webhook", description: "任务回调（平台主动调用）" },
  ],
  paths: {
    "/api/external/key/verify": {
      get: {
        tags: ["Auth"],
        summary: "验证 API Key 有效性",
        description: "校验 X-API-Key 是否有效，并返回余额信息。建议在 Coze 插件启动时调用一次。",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Key 有效",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean", example: true },
                    keyName: { type: "string", example: "my-key" },
                    credits: { type: "integer", example: 970 },
                    keyStats: {
                      type: "object",
                      properties: {
                        creditsUsed: { type: "integer", example: 30 },
                        totalCalls: { type: "integer", example: 12 },
                        expiresAt: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Key 无效或已吊销" },
        },
      },
    },
    "/api/external/user/usage": {
      get: {
        tags: ["Usage"],
        summary: "查询当前用户用量",
        description: "返回用户总余额、累计用量，以及当前 Key 的累计点数与调用次数。",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": {
            description: "用量信息",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    credits: { type: "integer", example: 970 },
                    totalUsed: { type: "integer", example: 30 },
                    keyCreditsUsed: { type: "integer", example: 30 },
                    keyTotalCalls: { type: "integer", example: 12 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/external/generate/copy": {
      post: {
        tags: ["Text"],
        summary: "AI 文案生成（豆包）",
        description: "调用火山方舟豆包模型生成文案。单次扣 1 点。",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: {
                    type: "string",
                    maxLength: 2000,
                    description: "文案需求描述",
                  },
                  style: {
                    type: "string",
                    description: "写作风格（可选）",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "文案生成成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    tokensUsed: { type: "integer" },
                    creditsCost: { type: "integer", example: 1 },
                    balance: { type: "integer" },
                  },
                },
              },
            },
          },
          "402": { description: "点数不足" },
        },
      },
    },
    "/api/external/generate/image": {
      post: {
        tags: ["Image"],
        summary: "AI 文生图（Seedream）",
        description: "调用火山方舟 Seedream 模型生成图片。每张扣 5 点。",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: {
                    type: "string",
                    maxLength: 1000,
                    description: "图片描述",
                  },
                  size: {
                    type: "string",
                    enum: ["1024x1024", "768x1024", "1024x768"],
                    default: "1024x1024",
                  },
                  n: {
                    type: "integer",
                    minimum: 1,
                    maximum: 4,
                    default: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "图片生成成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    urls: {
                      type: "array",
                      items: { type: "string" },
                    },
                    creditsCost: { type: "integer", example: 5 },
                    balance: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/external/generate/video": {
      post: {
        tags: ["Video"],
        summary: "提交 Seedance 视频生成任务（异步）",
        description:
          "提交视频生成任务并立即返回 taskId。任务成功时扣 30 点，失败不扣点。可通过轮询 status 接口或在 Key 上配置 Webhook 获取结果。",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    maxLength: 1000,
                    description: "视频描述（文生视频必填，图生视频可选）",
                  },
                  firstFrameUrl: {
                    type: "string",
                    description: "首帧图片 URL（图生视频）",
                  },
                  lastFrameUrl: {
                    type: "string",
                    description: "尾帧图片 URL（需同时提供 firstFrameUrl）",
                  },
                  resolution: {
                    type: "string",
                    enum: ["480p", "720p", "1080p", "4k"],
                    default: "720p",
                  },
                  ratio: {
                    type: "string",
                    enum: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
                  },
                  duration: {
                    type: "integer",
                    minimum: 1,
                    maximum: 15,
                    description: "视频时长（秒）",
                  },
                  seed: {
                    type: "integer",
                    minimum: 0,
                    description: "随机种子（可复现）",
                  },
                  cameraFixed: {
                    type: "boolean",
                    description: "是否固定镜头",
                  },
                  watermark: {
                    type: "boolean",
                    description: "是否生成水印",
                  },
                  generateAudio: {
                    type: "boolean",
                    description: "是否生成同步音频",
                  },
                  returnLastFrame: {
                    type: "boolean",
                    description: "是否返回尾帧图片（用于连续生成）",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "任务已提交",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    taskId: { type: "string", example: "cgt-xxx" },
                    status: { type: "string", example: "pending" },
                    creditsCost: { type: "integer", example: 30 },
                    pollUrl: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "402": { description: "点数不足" },
          "502": { description: "上游任务提交失败" },
        },
      },
    },
    "/api/external/generate/video/status": {
      get: {
        tags: ["Video"],
        summary: "查询视频任务状态",
        description:
          "轮询查询任务状态。任务成功时幂等扣点（多次查询不会重复扣点）。",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "提交接口返回的 taskId",
          },
        ],
        responses: {
          "200": {
            description: "任务状态",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    taskId: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["pending", "running", "completed", "failed"],
                    },
                    videoUrl: {
                      type: "string",
                      nullable: true,
                      description: "生成视频 URL（仅 completed）",
                    },
                    lastFrameUrl: { type: "string", nullable: true },
                    errorMessage: { type: "string", nullable: true },
                    creditsCost: { type: "integer" },
                    balance: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/external/webhook/volcengine": {
      post: {
        tags: ["Webhook"],
        summary: "火山方舟任务状态回调（平台接收）",
        description:
          "由火山方舟在任务状态变化时调用，本平台接收后会更新本地任务状态并转发给用户配置的 Webhook URL。用户无需直接调用此接口。",
        responses: {
          "200": {
            description: "已接收（无论是否处理成功均返回 200 避免重试）",
          },
        },
      },
      get: {
        tags: ["Webhook"],
        summary: "Webhook 端点探活",
        description: "用于火山方舟配置回调时验证端点可达性。",
        responses: {
          "200": {
            description: "探活成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    service: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "在 dashboard 创建 API Key 后获得的明文 Key",
      },
    },
  },
} as const;

export type OpenApiSpec = typeof OPENAPI_SPEC;
