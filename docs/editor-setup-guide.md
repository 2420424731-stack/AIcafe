# Cocos Creator 编辑器操作指南 — AIcafe Phase 2

> **前提条件**：确认已打开 Cocos Creator 3.8.8，且项目路径为 `E:\a\AIcafe`。
>
> 以下所有操作都在 Cocos Creator 编辑器内完成。**每完成一节后建议保存场景（Ctrl+S）**。

---

## 1. 创建 Title.scene（标题画面）

### 1.1 创建场景文件

1. 在 **资源管理器** 中右键 `assets/scenes/` → **新建** → **Scene**
2. 命名为 `Title`，双击打开

### 1.2 设置 Canvas

1. 选中 `Canvas` 节点，在 **属性检查器** 中确认：
   - `UITransform` → Width: `1280`, Height: `720`
   - `Canvas` → Fit Width: ✅, Fit Height: ✅

### 1.3 创建 TitleUI 节点树

在 Canvas 下创建以下节点（右键 Canvas → 创建 → 空节点，挂载对应组件）：

```
Canvas
├── Background              — 空节点 + Sprite（背景图）
├── TitleUI                 — 空节点，挂载 TitleUI 组件
│   ├── TitleLabel          — Label："AI客来：街角咖啡屋"
│   ├── SubtitleLabel       — Label："用真心对话，煮一杯好咖啡"
│   ├── NewGameBtn          — 空节点 + Button + Label："新游戏"
│   ├── ContinueBtn         — 空节点 + Button + Label："继续游戏"
│   ├── SettingsBtn         — 空节点 + Button + Label："设置"
│   ├── VersionLabel        — Label："v2.0.0"
│   └── SaveSlotPanel       — 空节点（默认 active=false）
│       ├── SlotEntry0      — 空节点 + Button + Label
│       ├── SlotEntry1      — 空节点 + Button + Label
│       └── SlotEntry2      — 空节点 + Button + Label
└── TransitionOverlay       — 全屏黑色矩形节点，挂载 TransitionUI
```

### 1.4 TitleUI 组件属性绑定

选中 `TitleUI` 节点，在 **属性检查器** 中将以下属性拖入：

| 属性 | 拖入节点 | 组件 |
|------|---------|------|
| `titleLabel` | TitleLabel | Label |
| `subtitleLabel` | SubtitleLabel | Label |
| `versionLabel` | VersionLabel | Label |
| `newGameBtn` | NewGameBtn | — |
| `continueBtn` | ContinueBtn | — |
| `settingsBtn` | SettingsBtn | — |
| `saveSlotPanel` | SaveSlotPanel | — |
| `slotEntries[0]` | SlotEntry0 | — |
| `slotEntries[1]` | SlotEntry1 | — |
| `slotEntries[2]` | SlotEntry2 | — |

### 1.5 按钮事件绑定

| 按钮 | 点击事件 → 目标 |
|------|---------------|
| NewGameBtn | `TitleUI.onNewGame` |
| ContinueBtn | `TitleUI.onContinue` |
| SettingsBtn | `TitleUI.onSettings` |
| SlotEntry0 | `TitleUI.onSelectSlot` → 参数 `0` |
| SlotEntry1 | `TitleUI.onSelectSlot` → 参数 `1` |
| SlotEntry2 | `TitleUI.onSelectSlot` → 参数 `2` |

### 1.6 布局参考

- TitleLabel：居中偏上（y ≈ 120），fontSize: 48, 颜色: 深棕色
- SubtitleLabel：TitleLabel 下方 60px，fontSize: 22, 颜色: 浅棕色
- NewGameBtn：居中（y ≈ -20），尺寸 200×56
- ContinueBtn：NewGameBtn 下方 70px，尺寸 200×56
- SettingsBtn：ContinueBtn 下方 70px，尺寸 200×56
- VersionLabel：右下角（x ≈ 600, y ≈ -340），fontSize: 14
- SaveSlotPanel：居中显示，半透明深色背景
- TransitionOverlay：全屏（1280×720），颜色黑色，初始 active = false

---

## 2. 创建 Settings.scene（设置画面）

### 2.1 创建场景文件

1. 在 **资源管理器** 中右键 `assets/scenes/` → **新建** → **Scene**
2. 命名为 `Settings`，双击打开

### 2.2 设置 Canvas

同 Title.scene：1280×720，Fit Width + Fit Height。

### 2.3 创建 SettingsUI 节点树

