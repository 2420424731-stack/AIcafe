# 《AI客来：街角咖啡屋》UI 与美术素材准备指南

更新时间：2026-05-12

## 1. 当前目标

当前游戏已经可以跑通“进货 / 定价 -> 营业对话 -> 顾客购买或离店 -> 日终结算 -> 下一天”的最小闭环。下一阶段美术目标不是一次性做成完整商业级界面，而是先把默认灰色控件替换成有咖啡店氛围、信息清晰、适合课堂展示的 2D UI。

建议风格：

- 主题：街角咖啡屋、温暖、轻松、略带手账感。
- 色彩：暖木色、奶油白、咖啡棕、薄荷绿或柔和橙色点缀。
- UI 原则：按钮清楚、文字可读、经营数据醒目、聊天区干净。
- 素材格式：优先使用 `.png`，需要透明背景的图标、人物、商品都导出透明 PNG。

## 2. 推荐素材目录

建议把素材放到 `assets/art` 下，按用途分文件夹：

```text
assets/art
├─ backgrounds
│  ├─ cafe_main_bg.png
│  └─ result_bg.png
├─ ui
│  ├─ panels
│  ├─ buttons
│  ├─ bars
│  ├─ bubbles
│  └─ icons
├─ products
│  ├─ americano.png
│  ├─ latte.png
│  ├─ croissant.png
│  ├─ coconut_latte.png
│  ├─ tiramisu.png
│  └─ blue_mountain.png
├─ customers
│  ├─ introvert.png
│  ├─ expert.png
│  ├─ artistic.png
│  ├─ social.png
│  ├─ worker.png
│  └─ hesitant.png
└─ effects
   ├─ coin_pop.png
   ├─ reputation_star.png
   └─ purchase_success.png
```

命名建议全部使用英文小写、下划线，不建议使用中文文件名、空格和特殊符号。这样可以减少 Cocos 资源导入失败、路径乱码、脚本引用不稳定的问题。

## 3. 必备 UI 素材清单

### 3.1 主界面背景

| 素材 | 建议尺寸 | 用途 | 优先级 |
| --- | --- | --- | --- |
| `cafe_main_bg.png` | 1280x720 或 1920x1080 | 主场景背景，表现咖啡店柜台、菜单牌、桌椅 | 高 |
| `result_bg.png` | 1280x720 | 日终结算背景，可用夜晚咖啡店或账本桌面 | 中 |

主场景背景最好不要太花，中央和右侧要留出聊天区空间，顶部要留出资金、天数、声望、阶段信息。

### 3.2 面板与容器

| 素材 | 用途 | 建议 |
| --- | --- | --- |
| `panel_prep.png` | 准备阶段商品列表背景 | 可做成浅色菜单板或木板 |
| `panel_chat.png` | 营业阶段聊天区域背景 | 半透明浅色，保证文字清楚 |
| `panel_result.png` | 结算日报背景 | 类似账单、便签、收据纸 |
| `product_row.png` | 单个商品条目背景 | 横向条目，适合显示商品名、价格、库存 |
| `top_status_bar.png` | 顶部状态栏背景 | 让资金、天数、声望更统一 |

面板类素材建议使用可九宫格拉伸的 PNG，也就是边缘简单、中间平铺或纯色，方便 Cocos 里调整大小。

### 3.3 按钮

每类按钮建议准备 3 张状态图：

```text
btn_primary_normal.png
btn_primary_pressed.png
btn_primary_disabled.png

btn_secondary_normal.png
btn_secondary_pressed.png
btn_secondary_disabled.png

btn_small_normal.png
btn_small_pressed.png
btn_small_disabled.png
```

对应当前游戏按钮：

- 开始营业
- 购买 / 进货
- 发送
- 下一天
- 介绍
- 提示
- 后续可能加入的关闭、返回、确认按钮

按钮文字仍然可以用 Cocos 的 Label，不建议把文字直接画死在图片上，这样后续改字更方便。

### 3.4 输入框、进度条、聊天气泡

| 素材 | 用途 | 建议 |
| --- | --- | --- |
| `input_box.png` | 玩家输入话术的输入框背景 | 浅色，边框清晰 |
| `desire_bar_bg.png` | 购买欲望进度条底图 | 灰色或浅咖色 |
| `desire_bar_fill.png` | 购买欲望进度条填充 | 可用绿色、黄色或橙色 |
| `bubble_customer.png` | 顾客发言气泡 | 左侧或中性气泡 |
| `bubble_player.png` | 店长发言气泡 | 右侧或强调色气泡 |
| `bubble_system.png` | 系统提示气泡 | 淡黄色或便签样式 |

