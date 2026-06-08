import { sys } from 'cc';

/**
 * 存档数据 Schema（v1）
 * 注意：修改此结构时需更新 CURRENT_VERSION 并添加迁移逻辑
 */
export interface SaveData {
    version: number;
    timestamp: number;
    slotLabel: string;
    // 经营状态
    money: number;
    reputation: number;
    star: number;
    day: number;
    skillPoints: number;
    skills: Record<string, number>;
    inventory: { productId: string; amount: number; price: number }[];
    unlockedAchievements: string[];
    negativeProfitDays: number;
    // 统计
    totalCustomers: number;
    totalRevenue: number;
    totalDeals: number;
    totalSpoilageCost: number;
    playTimeSeconds: number;
}

const CURRENT_VERSION = 1;
const SAVE_PREFIX = 'aicafe_save_';
const MAX_SLOTS = 3;

/**
 * 存档管理器
 *
 * 使用 sys.localStorage（Cocos Creator 的 localStorage 封装）持久化游戏进度。
 * 支持 3 个存档槽，每日结算后自动存档（由 GameManager 调用）。
 *
 * 用法：
 *   SaveManager.save(0, gameManager.toSaveData());
 *   const data = SaveManager.load(0);
 *   SaveManager.deleteSlot(0);
 *   const slots = SaveManager.listSlots();
 */
export class SaveManager {
    /**
     * 保存到指定槽位
     */
    static save(slot: number, data: Omit<SaveData, 'version' | 'timestamp' | 'slotLabel'>): boolean {
        if (slot < 0 || slot >= MAX_SLOTS) return false;

        try {
            const saveData: SaveData = {
                ...data,
                version: CURRENT_VERSION,
                timestamp: Date.now(),
                slotLabel: `存档 ${slot + 1}`,
            };
            const json = JSON.stringify(saveData);
            sys.localStorage.setItem(`${SAVE_PREFIX}${slot}`, json);
            return true;
        } catch (error) {
            console.error(`[SaveManager] Save slot ${slot} failed:`, error);
            return false;
        }
    }

    /**
     * 从指定槽位读取存档
     * 自动执行 schema 迁移
     */
    static load(slot: number): SaveData | null {
        if (slot < 0 || slot >= MAX_SLOTS) return null;

        try {
            const json = sys.localStorage.getItem(`${SAVE_PREFIX}${slot}`);
            if (!json) return null;

            const data = JSON.parse(json) as SaveData;
            return SaveManager.migrate(data);
        } catch (error) {
            console.error(`[SaveManager] Load slot ${slot} failed:`, error);
            return null;
        }
    }

    /**
     * 删除指定槽位
     */
    static deleteSlot(slot: number): void {
        sys.localStorage.removeItem(`${SAVE_PREFIX}${slot}`);
    }

    /**
     * 列出所有有效存档槽（含摘要信息）
     */
    static listSlots(): { slot: number; label: string; day: number; money: number; timestamp: number }[] {
        const slots: { slot: number; label: string; day: number; money: number; timestamp: number }[] = [];

        for (let i = 0; i < MAX_SLOTS; i++) {
            const json = sys.localStorage.getItem(`${SAVE_PREFIX}${i}`);
            if (!json) continue;

            try {
                const data = JSON.parse(json) as SaveData;
                slots.push({
                    slot: i,
                    label: `存档 ${i + 1}`,
                    day: data.day,
                    money: data.money,
                    timestamp: data.timestamp,
                });
            } catch {
                // 跳过损坏的存档
            }
        }

        return slots;
    }

    /**
     * 检查是否有任何存档
     */
    static hasAnySave(): boolean {
        return SaveManager.listSlots().length > 0;
    }

    /**
     * 获取最近使用的存档槽
     */
    static getLatestSlot(): number {
        const slots = SaveManager.listSlots();
        if (slots.length === 0) return 0;

        slots.sort((a, b) => b.timestamp - a.timestamp);
        return slots[0].slot;
    }

    /**
     * Schema 迁移
     * 当 SaveData 结构变化时，在此添加版本间迁移逻辑
     */
    private static migrate(data: SaveData): SaveData {
        // v0 → v1: 初始版本，无需迁移
        if (!data.version || data.version < 1) {
            data.version = 1;
        }
        return data;
    }
}
