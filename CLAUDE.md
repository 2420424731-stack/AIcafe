# CLAUDE.md — AIcafe 项目 AI 辅助开发指南

## 项目概述

《AI客来：街角咖啡屋》— 基于 Cocos Creator 3.8.8 + TypeScript 的对话式模拟经营游戏。纯真实 AI 驱动顾客对话，目标平台 Web (H5)。

## 代码规范

### TypeScript
- 严格模式 (`tsconfig.json` `strict: true`)
- 优先使用 `interface` 而非 `type`
- 导出使用命名导出 (`export class` / `export function`)
- 避免 `any`，使用 `unknown` 或具体类型
- 事件处理使用 `EventBus` 而非直接调用

### Cocos Creator 约定
- 组件通过 `@ccclass` 装饰器注册
- 节点引用优先用 `@property(Node)` 在编辑器绑定，其次代码按名称查找
- UI 面板按游戏阶段 (`Prep` / `Business` / `Result` / `GameOver`) 显隐
- Prefab 实例化后必须设置父节点

### 服务端 (Node.js)
- ESM 模块 (`"type": "module"`)
- Express 中间件模式
- 所有 AI 调用必须有超时和错误处理
- 环境变量通过 `.env` 配置，`.env.example` 作为模板

## 架构关键决策

### AI 系统架构 (最重要)
```
客户端 AIManager (编排层)
  → 请求服务端 /api/chat
    → 服务端组装 Prompt (按性格模块化)
      → 调用火山引擎 Ark API (Doubao)
        → 解析 + 校验 + 安全过滤
          → 返回标准化 JSON
            → 客户端渲染对话
```

**欲望值/经营判定全部由 LLM 负责**，客户端不做本地规则计算。
本地模板仅作为 API 彻底失败时的**紧急兜底**。

### 数据流
- `GameManager` 是唯一的游戏状态源 (singleton)
- UI 组件通过 `EventBus` 监听状态变化，不直接修改 GameManager
- 服务端无状态，每次请求独立

### 场景流
```
Title.scene → Main.scene → (Settings.scene)
                            → (GameOver — 同场景内面板)
```

## 常用命令

```bash
# TypeScript 类型检查
npx tsc -p tsconfig.json --noEmit --skipLibCheck

# 启动 AI 后端
cd server && node server.js

# 测试 AI API 连通性
cd server && node check-api.js

# Prompt 质量测试
cd server && node test-prompts.js
```

## 关键文件职责

| 文件 | 角色 |
|------|------|
| `assets/scripts/core/GameManager.ts` | 游戏状态中心：资金、声望、库存、日结算、技能、成就 |
| `assets/scripts/core/DayManager.ts` | 每日顾客队列、顾客切换、声望累计 |
| `assets/scripts/core/EventBus.ts` | 模块间事件通信 |
| `assets/scripts/ai/AIManager.ts` | 客户端 AI 编排：请求、重试、会话历史、响应解析 |
| `assets/scripts/ui/ChatUI.ts` | 对话界面：输入、气泡渲染、滚动、顾客切换 |
| `assets/scripts/ui/ShopPrepUI.ts` | 进货/定价界面 |
| `assets/scripts/ui/ResultUI.ts` | 日终结算界面 |
| `server/server.js` | AI 后端主服务：路由、中间件、API 调用 |
| `server/lib/prompts/` | 模块化 Prompt 工程（按顾客性格分文件） |

## 测试策略

- 核心逻辑 (`GameManager`, 数据类) → Jest 单元测试 (`tests/`)
- 服务端 API → Jest + supertest (`server/tests/`)
- AI 回复质量 → `server/test-prompts.js` (手动运行，验证格式和内容)
- 游戏流程 → Cocos Creator 预览手动测试

## 注意事项

- Cocos Creator 的 `sys.localStorage` 用于存档持久化
- `.meta` 文件由 Cocos 自动管理，不应手动修改
- 服务端 `.env` 永不提交（已在 `.gitignore`）
- 新顾客/商品添加后需同步更新 `ArtAssetBinder.ts` UUID 映射和服务端 prompt 模块