聊天气泡建议保持简洁，因为游戏核心是读文字。气泡背景不要太深，也不要有复杂纹理。

### 3.5 图标

| 图标 | 用途 |
| --- | --- |
| `icon_money.png` | 资金 |
| `icon_day.png` | 天数 |
| `icon_reputation.png` | 声望 / 星级 |
| `icon_phase.png` | 当前阶段 |
| `icon_inventory.png` | 库存 |
| `icon_price.png` | 定价 |
| `icon_send.png` | 发送 |
| `icon_info.png` | 商品介绍 |
| `icon_hint.png` | 对话提示 |
| `icon_profit.png` | 利润 |
| `icon_customer.png` | 接待顾客 |

图标建议尺寸 64x64 或 128x128，导入后在 Cocos 中缩放使用。

## 4. 商品素材清单

当前商品建议先准备 6 个商品图标，尺寸建议 256x256 透明 PNG：

| 文件名 | 商品 | 美术建议 |
| --- | --- | --- |
| `americano.png` | 美式咖啡 | 黑咖啡杯，简洁直接 |
| `latte.png` | 拿铁 | 拉花咖啡，温和亲切 |
| `croissant.png` | 原味牛角包 | 金黄色牛角包 |
| `coconut_latte.png` | 生椰拿铁 | 带椰子或白色奶泡元素 |
| `tiramisu.png` | 提拉米苏 | 方形甜点，撒可可粉 |
| `blue_mountain.png` | 蓝山手冲 | 手冲壶、滤杯或高级咖啡杯 |

商品图标后续可以显示在准备阶段的商品条目左侧，也可以在点击“介绍”时配合文字展示。

## 5. 顾客素材清单

当前游戏有 6 类顾客，建议每类先准备一个半身头像或圆形头像，尺寸建议 512x512 透明 PNG：

| 文件名 | 顾客类型 | 视觉关键词 |
| --- | --- | --- |
| `introvert.png` | 社恐内向型 | 安静、低头、帆布包、柔和色 |
| `expert.png` | 挑剔达人型 | 眼镜、认真、咖啡知识感 |
| `artistic.png` | 文艺青年型 | 围巾、书、相机、松弛氛围 |
| `social.png` | 社牛自来熟型 | 表情开朗、动作外向、颜色明亮 |
| `worker.png` | 赶时间上班族 | 公文包、手机、咖啡外带杯 |
| `hesitant.png` | 纠结选择困难型 | 犹豫表情、选择气泡、柔和色 |

第一版只需要静态头像，不需要做 Live2D、骨骼动画或复杂表情。后续如果时间充足，可以再增加“开心 / 犹豫 / 不满”三个表情版本。

## 6. 可选效果素材

这些素材不是第一优先级，但能明显提升表现力：

- `coin_pop.png`：成交时的金币小图标。
- `purchase_success.png`：购买成功小标记。
- `customer_leave.png`：顾客离店提示图标。
- `reputation_star.png`：声望提升星星。
- `day_end_stamp.png`：日报完成印章。
- `unlock_badge.png`：新商品 / 新顾客解锁角标。

第一版可以只准备静态 PNG，后续再用 Cocos Tween 做轻微缩放、淡入淡出。

## 7. Cocos 导入操作

### 7.1 导入前准备

1. 确认素材文件是 `.png` 或 `.jpg`，UI、图标、角色、商品优先使用透明 `.png`。
2. 文件名使用英文小写和下划线，例如 `btn_primary_normal.png`。
3. 不要把 `.psd`、`.ai`、`.sketch`、`.clip` 等源文件直接放进 `assets`。
4. 不要手动删除或改动 Cocos 自动生成的 `.meta` 文件。
5. 如果外部复制素材到项目目录，回到 Cocos 后等待资源管理器自动刷新；没有刷新时右键资源目录选择刷新。

### 7.2 导入到项目

1. 在系统文件夹中打开 `E:/a/AIcafe/assets/art`。
2. 按推荐目录创建 `backgrounds`、`ui`、`products`、`customers`、`effects`。
3. 把素材文件复制到对应目录。
4. 回到 Cocos Creator，查看资源管理器中的 `assets/art`。
5. 选中图片资源，在属性检查器确认类型为 `texture` / `spriteFrame` 可用。
6. 如果图片没有自动生成 SpriteFrame，可以在资源属性里确认是否启用 SpriteFrame，或重新导入图片。

### 7.3 常用图片设置

| 素材类型 | 建议设置 |
| --- | --- |
| 背景图 | 不透明 PNG/JPG，尺寸 1280x720 或 1920x1080 |
| UI 面板 | PNG，保留透明边缘，后续可设置九宫格 |
| 按钮 | PNG，准备 normal / pressed / disabled 三态 |
| 图标 | 透明 PNG，64x64 / 128x128 |
| 商品 | 透明 PNG，256x256 |
| 顾客 | 透明 PNG，512x512 |

