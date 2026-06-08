# AI客来：街角咖啡屋 (AIcafe)

> 一款 AI 驱动的对话式咖啡店模拟经营游戏

你是一家街角咖啡屋的店长。每天进货、定价、迎接各色顾客——但这里的顾客不是固定选项，而是由 **大语言模型实时驱动** 的真实角色。你的每一句话、每一个定价决策，都会影响他们的购买欲望和店铺的命运。

## 核心玩法

```
进货 / 定价
  → 开门营业
    → AI 顾客进店
      → 自由文本对话（AI 动态回应）
        → 购买欲望变化
          → 购买 或 离店
            → 日终结算
              → 下一天继续经营
```

- **自由对话**：不限固定选项，输入任何话术与 AI 顾客交流
- **6 类性格顾客**：社恐内向型、挑剔达人型、文艺青年型、社牛自来熟型、赶时间上班族、纠结选择困难型——每类有独立的说话风格和决策逻辑
- **经营策略**：10 种商品、动态定价、库存管理、技能升级、成就系统
- **长期成长**：从一星社区小店到五星网红咖啡屋

## 技术栈

| 层 | 技术 |
|---|---|
| 游戏引擎 | [Cocos Creator 3.8.8](https://www.cocos.com/creator-download) (TypeScript) |
| AI 后端 | Node.js HTTP Server + 火山引擎 Ark API (Doubao 模型) |
| 部署 | Docker + Railway/Fly.io |
| 测试 | Jest (服务端 + 核心逻辑) |

## 项目结构

```
AIcafe/
├── assets/
│   ├── scenes/          # 游戏场景 (Title, Main, Settings)
│   ├── scripts/
│   │   ├── core/        # GameManager, DayManager, EventBus, SaveManager, AudioManager
│   │   ├── data/        # ProductData, CustomerData, SkillData, AchievementData
│   │   ├── ai/          # AIManager (客户端 AI 编排), PromptBuilder
│   │   └── ui/          # ChatUI, ShopPrepUI, ResultUI, MainUI, 等
│   ├── prefabs/         # ChatBubble, ProductItem 预制体
│   └── art/             # 美术素材 (背景, 顾客头像, 商品图标, UI)
├── server/
│   ├── server.js        # AI 后端主服务 (Express)
│   ├── lib/prompts/     # 模块化 Prompt 工程 (按顾客性格分文件)
│   └── tests/           # 服务端 API 测试
├── tests/               # 核心逻辑单元测试
├── docs/                # 设计文档、测试计划
└── scripts/             # 构建与部署脚本
```

## 快速开始

### 前置要求

- [Cocos Creator 3.8.x](https://www.cocos.com/creator-download)
- [Node.js 18+](https://nodejs.org/)
- 火山引擎 Ark API Key (用于 AI 对话)

### 1. 打开游戏项目

1. 启动 Cocos Creator 3.8.x
2. 打开项目目录 `AIcafe/`
3. 等待资源导入完成
4. 打开 `assets/scenes/Title.scene` 或 `Main.scene`

### 2. 启动 AI 后端

```bash
cd server
cp .env.example .env
# 编辑 .env，填入你的 ARK_API_KEY
npm install
node server.js
```

验证后端可用：访问 `http://localhost:3000/health`

### 3. 运行游戏

在 Cocos Creator 中点击预览按钮，即可在浏览器中运行。

## AI 系统说明

游戏采用 **纯真实 AI 驱动** 的对话系统。所有顾客回复由大语言模型实时生成：

- **客户端** (`AIManager`)：负责请求编排、重试/退避、会话历史管理、响应校验
- **服务端** (`server/`)：负责 Prompt 组装（按顾客性格模块化）、API 调用、内容安全过滤、响应格式校验

当 API 不可用时，系统自动回退到本地兜底模板，保证游戏可继续。

## 开发指南

### 分支策略

```
main       — 生产就绪
develop    — 集成分支
feature/*  — 功能开发
```

### 提交规范

- `feat: 新功能描述`
- `fix: 修复描述`
- `refactor: 重构描述`
- `docs: 文档更新`
- `test: 测试相关`

### 代码检查

```bash
# TypeScript 类型检查
npx tsc -p tsconfig.json --noEmit --skipLibCheck

# 服务端测试
cd server && npm test
```

## 路线图

- [x] Phase 0: 项目基建与安全修复
- [ ] Phase 1: AI 系统重构 (Express 迁移, Prompt 模块化, 安全过滤)
- [ ] Phase 2: 产品完整体验 (标题画面, 存档, 音效, 引导, 动画)
- [ ] Phase 3: 内容扩展 (10 顾客, 10 商品, 事件系统, 成就完善)
- [ ] Phase 4: Web 部署 (Docker, CI/CD, 域名, HTTPS)
- [ ] Phase 5: 打磨优化 (特效, 音频, 性能)
- [ ] Phase 6: 测试与 QA

## License

MIT
