import { _decorator, Component, Node, Label, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';
import { AnimationHelper } from '../core/AnimationHelper';
import { EventBus, GameEvent } from '../core/EventBus';

const { ccclass, property } = _decorator;

/**
 * 游戏结束 / 胜利画面
 *
 * 显示在 ResultPanel 内部，当游戏结束（失败或胜利）时激活。
 * 需要挂载在 ResultPanel 的一个子节点上。
 */
@ccclass('GameOverUI')
export class GameOverUI extends Component {
    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    statsLabel: Label | null = null;

    @property(Label)
    ratingLabel: Label | null = null;

    @property(Node)
    newGameBtn: Node | null = null;

    @property(Node)
    titleBtn: Node | null = null;

    /** 是否胜利（否则为失败） */
    private _isVictory = false;

    onLoad(): void {
        this._boundStateChange = this._onStateChange.bind(this);
        EventBus.on(GameEvent.GameStateChanged, this._boundStateChange);
    }

    onDestroy(): void {
        if (this._boundStateChange) {
            EventBus.off(GameEvent.GameStateChanged, this._boundStateChange);
        }
    }

    private _boundStateChange: (() => void) | null = null;

    private _onStateChange(): void {
        const gm = GameManager.instance;
        if (!gm) return;

        if (gm.isGameOver) {
            this._isVictory = gm.day >= 30 && gm.reputation >= 1000 && gm.star >= 4;
            this.show();
        }
    }

    /** 显示游戏结束画面 */
    show(): void {
        this.node.active = true;
        this._refreshContent();
        AnimationHelper.fadeIn(this.node, 0.5);
    }

    /** 隐藏 */
    hide(): void {
        AnimationHelper.fadeOut(this.node, 0.3).then(() => {
            this.node.active = false;
        });
    }

    // ── 内容刷新 ────────────────────────────────────────────

    private _refreshContent(): void {
        const gm = GameManager.instance;
        if (!gm) return;

        // 标题
        if (this.titleLabel) {
            this.titleLabel.string = this._isVictory ? '🎉 恭喜！街角传奇！' : '💼 店铺结业';
        }

        // 统计
        if (this.statsLabel) {
            this.statsLabel.string = [
                `经营天数：${gm.day} 天`,
                `最终资金：${gm.money} 元`,
                `最终声望：${gm.reputation}`,
                `星级评价：${'⭐'.repeat(gm.star)}`,
                `累计接待：${gm.totalCustomers} 位顾客`,
                `累计成交：${gm.totalDeals} 笔`,
                `解锁成就：${gm.unlockedAchievements.size} 个`,
            ].join('\n');
        }

        // 评级
        if (this.ratingLabel) {
            this.ratingLabel.string = this._getRating();
        }
    }

    private _getRating(): string {
        const gm = GameManager.instance;
        if (!gm) return '';

        if (this._isVictory) {
            if (gm.star >= 5) return '🏆 五星传奇店长';
            return '🌟 成功经营！';
        }

        // 失败评级
        if (gm.day <= 3) return '刚起步就结束了...再接再厉！';
        if (gm.day <= 7) return '第一周的教训，下次会更好。';
        if (gm.day <= 14) return '半个月的经营，有些遗憾。';
        return '你已经尽力了，这是一段宝贵的经历。';
    }

    // ── 按钮回调 ────────────────────────────────────────────

    /** "再来一局" */
    onNewGame(): void {
        const gm = GameManager.instance;
        if (!gm) return;

        // 清除当前存档槽
        const latestSlot = SaveManager.getLatestSlot();
        SaveManager.deleteSlot(latestSlot);

        gm.resetGame();
        gm.node.emit('new-game');
    }

    /** "返回标题" */
    onTitle(): void {
        director.loadScene('Title');
    }
}
