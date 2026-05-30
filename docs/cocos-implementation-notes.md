# 《AI客来：街角咖啡屋》Cocos 项目实现说明

更新时间：当前代码版本

## 1. 项目结构

项目使用 Cocos Creator 3.8.8 + TypeScript，主工程路径：

```text
E:\AIcafe\AIcafe
```

核心目录：

```text
assets/scripts/core
assets/scripts/data
assets/scripts/ai
assets/scripts/ui
assets/scenes/Main.scene
assets/prefabs/ProductItem.prefab
assets/prefabs/ChatBubble.prefab
docs
settings
package.json
tsconfig.json
```

## 2. Main.scene 当前绑定状态

`Main.scene` 已经不是空场景，当前已完成核心绑定：

- `GameRoot`
  - `GameManager`
  - `DayManager`
  - `AIManager`
- `MainUI`
  - 资金 Label
  - 天数 Label
  - 声望 Label
  - 阶段 Label
- `ShopPrepPanel`
  - `ShopPrepUI`
  - 商品列表父节点
  - `ProductItem` prefab
  - `DayManager`
- `ChatPanel`
  - `ChatUI`
  - `AIManager`
  - 输入框
  - 顾客名称 Label
  - 购买欲望 Label
  - ProgressBar
  - 聊天气泡父节点
  - `ChatBubble` prefab
- `ResultPanel`
  - `ResultUI`
  - 结算 Label

## 3. 当前已实现功能

- 开店前进货、定价、扣除资金。
- 商品条目显示成本、建议售价、当前售价、库存。
- 营业阶段仍显示库存和售价，但禁止继续进货。
- 未售库存保留到次日，不再打烊自动清零。
- 每日顾客数量按星级变化：
  - 1 星：3-5 人
  - 2 星：4-6 人
  - 3 星：5-7 人
  - 4-5 星：6-8 人
- 6 类顾客性格已配置：
  - 社恐内向型
  - 挑剔达人型
  - 文艺青年型
  - 社牛自来熟型
  - 赶时间上班族
  - 纠结选择困难型
- 顾客数据包含：
  - 喜欢关键词
  - 讨厌关键词
  - 偏好商品标签
  - 价格敏感度
  - 耐心轮数
  - 决策风格
- 商品数据包含标签，用于性格匹配购买。
- 本地规则 AI 已强化：
  - 话术匹配分
  - 商品偏好分
  - 价格接受分
  - 性格特殊规则
  - 单轮欲望变化限制
- 顾客购买时先从符合性格偏好的有库存商品中随机选择；没有匹配商品时，再从所有有库存商品中随机选择。
- 对话结束时显示最终结果：
  - `结果：购买了XX`
  - `结果：未购买`
- 结果会停留一小段时间，再切换下一位顾客。
- 输入框支持 Enter 发送。
- 聊天气泡支持鼠标滚轮和触摸拖动浏览历史。
- 聊天气泡根据文本长度自动调整高度，并隐藏超出可视区的旧内容，避免挤压输入框。
- 三个主界面按阶段显示：
  - `Prep`：显示进货界面。
  - `Business`：显示聊天界面，同时保留只读库存/售价面板。
  - `Result`：显示结算界面。
  - `GameOver`：显示结算/失败信息，禁止继续聊天和进入下一天。
- 结算界面显示：
  - 营收
  - 成本
  - 报废成本
  - 利润
  - 利润目标
  - 顾客数
  - 成交数
  - 声望变化
- 技能和成就基础接口已补齐，可由 `GrowthUI` 展示和调用。

## 4. 主要脚本职责

- `assets/scripts/core/GameManager.ts`
  - 资金、声望、星级、库存、售价、成本、成交、日终结算、技能、成就。
- `assets/scripts/core/DayManager.ts`
  - 每日顾客生成、顾客队列、顾客切换、声望变化累计。
- `assets/scripts/core/EventBus.ts`
  - 游戏状态、顾客到店、顾客离店、成交、结算、技能、成就等事件通信。
- `assets/scripts/data/ProductData.ts`
  - 商品基础数据和商品标签。
- `assets/scripts/data/CustomerData.ts`
  - 顾客性格、关键词、偏好标签、价格敏感度、耐心、决策风格。
- `assets/scripts/ai/AIManager.ts`
  - 当前离线本地规则 AI，负责回复、欲望计算、购买/离店决策、随机选购商品。
- `assets/scripts/ai/PromptBuilder.ts`
  - 后续真实大模型 API 的 Prompt 上下文生成，目前已同步新顾客字段和商品标签。
- `assets/scripts/ui/MainUI.ts`
  - 顶部状态栏和阶段显示/隐藏控制。
- `assets/scripts/ui/ShopPrepUI.ts`
  - 进货、定价、营业阶段只读库存面板。
- `assets/scripts/ui/ProductItemUI.ts`
  - 单个商品条目显示和购买按钮逻辑。
- `assets/scripts/ui/ChatUI.ts`
  - 输入、Enter 发送、对话、购买结果、聊天滚动、顾客切换。
- `assets/scripts/ui/ChatBubbleUI.ts`
  - 单条聊天气泡文本和自适应高度。
- `assets/scripts/ui/ResultUI.ts`
  - 日终结算、游戏失败显示、下一天按钮保护。

## 5. Cocos 编辑器注意事项

当前版本不需要重新创建 `Main.scene` 或 prefab。正常操作是：

1. 打开 Cocos Creator 3.8.8。
2. 打开项目 `E:\AIcafe\AIcafe`。
3. 等脚本重新导入完成。
4. 打开 `Main.scene` 直接预览。

如果检查器中出现新字段：

- `MainUI.shopPrepPanel / chatPanel / resultPanel` 可以不手动绑定，代码会按节点名自动查找。
- `ProductItemUI.stockLabel` 是可选字段；不绑定也会在成本行显示库存和售价。
- `ChatUI.resultStaySeconds` 控制顾客结果停留时间，默认 1.2 秒。
- `ChatUI.bubbleViewHeight` 控制聊天可视高度，默认 250。

## 6. 当前验证方式

脚本检查命令：

```text
node "C:\ProgramData\cocos\editors\Creator\3.8.8\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js" -p "E:\AIcafe\AIcafe\tsconfig.json" --noEmit --skipLibCheck
```

当前脚本检查已通过。

推荐 Cocos 预览测试：

1. 第一天进货 2-3 种商品。
2. 检查资金减少、库存增加、售价显示正确。
3. 点击开始营业。
4. 确认营业阶段仍能看到库存和售价，但不能继续进货。
5. 对顾客发送消息，也可以按 Enter 发送。
6. 观察购买欲望变化和顾客回复风格。
7. 顾客结束时确认显示 `结果：购买了XX` 或 `结果：未购买`。
8. 多轮聊天后用鼠标滚轮或触摸拖动查看历史。
9. 所有顾客结束后进入结算。
10. 点击下一天，检查未售库存保留。

## 7. 真实 AI 接入说明

当前仍然使用本地规则 AI，暂不接真实 API。后续接入时建议：

1. 保留 `AIManager.reply` 作为统一入口。
2. 先调用真实模型。
3. 校验固定输出格式。
4. 失败或无网络时回退到当前本地规则。
5. 使用 `PromptBuilder` 中的顾客性格、关键词、商品标签、价格、库存上下文。
