import { _decorator, Component, Node, Label, Button, director, Color, UITransform } from 'cc';
import { SaveManager } from '../core/SaveManager';
import { SceneId, SceneManager } from '../core/SceneManager';
import { AnimationHelper } from '../core/AnimationHelper';
import { AudioManager, BGMTrack, SFX } from '../core/AudioManager';

const { ccclass, property } = _decorator;

/** 存档槽摘要信息 */
interface SaveSlotInfo {
    slot: number;
    label: string;
    day: number;
    money: number;
    timestamp: number;
}

/**
 * 标题画面 UI
 *
 * 游戏入口界面，提供新游戏/继续/设置入口。
 * 挂载在 Title.scene 的 Canvas 节点上。
 *
 * 节点结构（需在 Cocos Creator 编辑器中创建）：
 *   Canvas/TitleUI
 *     ├── Background         — 背景图
 *     ├── TitleLabel         — 游戏标题 "AI客来：街角咖啡屋"
 *     ├── SubtitleLabel      — 副标题
 *     ├── NewGameBtn         — "新游戏" 按钮
 *     ├── ContinueBtn        — "继续游戏" 按钮（无存档时灰显）
 *     ├── SettingsBtn        — "设置" 按钮
 *     ├── VersionLabel       — 版本号
 *     └── SaveSlotPanel      — 存档槽选择面板（默认隐藏）
 *           ├── SlotEntry0   — 槽位 0 条目
 *           ├── SlotEntry1   — 槽位 1 条目
 *           └── SlotEntry2   — 槽位 2 条目
 */
@ccclass('TitleUI')
export class TitleUI extends Component {
    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    subtitleLabel: Label | null = null;

    @property(Label)
    versionLabel: Label | null = null;

    @property(Node)
    newGameBtn: Node | null = null;

    @property(Node)
    continueBtn: Node | null = null;

    @property(Node)
    settingsBtn: Node | null = null;

    @property(Node)
    saveSlotPanel: Node | null = null;

    /** 存档槽条目节点（用于刷新内容） */
    @property([Node])
    slotEntries: Node[] = [];

    private _slots: SaveSlotInfo[] = [];

    onLoad(): void {
        this._slots = SaveManager.listSlots();
        this._refreshUI();
        this._playTitleBGM();
    }

    // ── 按钮回调 ────────────────────────────────────────────────

    /** "新游戏" → 进入 Main 场景 */
    onNewGame(): void {
        this._playClickSFX();
        // 清除 GameManager 的旧存档引用
        SaveManager.deleteSlot(0);
        SceneManager.goTo(SceneId.Main);
    }

    /** "继续游戏" → 如果有多个存档，显示槽位选择器；否则直接加载最近的 */
    onContinue(): void {
        this._playClickSFX();

        if (this._slots.length === 0) return;
        if (this._slots.length === 1) {
            this._loadSlot(this._slots[0].slot);
            return;
        }

        // 多个存档 → 显示选择面板
        this._showSaveSlotPanel();
    }

    /** "设置" → 进入 Settings 场景 */
    onSettings(): void {
        this._playClickSFX();
        SceneManager.goTo(SceneId.Settings);
    }

    /** 选择存档槽位 */
    onSelectSlot(slotIndex: number): void {
        this._playClickSFX();
        this._loadSlot(slotIndex);
    }

    /** 关闭存档槽选择面板 */
    onCancelSlotSelect(): void {
        this._playClickSFX();
        this._hideSaveSlotPanel();
    }

    // ── 内部 ────────────────────────────────────────────────────

    private _refreshUI(): void {
        if (this.titleLabel) {
            this.titleLabel.string = 'AI客来：街角咖啡屋';
        }
        if (this.subtitleLabel) {
            this.subtitleLabel.string = '用真心对话，煮一杯好咖啡';
        }
        if (this.versionLabel) {
            this.versionLabel.string = 'v2.0.0';
        }

        // 无存档时灰显"继续"
        const hasSaves = this._slots.length > 0;
        if (this.continueBtn) {
            const btn = this.continueBtn.getComponent(Button);
            if (btn) btn.interactable = hasSaves;
        }

        // 刷新槽位条目
        this._refreshSlotEntries();

        // 入场动画
        if (this.newGameBtn) AnimationHelper.fadeIn(this.newGameBtn, 0.5);
        if (this.continueBtn) AnimationHelper.fadeIn(this.continueBtn, 0.6);
        if (this.settingsBtn) AnimationHelper.fadeIn(this.settingsBtn, 0.7);
    }

    private _refreshSlotEntries(): void {
        if (!this.slotEntries || this.slotEntries.length === 0) return;

        for (let i = 0; i < this.slotEntries.length; i++) {
            const entry = this.slotEntries[i];
            if (!entry) continue;

            const slot = this._slots.find((s) => s.slot === i);
            const label = entry.getComponentInChildren(Label);

            if (slot && label) {
                const date = new Date(slot.timestamp).toLocaleDateString('zh-CN');
                label.string = `存档 ${i + 1}  |  第 ${slot.day} 天  |  ¥${slot.money}  |  ${date}`;
            } else if (label) {
                label.string = `存档 ${i + 1}  —  空`;
            }
        }
    }

    private _showSaveSlotPanel(): void {
        if (!this.saveSlotPanel) return;

        this._refreshSlotEntries();
        this.saveSlotPanel.active = true;
        AnimationHelper.fadeIn(this.saveSlotPanel, 0.2);
    }

    private _hideSaveSlotPanel(): void {
        if (!this.saveSlotPanel) return;

        AnimationHelper.fadeOut(this.saveSlotPanel, 0.2).then(() => {
            if (this.saveSlotPanel) this.saveSlotPanel.active = false;
        });
    }

    private _loadSlot(slotIndex: number): void {
        const data = SaveManager.load(slotIndex);
        if (!data) return;

        // 存档数据会在 Main 场景的 GameManager.onLoad 中通过检查 localStorage 恢复
        // 这里设置一个标记，让 GameManager 知道要加载哪个槽位
        try {
            // 使用临时标记传递槽位号
            (window as any).__aicafe_loadSlot = slotIndex;
        } catch {
            // ignore
        }

        SceneManager.goTo(SceneId.Main);
    }

    private _playTitleBGM(): void {
        AudioManager.instance?.playBGM(BGMTrack.Title);
    }

    private _playClickSFX(): void {
        AudioManager.instance?.playSFX(SFX.Click);
    }
}
