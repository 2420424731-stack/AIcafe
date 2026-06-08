import { _decorator, Component, AudioClip, AudioSource } from 'cc';
import { SettingsManager } from './SettingsManager';

const { ccclass } = _decorator;

export enum BGMTrack {
    Title = 'title',
    Gameplay = 'gameplay',
    Result = 'result',
    GameOver = 'gameover',
}

export enum SFX {
    Click = 'click',
    Buy = 'buy',
    Sale = 'sale',
    CustomerEnter = 'customerEnter',
    CustomerLeave = 'customerLeave',
    DayEnd = 'dayEnd',
    Unlock = 'unlock',
    Achievement = 'achievement',
    StarUp = 'starUp',
}

/**
 * 音频管理器
 *
 * 管理 BGM 和 SFX 的播放、音量和切换。
 * 作为单例组件挂载在持久化节点上（如 GameRoot）。
 *
 * 注意：音频文件需要先在 Cocos Creator 资源管理器中导入为 AudioClip，
 *       然后通过编辑器属性绑定，或通过 resources.load 动态加载。
 *       当前实现使用 resources.load 动态加载（assets/audio/ 目录）。
 */
@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    static get instance(): AudioManager | null {
        return AudioManager._instance;
    }

    private _bgmSource: AudioSource | null = null;
    private _sfxSource: AudioSource | null = null;
    private _currentBGM: BGMTrack | null = null;
    private _bgmClips: Partial<Record<BGMTrack, AudioClip>> = {};
    private _sfxClips: Partial<Record<SFX, AudioClip>> = {};

    onLoad(): void {
        if (AudioManager._instance) {
            this.destroy();
            return;
        }
        AudioManager._instance = this;

        // 创建 AudioSource 组件
        this._bgmSource = this.node.addComponent(AudioSource);
        this._bgmSource.loop = true;
        this._bgmSource.playOnAwake = false;

        this._sfxSource = this.node.addComponent(AudioSource);
        this._sfxSource.loop = false;
        this._sfxSource.playOnAwake = false;

        // 注意：需要在 Cocos Creator 编辑器中将此 GameRoot 节点设为常驻（persist）
    }

    onDestroy(): void {
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }

    // ── BGM ─────────────────────────────────────────────────

    /** 切换 BGM，支持交叉淡入淡出 */
    playBGM(track: BGMTrack): void {
        if (this._currentBGM === track) return;
        this._currentBGM = track;

        const clip = this._bgmClips[track];
        if (!clip || !this._bgmSource) return;

        const volume = SettingsManager.get().bgmVolume;
        this._bgmSource.volume = volume;
        this._bgmSource.clip = clip;
        this._bgmSource.play();
    }

    /** 停止 BGM */
    stopBGM(): void {
        this._currentBGM = null;
        this._bgmSource?.stop();
    }

    /** 设置 BGM 音量（0-1） */
    setBGMVolume(volume: number): void {
        if (this._bgmSource) {
            this._bgmSource.volume = Math.max(0, Math.min(1, volume));
        }
    }

    // ── SFX ─────────────────────────────────────────────────

    /** 播放音效 */
    playSFX(sfx: SFX): void {
        const clip = this._sfxClips[sfx];
        if (!clip || !this._sfxSource) return;

        const volume = SettingsManager.get().sfxVolume;
        this._sfxSource.volume = volume;
        this._sfxSource.playOneShot(clip, volume);
    }

    /** 设置音效音量（0-1） */
    setSFXVolume(volume: number): void {
        if (this._sfxSource) {
            this._sfxSource.volume = Math.max(0, Math.min(1, volume));
        }
    }

    // ── 资源管理 ──────────────────────────────────────────

    /**
     * 注册音频剪辑
     * 在 Cocos Creator 编辑器中通过属性绑定，或在代码中动态注册
     */
    registerBGM(track: BGMTrack, clip: AudioClip): void {
        this._bgmClips[track] = clip;
    }

    registerSFX(sfx: SFX, clip: AudioClip): void {
        this._sfxClips[sfx] = clip;
    }

    // ── 内部 ────────────────────────────────────────────────
}
