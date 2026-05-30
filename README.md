# AI客来：街角咖啡屋 (AIcafe)

一款面向 AI 主题比赛的**对话式模拟经营游戏**，基于 [Cocos Creator](https://www.cocos.com/) 3.8.8 构建。玩家扮演街角咖啡屋店长，通过进货、定价和**自由文本对话**接待 6 类性格各异的 AI 顾客，影响购买欲望，完成每日经营结算。

## 核心玩法

```text
进货 / 定价
  → 开始营业
    → AI 顾客进店
      → 玩家自由文本对话（AI 动态回应）
        → 购买欲望变化
          → 顾客购买 或 离店（扣库存 / 不购买）
            → 日终结算
              → 下一天继续经营
```

- **自由对话**：不限于固定选项，输入任何话术，AI 顾客根据性格实时回应
- **6 类顾客性格**：社恐内向型、挑剔达人型、文艺青年型、社牛自来熟型、赶时间上班族、纠结选择困难型
- **经营策略**：进货选品、定价策略、库存管理、利润目标
- **成长系统**：声望星级、技能树、成就解锁、商品扩展

## 技术架构

| 层 | 技术 |
|---|------|
| 游戏引擎 | Cocos Creator 3.8.8 (TypeScript) |
| AI 后端 | Node.js HTTP Server（豆包/Ark API） |
| AI 兜底 | 本地规则引擎（离线可用） |
| 架构模式 | 事件驱动 (EventBus) + Manager 模式 |

### 脚本结构

```
assets/scripts/
├── core/           # GameManager, DayManager, EventBus（核心流程）
├── data/           # ProductData, CustomerData, SkillData, AchievementData
├── ai/             # AIManager（本地规则/Prompt构建/API调用）
└── ui/             # ChatUI, ShopPrepUI, ResultUI, MainUI, GrowthUI 等
```

### AI 双层架构

- **本地规则 AI**：保证经营闭环稳定 —— 购买欲望计算、购买/离店决策、库存校验
- **真实 AI API**：对话表现增强层 —— 只负责生成符合顾客性格的自然语言回复
- 真实 AI 不可用时自动回退本地模板

## 快速开始

### 环境要求

- [Cocos Creator 3.8.x](https://www.cocos.com/creator-download)
- [Node.js 18+](https://nodejs.org/)（仅后端）
- 豆包 API Key（仅真实 AI 模式，可选）

### 游戏端

1. 用 Cocos Creator 打开项目根目录
2. 打开 `assets/scenes/Main.scene`
3. 点击运行预览

### AI 后端（可选）

```bash
cd server
cp .env.example .env
# 编辑 .env，填入 ARK_API_KEY
node server.js
```

后端启动后访问 `http://localhost:3000/health` 验证可用。

### 启用真实 AI

在 Cocos Creator 编辑器中：

- 选中 `GameRoot` 节点
- `AIManager` 组件中勾选 `Use Real AI`
- 设置 `Api Url` 为后端地址（如 `http://localhost:3000/api/chat`）

如果后端不可用，取消勾选 `Use Real AI`，游戏将使用本地规则 AI 完整运行。

## 游戏流程

| 阶段 | 界面 | 操作 |
|------|------|------|
| **Prep** | 选品/定价面板 | 进货商品，设定售价 |
| **Business** | 聊天界面 + 只读库存 | 自由文本对话，影响顾客购买欲 |
| **Result** | 日终结算面板 | 查看营收、成交率、库存、声望变化 |
| **GameOver** | 失败/总结面板 | 展示最终成绩 |

## 6 类顾客

| 类型 | 特征 | 喜好 | 耐心 |
|------|------|------|------|
| 社恐内向型 | 轻声、谨慎、句子短 | 温和礼貌、给足空间 | 3 轮 |
| 挑剔达人型 | 重视专业细节 | 专业描述、风味层次 | 4 轮 |
| 文艺青年型 | 画面感、故事性 | 氛围描述、温柔共情 | 4 轮 |
| 社牛自来熟型 | 热情外向、轻松 | 闲聊互动、朋友式沟通 | 4 轮 |
| 赶时间上班族 | 快节奏、效率导向 | 快速推荐、直接结论 | 2 轮 |
| 纠结选择困难型 | 犹豫、反复比较 | 精准推荐、缩小选择 | 4 轮 |

## 项目文档

详细设计文档见 [docs/](docs/) 目录：

- [项目进展总结](docs/project-progress-summary.md)
- [当前项目摘要](docs/current-project-summary.md)
- [UI 美术资源指南](docs/ui-art-assets-guide.md)
- [框架分析与下一步](docs/framework-analysis-and-next-steps.md)
- [开发进展与后续计划](docs/development-progress-and-next-plan.md)
- [顾客性格测试用例](docs/customer-personality-test-cases.md)

## 后续路线

- [ ] 真实 AI 对话表现增强（Prompt 精调）
- [ ] 内容安全过滤机制
- [ ] 完整技能树与成就系统
- [ ] UI 美术表现升级（背景、立绘、图标）
- [ ] 存档系统
- [ ] 更多顾客类型与事件

## 许可证

MIT