```
Canvas
├── Background              — 空节点 + Sprite
├── SettingsUI              — 空节点，挂载 SettingsUI 组件
│   ├── Panel               — 空节点 + Sprite（半透明面板）
│   ├── TitleLabel          — Label："设置"
│   ├── BgmVolumeLabel      — Label："BGM 音量"
│   ├── BgmVolumeSlider     — 空节点 + Slider
│   ├── SfxVolumeLabel      — Label："音效音量"
│   ├── SfxVolumeSlider     — 空节点 + Slider
│   ├── AiStyleLabel        — Label："AI 回复风格"
│   ├── AiStyleConciseToggleCheckbox   — 空节点 + Toggle + Label："精简"
│   ├── AiStyleDetailedToggleCheckbox  — 空节点 + Toggle + Label："详细"
│   ├── TextSpeedLabel      — Label："文字显示速度"
│   ├── TextSpeedInstantCheckbox       — 空节点 + Toggle + Label："即时"
│   ├── TextSpeedNormalCheckbox        — 空节点 + Toggle + Label："普通"
│   ├── TextSpeedTypewriterCheckbox    — 空节点 + Toggle + Label："打字机"
│   ├── AutoSaveToggleCheckbox         — 空节点 + Toggle + Label："自动存档"
│   ├── ClearSaveBtn        — 空节点 + Button + Label："清除存档"
│   ├── ClearSaveConfirm    — 空节点（默认 active=false）
│   │   ├── ConfirmLabel    — Label："确定要清除所有存档吗？此操作不可撤销。"
│   │   ├── ConfirmYesBtn   — 空节点 + Button + Label："确认清除"
│   │   └── ConfirmNoBtn    — 空节点 + Button + Label："取消"
│   └── BackBtn             — 空节点 + Button + Label："返回"
└── TransitionOverlay       — 同 Title.scene
```

### 2.4 Toggle 组件配置（重要）

同级 Toggle 需要放在同一个 **ToggleGroup** 下才能互斥：

1. 创建空节点 `AiStyleToggleGroup`，挂载 `ToggleGroup` 组件
2. 将 `AiStyleConciseToggleCheckbox` 和 `AiStyleDetailedToggleCheckbox` 的 Toggle 组件的 `Group` 属性指向 `AiStyleToggleGroup`
3. 同理创建 `TextSpeedToggleGroup`，挂三个文字速度 Toggle

### 2.5 SettingsUI 组件属性绑定

| 属性 | 拖入节点 | 组件 |
|------|---------|------|
| `panel` | Panel | — |
| `titleLabel` | TitleLabel | Label |
| `bgmVolumeLabel` | BgmVolumeLabel | Label |
| `bgmVolumeSlider` | BgmVolumeSlider | Slider |
| `sfxVolumeLabel` | SfxVolumeLabel | Label |
| `sfxVolumeSlider` | SfxVolumeSlider | Slider |
| `aiStyleConciseToggle` | AiStyleConciseToggleCheckbox | Toggle |
| `aiStyleDetailedToggle` | AiStyleDetailedToggleCheckbox | Toggle |
| `textSpeedInstantToggle` | TextSpeedInstantCheckbox | Toggle |
| `textSpeedNormalToggle` | TextSpeedNormalCheckbox | Toggle |
| `textSpeedTypewriterToggle` | TextSpeedTypewriterCheckbox | Toggle |
| `autoSaveToggle` | AutoSaveToggleCheckbox | Toggle |
| `clearSaveConfirm` | ClearSaveConfirm | — |
| `confirmLabel` | ConfirmLabel | Label |
| `backBtn` | BackBtn | — |

### 2.6 控件事件绑定

| 控件 | 事件 | 目标方法 |
|------|------|---------|
| BgmVolumeSlider | onProgressChanged | `SettingsUI.onBgmVolumeChanged` |
| SfxVolumeSlider | onProgressChanged | `SettingsUI.onSfxVolumeChanged` |
| AiStyleConciseToggleCheckbox | onCheckedChanged | `SettingsUI.onAiStyleChanged` |
| AiStyleDetailedToggleCheckbox | onCheckedChanged | `SettingsUI.onAiStyleChanged` |
| TextSpeedInstantCheckbox | onCheckedChanged | `SettingsUI.onTextSpeedChanged` |
| TextSpeedNormalCheckbox | onCheckedChanged | `SettingsUI.onTextSpeedChanged` |
| TextSpeedTypewriterCheckbox | onCheckedChanged | `SettingsUI.onTextSpeedChanged` |
| AutoSaveToggleCheckbox | onCheckedChanged | `SettingsUI.onAutoSaveChanged` |
| ClearSaveBtn | onClick | `SettingsUI.onClearSave` |
| ConfirmYesBtn | onClick | `SettingsUI.onConfirmClearSave` |
| ConfirmNoBtn | onClick | `SettingsUI.onCancelClearSave` |
| BackBtn | onClick | `SettingsUI.onBack` |

