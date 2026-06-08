import { sys } from 'cc';

/** 游戏设置数据 */
export interface GameSettings {
    bgmVolume: number;       // 0-1
    sfxVolume: number;       // 0-1
    aiStyle: 'concise' | 'detailed';  // AI 回复风格
    textSpeed: 'instant' | 'normal' | 'typewriter';  // 文字显示速度
    autoSave: boolean;       // 是否自动存档
}

const SETTINGS_KEY = 'aicafe_settings';

const DEFAULT_SETTINGS: GameSettings = {
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    aiStyle: 'concise',
    textSpeed: 'normal',
    autoSave: true,
};

/**
 * 设置管理器
 *
 * 持久化用户偏好设置到 localStorage。
 * 由 SettingsUI 读写，由 AudioManager / ChatUI 消费。
 */
export class SettingsManager {
    private static _cache: GameSettings | null = null;

    /** 获取当前设置（优先返回缓存，无缓存则加载默认） */
    static get(): GameSettings {
        if (!SettingsManager._cache) {
            SettingsManager._cache = SettingsManager.load();
        }
        return SettingsManager._cache!;
    }

    /** 保存设置 */
    static save(settings: Partial<GameSettings>): void {
        const current = SettingsManager.get();
        const updated = { ...current, ...settings };
        try {
            sys.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
            SettingsManager._cache = updated;
        } catch (error) {
            console.error('[SettingsManager] Save failed:', error);
        }
    }

    /** 重置为默认设置 */
    static reset(): void {
        SettingsManager._cache = { ...DEFAULT_SETTINGS };
        try {
            sys.localStorage.removeItem(SETTINGS_KEY);
        } catch {
            // ignore
        }
    }

    private static load(): GameSettings {
        try {
            const json = sys.localStorage.getItem(SETTINGS_KEY);
            if (json) {
                const data = JSON.parse(json);
                return { ...DEFAULT_SETTINGS, ...data };
            }
        } catch {
            // 损坏的设置 → 使用默认
        }
        return { ...DEFAULT_SETTINGS };
    }
}
