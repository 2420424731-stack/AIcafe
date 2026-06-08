import { _decorator, Component, Node, Label, Slider, Toggle, Button, director } from 'cc';
import { SettingsManager, GameSettings } from '../core/SettingsManager';
import { SaveManager } from '../core/SaveManager';
import { SceneId, SceneManager } from '../core/SceneManager';
import { AudioManager, SFX } from '../core/AudioManager';
import { AnimationHelper } from '../core/AnimationHelper';

const { ccclass, property } = _decorator;

/**
 * 设置画面 UI
 *
 * 挂载在 Settings.scene 的 Canvas 节点上。
 * 读写 SettingsManager，控制 BGM/SFX 音量、AI 风格、文字速度等。
 *
 * 节点结构（需在 Cocos Creator 编辑器中创建）：
 *   Canvas/SettingsUI
 *     ├── Panel              — 设置面板背景
 *     ├── TitleLabel         — "设置"
 *     ├── BgmVolumeLabel     — "BGM 音量" 标签
 *     ├── BgmVolumeSlider    — Slider 组件 (0-1)
 *     ├── SfxVolumeLabel     — "音效音量" 标签
 *     ├── SfxVolumeSlider    — Slider 组件 (0-1)
 *     ├── AiStyleLabel       — "AI 回复风格" 标签
 *     ├── AiStyleConciseToggle — Toggle（精简）
 *     ├── AiStyleDetailedToggle — Toggle（详细）
 *     ├── TextSpeedLabel     — "文字显示速度" 标签
 *     ├── TextSpeedInstantToggle  — Toggle（即时）
 *     ├── TextSpeedNormalToggle   — Toggle（普通）
 *     ├── TextSpeedTypewriterToggle — Toggle（打字机）
 *     ├── AutoSaveToggle     — Toggle（自动存档）
 *     ├── ClearSaveBtn       — "清除存档" 按钮
 *     ├── ClearSaveConfirm   — 确认弹窗（默认隐藏）
 *     │     ├── ConfirmLabel
 *     │     ├── ConfirmYesBtn
 *     │     └── ConfirmNoBtn
 *     └── BackBtn            — "返回" 按钮
 */
@ccclass('SettingsUI')
export class SettingsUI extends Component {
    @property(Node)
    panel: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    // ── BGM ──────────────────────────────────────────────────

    @property(Label)
    bgmVolumeLabel: Label | null = null;

    @property(Slider)
    bgmVolumeSlider: Slider | null = null;

    // ── SFX ──────────────────────────────────────────────────

    @property(Label)
    sfxVolumeLabel: Label | null = null;

    @property(Slider)
    sfxVolumeSlider: Slider | null = null;

    // ── AI 风格 ──────────────────────────────────────────────

    @property(Toggle)
    aiStyleConciseToggle: Toggle | null = null;

    @property(Toggle)
    aiStyleDetailedToggle: Toggle | null = null;

    // ── 文字速度 ─────────────────────────────────────────────

    @property(Toggle)
    textSpeedInstantToggle: Toggle | null = null;

    @property(Toggle)
    textSpeedNormalToggle: Toggle | null = null;

    @property(Toggle)
    textSpeedTypewriterToggle: Toggle | null = null;

    // ── 自动存档 ─────────────────────────────────────────────

    @property(Toggle)
    autoSaveToggle: Toggle | null = null;

    // ── 清除存档确认 ─────────────────────────────────────────

    @property(Node)
    clearSaveConfirm: Node | null = null;

    @property(Label)
    confirmLabel: Label | null = null;

    // ── 返回 ─────────────────────────────────────────────────

    @property(Node)
    backBtn: Node | null = null;

    private _settings: GameSettings | null = null;

    onLoad(): void {
        this._settings = SettingsManager.get();
        this._refreshAll();
    }

    // ── 回调 ────────────────────────────────────────────────────

    onBgmVolumeChanged(): void {
        if (!this.bgmVolumeSlider) return;
        const volume = this.bgmVolumeSlider.progress;
        SettingsManager.save({ bgmVolume: volume });
        AudioManager.instance?.setBGMVolume(volume);
        if (this.bgmVolumeLabel) {
            this.bgmVolumeLabel.string = `BGM 音量：${Math.round(volume * 100)}%`;
        }
    }