### 2.7 布局参考

- Panel：居中，约 560×600，半透明白色/米色背景
- TitleLabel：Panel 顶部，y ≈ 260，fontSize: 32
- 各设置行：y 从 200 起每行递减约 65px
- Slider 宽度约 200px
- BackBtn：左下角或 Panel 底部

---

## 3. 设置常驻节点（GameRoot / AudioManager）

### 3.1 在 Main.scene 中创建 GameRoot

1. 打开 `Main.scene`
2. 在 Canvas 同级（场景根级别）创建一个空节点，命名为 `GameRoot`
3. 挂载 `AudioManager` 组件
4. **勾选节点的 `active`** 属性右侧的 **锁链图标**（或右键节点 → 设置为不销毁）— 这确保场景切换时 GameRoot 不销毁
5. 如果 AudioManager 也需要持久化独立于 Main.scene，可以在 Title.scene 中重复步骤 1-4（AudioManager.onLoad 会自动处理单例，重复节点会自毁）

> **备选方案**：在 `assets/scenes/` 下创建单独的 `GameRoot.prefab`（包含 AudioManager 和必要的全局节点），在每个场景的 Canvas 同级手动放置，由 AudioManager 的 `if (AudioManager._instance) { this.destroy(); return; }` 保证单例。

---

## 4. 在 Main.scene 中集成新组件

### 4.1 添加 OnboardingUI

1. 打开 `Main.scene`
2. 在 `Canvas` 下创建空节点 `OnboardingPanel`
3. 挂载 `OnboardingUI` 组件
4. 在 OnboardingPanel 下创建子节点：
   ```
   OnboardingPanel
   ├── PanelBg      — 空节点 + Sprite（半透明深色底）
   ├── TitleLabel   — Label
   ├── BodyLabel    — Label
   ├── NextBtn      — 空节点 + Button + Label："下一步"
   └── SkipBtn      — 空节点 + Button + Label："跳过教程"
   ```

### 4.2 绑定 OnboardingUI 属性

| 属性 | 拖入节点 |
|------|---------|
| `panel` | PanelBg |
| `titleLabel` | TitleLabel |
| `bodyLabel` | BodyLabel |
| `nextBtn` | NextBtn |
| `skipBtn` | SkipBtn |

### 4.3 OnboardingUI 按钮事件

- NextBtn → `OnboardingUI.onNext`
- SkipBtn → `OnboardingUI.onSkip`

### 4.4 在 MainUI 中绑定 OnboardingUI

1. 选中 `MainUI` 节点
2. 在 **属性检查器** 中找到 `onboardingUI` 属性
3. 将 `OnboardingPanel` 节点拖入（编辑器会自动识别上面的 OnboardingUI 组件）

### 4.5 添加 TransitionOverlay

在 Canvas 下创建与 Title.scene 中相同的过渡覆盖层：
1. 右键 Canvas → 创建 → 空节点，命名 `TransitionOverlay`
2. 添加 `UITransform`（1280×720）
3. 组件 `Sprite` → 颜色设为纯黑（R0 G0 B0 A255）
4. 挂载 `TransitionUI` 组件
5. 初始 `active` = false

### 4.6 添加 GameOverUI（如果尚未创建）

1. 在 `ResultPanel` 下创建子节点 `GameOverPanel`
2. 挂载 `GameOverUI` 组件
3. 子节点：
   ```
   GameOverPanel
   ├── TitleLabel   — Label
   ├── StatsLabel   — Label
   ├── RatingLabel  — Label
   ├── NewGameBtn   — 空节点 + Button + Label："再来一局"
   └── TitleBtn     — 空节点 + Button + Label："返回标题"
   ```

### 4.7 GameOverUI 属性绑定与事件

| 属性 | 拖入节点 | 
|------|---------|
| `titleLabel` | TitleLabel |
| `statsLabel` | StatsLabel |
| `ratingLabel` | RatingLabel |
| `newGameBtn` | NewGameBtn |
| `titleBtn` | TitleBtn |

按钮事件：
- NewGameBtn → `GameOverUI.onNewGame`
- TitleBtn → `GameOverUI.onTitle`

---

## 5. 音频资源配置

### 5.1 准备音频文件

在 `assets/audio/` 目录下放入以下文件（可从 freesound.org / pixabay.com 获取 CC0 素材）：