如果图片在游戏里发虚，优先检查原图尺寸是否太小；如果边缘有黑边，检查导出时是否正确保留透明通道。

## 8. 后续替换到游戏中的步骤

建议按下面顺序替换，不要一次性全改：

### 第一步：替换背景和顶部状态栏

1. 打开 `assets/scenes/Main.scene`。
2. 在 Canvas 下新增或选中背景节点。
3. 添加 `Sprite` 组件。
4. 把 `cafe_main_bg.png` 拖到 SpriteFrame。
5. 调整尺寸覆盖整个画布。
6. 顶部资金、天数、声望、阶段文字下方可以加 `top_status_bar.png`，让信息更清楚。

### 第二步：替换按钮外观

1. 选中 `StartBusinessButton`、`BuyButton`、`SendButton`、`NextDayButton` 等按钮节点。
2. 在 Button 组件里设置：
   - Normal Sprite
   - Pressed Sprite
   - Disabled Sprite
3. 按钮文字继续使用 Label，方便后续改文案。

### 第三步：美化商品列表

1. 打开 `assets/prefabs/ProductItem.prefab`。
2. 给商品条目加背景 Sprite，例如 `product_row.png`。
3. 后续可以新增商品 Icon 节点，把对应商品图标拖进去。
4. 保持价格输入框、数量输入框、购买按钮不要互相遮挡。

注意：当前商品图标如果要根据商品 id 自动切换，后续需要给 `ProductItemUI.ts` 增加一个 `Sprite` 引用和一个简单的图片匹配逻辑。第一版也可以先不自动切换，只做条目背景和按钮美化。

### 第四步：美化聊天区

1. 打开 `assets/prefabs/ChatBubble.prefab`。
2. 给气泡节点添加或替换 Sprite 背景。
3. 顾客、店长、系统提示可以后续使用不同气泡图：
   - 顾客：`bubble_customer.png`
   - 店长：`bubble_player.png`
   - 系统提示：`bubble_system.png`
4. 输入框可替换为 `input_box.png`。
5. 提示按钮可以使用 `icon_hint.png` 或小按钮底图。

注意：当前气泡样式主要由脚本动态控制，第一版建议先统一替换气泡背景，后续再区分不同角色气泡。

### 第五步：加入顾客头像

1. 在 ChatPanel 左侧或顾客信息区域新增头像 Sprite 节点。
2. 准备 6 类顾客头像。
3. 后续给 `ChatUI.ts` 增加头像 Sprite 引用，根据顾客类型切换图片。

第一版可以先固定显示一个默认顾客头像，等界面稳定后再做按顾客类型切换。

### 第六步：美化结算日报

1. 给 ResultPanel 添加 `panel_result.png` 或 `result_bg.png`。
2. 给营收、成本、利润、成交率、客单价配小图标。
3. 经营建议和话术总结可以做成便签样式区域。
4. “下一天”按钮使用主按钮样式，位置保持清楚。

## 9. 建议优先级

第一优先级，最影响观感：

- 主背景
- 按钮三态
- 商品条目背景
- 聊天气泡
- 输入框
- 购买欲望进度条

第二优先级，增强主题感：

- 6 个商品图标
- 6 个顾客头像
- 顶部状态栏图标
- 结算日报背景

第三优先级，锦上添花：

- 成交金币效果
- 声望星星效果
- 解锁角标
- 顾客不同表情
- 简单转场或淡入淡出

## 10. 容易出问题的地方

- 图片文件名带中文或特殊符号，可能导致路径显示异常。
- 直接把设计源文件放进 `assets`，可能导致 Cocos 导入失败。
- 图片尺寸太大，预览时占内存；图片尺寸太小，运行时发虚。
- 按钮图片只准备 normal，没有 pressed / disabled，交互反馈会比较弱。
- 背景太花，导致白色文字看不清。
- 在 Cocos 外部移动资源后，没有等待资源管理器刷新。
- 手动删除 `.meta` 文件，可能导致场景或预制体引用丢失。

## 11. 下一步执行建议

推荐你先准备这一组最小美术包：

```text
1 张主背景
1 张商品条目背景
1 套主按钮三态
1 套小按钮三态
1 张输入框背景
2-3 张聊天气泡
1 套购买欲望进度条
6 张商品图标
6 张顾客头像
```

准备完成后，先导入到 `assets/art`，再从背景、按钮、商品条目开始替换。这样改动最直观，也最容易检查是否导入成功。