    onSfxVolumeChanged(): void {
        if (!this.sfxVolumeSlider) return;
        const volume = this.sfxVolumeSlider.progress;
        SettingsManager.save({ sfxVolume: volume });
        AudioManager.instance?.setSFXVolume(volume);
        if (this.sfxVolumeLabel) {
            this.sfxVolumeLabel.string = `音效音量：${Math.round(volume * 100)}%`;
        }
    }

    onAiStyleChanged(): void {
        const concise = this.aiStyleConciseToggle?.isChecked ?? true;
        const style: 'concise' | 'detailed' = concise ? 'concise' : 'detailed';
        SettingsManager.save({ aiStyle: style });
    }

    onTextSpeedChanged(): void {
        let speed: GameSettings['textSpeed'] = 'normal';
        if (this.textSpeedInstantToggle?.isChecked) speed = 'instant';
        else if (this.textSpeedTypewriterToggle?.isChecked) speed = 'typewriter';
        SettingsManager.save({ textSpeed: speed });
    }

    onAutoSaveChanged(): void {
        SettingsManager.save({ autoSave: this.autoSaveToggle?.isChecked ?? true });
    }

    /** "清除存档" 按钮 */
    onClearSave(): void {
        this._playClickSFX();
        if (this.clearSaveConfirm) {
            this.clearSaveConfirm.active = true;
            AnimationHelper.fadeIn(this.clearSaveConfirm, 0.2);
        }
    }

    /** 确认清除 */
    onConfirmClearSave(): void {
        this._playClickSFX();
        for (let i = 0; i < 3; i++) {
            SaveManager.deleteSlot(i);
        }

        if (this.clearSaveConfirm) {
            AnimationHelper.fadeOut(this.clearSaveConfirm, 0.2).then(() => {
                if (this.clearSaveConfirm) this.clearSaveConfirm.active = false;
            });
        }
    }

    /** 取消清除 */
    onCancelClearSave(): void {
        this._playClickSFX();
        if (this.clearSaveConfirm) {
            AnimationHelper.fadeOut(this.clearSaveConfirm, 0.2).then(() => {
                if (this.clearSaveConfirm) this.clearSaveConfirm.active = false;
            });
        }
    }

    /** "返回" → 回到标题画面 */
    onBack(): void {
        this._playClickSFX();
        SceneManager.goTo(SceneId.Title);
    }

    // ── 内部 ────────────────────────────────────────────────────

    private _refreshAll(): void {
        if (!this._settings) return;

        // BGM
        if (this.bgmVolumeSlider) {
            this.bgmVolumeSlider.progress = this._settings.bgmVolume;
        }
        this.onBgmVolumeChanged();

        // SFX
        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.progress = this._settings.sfxVolume;
        }
        this.onSfxVolumeChanged();

        // AI 风格 ToggleGroup
        if (this.aiStyleConciseToggle && this.aiStyleDetailedToggle) {
            this.aiStyleConciseToggle.isChecked = this._settings.aiStyle === 'concise';
            this.aiStyleDetailedToggle.isChecked = this._settings.aiStyle === 'detailed';
        }

        // 文字速度 ToggleGroup
        if (this.textSpeedInstantToggle) {
            this.textSpeedInstantToggle.isChecked = this._settings.textSpeed === 'instant';
        }
        if (this.textSpeedNormalToggle) {
            this.textSpeedNormalToggle.isChecked = this._settings.textSpeed === 'normal';
        }
        if (this.textSpeedTypewriterToggle) {
            this.textSpeedTypewriterToggle.isChecked = this._settings.textSpeed === 'typewriter';
        }

        // 自动存档
        if (this.autoSaveToggle) {
            this.autoSaveToggle.isChecked = this._settings.autoSave;
        }

        // 确认弹窗初始隐藏
        if (this.clearSaveConfirm) {
            this.clearSaveConfirm.active = false;
        }

        // 入场动画
        if (this.panel) {
            AnimationHelper.fadeIn(this.panel, 0.3);
        }
    }

    private _playClickSFX(): void {
        AudioManager.instance?.playSFX(SFX.Click);
    }
}