| 文件 | 用途 | 建议时长 |
|------|------|---------|
| `bgm_title.mp3` | 标题画面 BGM | 30-60s 循环 |
| `bgm_gameplay.mp3` | 营业中 BGM | 60-120s 循环 |
| `bgm_result.mp3` | 结算画面 BGM | 15-30s |
| `bgm_gameover.mp3` | 游戏结束 BGM | 15-30s |
| `sfx_click.mp3` | 按钮点击 | 0.1-0.3s |
| `sfx_buy.mp3` | 进货音效 | 0.3-0.5s |
| `sfx_sale.mp3` | 成交音效（收银机） | 0.5-1s |
| `sfx_customer_enter.mp3` | 顾客进店（门铃） | 0.5-1s |
| `sfx_customer_leave.mp3` | 顾客离店 | 0.3-0.5s |
| `sfx_day_end.mp3` | 日终结算 | 1-2s |
| `sfx_unlock.mp3` | 解锁新内容 | 0.5-1s |
| `sfx_achievement.mp3` | 成就解锁 | 1-2s |
| `sfx_star_up.mp3` | 星级提升 | 1-2s |

### 5.2 导入与注册

1. 将音频文件拖入 `assets/audio/` 目录
2. Cocos 会自动导入为 `AudioClip` 资源
3. 在代码中通过 `AudioManager.registerBGM(BGMTrack.Title, clip)` 注册
4. **推荐方式**：在 `AudioManager` 组件上添加 `@property` 数组属性绑定 AudioClip，在编辑器中拖入对应文件：

```typescript
// 可在 AudioManager.ts 中添加：
@property([AudioClip])
bgmClips: AudioClip[] = [];  // 按 BGMTrack 枚举顺序
@property([AudioClip])
sfxClips: AudioClip[] = [];  // 按 SFX 枚举顺序
```

> 当前 AudioManager 使用 `registerBGM`/`registerSFX` 方法动态注册。你需要：
> - 方式 A：在某个启动脚本中调用 `AudioManager.instance.registerBGM(BGMTrack.Title, clip)`
> - 方式 B（推荐）：修改 AudioManager，添加 `@property([AudioClip])` 编辑器绑定，在 `onLoad` 中自动注册

---

## 6. 场景构建顺序（Build Settings）

1. 菜单 **项目** → **构建发布**
2. 平台选择 **Web Mobile**
3. **场景列表** 中按顺序添加：
   - `Title.scene`（入口场景，放第一位）
   - `Main.scene`
   - `Settings.scene`
4. 其他构建参数保持默认

---

## 7. 验证清单

完成上述所有操作后，逐项检查：

- [ ] **Title.scene**：运行后显示标题画面，三个按钮可见
- [ ] **新游戏**：点击后切换到 Main.scene，进入 Prep 阶段
- [ ] **继续游戏**：无存档时灰显，有存档时弹出槽位选择器
- [ ] **设置**：点击后进入 Settings.scene
- [ ] **Settings.scene**：所有滑块/Toggle 可交互，音量调节实时生效
- [ ] **清除存档**：弹出确认弹窗，确认后存档被清除
- [ ] **返回按钮**：从 Settings 回到 Title
- [ ] **新手引导**：首次新游戏时，Main 场景加载后弹出 Onboarding（5 步可点击跳过）
- [ ] **气泡动画**：对话时聊天气泡有弹出动画
- [ ] **音效**：按钮点击、顾客进出、成交等有对应音效
- [ ] **BGM 切换**：标题 → 营业 → 结算/游戏结束，BGM 正确切换
- [ ] **游戏结束**：失败/胜利条件触发后显示 GameOver 画面
- [ ] **存档/读档**：新游戏 → 经营一天 → 返回标题 → 继续游戏 → 状态恢复
- [ ] **TypeScript 编译**：运行 `npx tsc -p tsconfig.json --noEmit --skipLibCheck` 无错误

---

## 8. 常见问题

### Q: 音频不播放
- 检查 AudioManager 的 GameRoot 节点是否在场景中且未被销毁
- 检查 AudioClip 是否正确注册到 `_bgmClips` / `_sfxClips`
- 检查浏览器是否允许自动播放音频（需用户交互后才能播放）

### Q: 场景切换后 AudioManager 丢失
- 确保 GameRoot 在每个场景中都存在（作为 prefab 或手动放置）
- AudioManager.onLoad 自动处理单例：重复的会自毁，保留第一个

### Q: TitleUI/SettingsUI 组件不显示在属性检查器
- 检查 `.ts` 文件是否已通过 Cocos 的编译
- 确认 `@ccclass('TitleUI')` 装饰器存在
- 尝试右键 `assets/scripts/` → **重新导入资源**

### Q: PromptBuilder 改动后 AIManager 报错
- PromptBuilder 已改为纯客户端校验工具，不应在 AIManager 中引用旧 API
- AIManager 内部的 payload 构建是独立的，不依赖 PromptBuilder
