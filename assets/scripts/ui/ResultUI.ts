import { _decorator, Color, Component, Label, Overflow, UITransform } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { DayStats, GameManager, GamePhase } from '../core/GameManager';
import { ArtAssetBinder } from './ArtAssetBinder';

const { ccclass, property } = _decorator;

@ccclass('ResultUI')
export class ResultUI extends Component {
    @property(Label)
    resultLabel: Label | null = null;

    latestStats: DayStats | null = null;

    onEnable(): void {
        EventBus.on<DayStats>(GameEvent.DayEnded, this.showResult);
        this.applyArtAssets();

        const game = GameManager.instance;
        if (game?.phase === GamePhase.Result || game?.phase === GamePhase.GameOver) {
            this.showResult(game.todayStats);
        }
    }

    onDisable(): void {
        EventBus.off<DayStats>(GameEvent.DayEnded, this.showResult);
    }

    showResult = (stats: DayStats): void => {
        this.latestStats = stats;
        this.applyArtAssets();

        if (!this.resultLabel) {
            return;
        }

        const game = GameManager.instance;
        const targetReached = stats.profit >= stats.profitTarget;
        const conversionRate = this.getConversionRate(stats);
        const averageOrderValue = stats.deals > 0 ? stats.revenue / stats.deals : 0;
        const remainingInventory = this.getRemainingInventory();
        const resultLines = [
            `第 ${stats.day} 天结算`,
            `营收：${stats.revenue}`,
            `成本：${stats.cost}`,
            `报废成本：${stats.discardedCost}（未售库存保留到次日）`,
            `利润：${stats.profit}`,
            `利润目标：${stats.profitTarget}（${targetReached ? '已达成' : '未达成'}）`,
            `接待顾客：${stats.customers}`,
            `成交数：${stats.deals}`,
            `成交率：${this.formatPercent(conversionRate)}`,
            `客单价：${this.formatMoney(averageOrderValue)}`,
            `剩余库存：${remainingInventory} 件`,
            `声望变化：${stats.reputationDelta}`,
            `经营建议：${this.createBusinessAdvice(stats, conversionRate, remainingInventory)}`,
            `话术表现：${this.createConversationSummary(stats, conversionRate)}`,
        ];

        if (game?.phase === GamePhase.GameOver) {
            const reason = game.reputation <= 0 ? '店铺声望降至 0' : '连续 3 天净利润为负';
            resultLines.unshift('游戏结束');
            resultLines.push(`失败原因：${reason}`);
        }

        this.resultLabel.string = resultLines.join('\n');
    };

    private getConversionRate(stats: DayStats): number {
        if (stats.customers <= 0) {
            return 0;
        }

        return stats.deals / stats.customers;
    }

    private getRemainingInventory(): number {
        const game = GameManager.instance;
        if (!game) {
            return 0;
        }

        return game.inventory.reduce((total, stock) => total + Math.max(0, stock.amount), 0);
    }

    private createBusinessAdvice(stats: DayStats, conversionRate: number, remainingInventory: number): string {
        if (stats.profit < 0) {
            return remainingInventory > 0
                ? '今天亏损且库存偏多，明天先减少进货，并优先推荐库存商品。'
                : '今天亏损，明天控制进货成本，优先卖毛利更高的商品。';
        }

        if (conversionRate < 0.4) {
            return '成交率偏低，明天先把推荐话术说清楚，减少无效闲聊。';
        }

        if (remainingInventory >= Math.max(3, stats.deals)) {
            return '剩余库存较多，明天降低进货量，避免资金压在库存里。';
        }

        if (stats.profit < stats.profitTarget) {
            return '利润还没达标，明天尝试提高热销品售价或多推荐高客单商品。';
        }

        return '今天经营表现不错，明天可以适当增加热销商品库存。';
    }

    private createConversationSummary(stats: DayStats, conversionRate: number): string {
        const averageDesire = stats.customers > 0 ? stats.totalFinalDesire / stats.customers : 0;

        if (stats.deals === 0) {
            return '今天话术没有促成成交，需要更明确地推荐适合顾客的商品。';
        }

        if (averageDesire >= 75 && conversionRate >= 0.7) {
            return '今天话术很有说服力，大多数顾客都被顺利打动。';
        }

        if (stats.satisfiedCustomers >= stats.lostCustomers && conversionRate >= 0.5) {
            return '今天沟通整体稳定，但还可以把产品差异讲得更直接。';
        }

        if (stats.lostCustomers > stats.satisfiedCustomers) {
            return '今天有较多顾客没有被说服，回复要更贴合顾客性格。';
        }

        return '今天话术表现中规中矩，继续练习精准推荐会更容易成交。';
    }

    private formatPercent(value: number): string {
        return `${Math.round(value * 100)}%`;
    }

    private formatMoney(value: number): string {
        return value.toFixed(1);
    }

    nextDay(): void {
        const game = GameManager.instance;
        if (!game?.canGoNextDay()) {
            return;
        }

        game.nextDay();
    }

    private applyArtAssets(): void {
        const parentTransform = this.node.parent?.getComponent(UITransform);
        const width = parentTransform?.width || 1280;
        const height = parentTransform?.height || 720;
        this.node.setPosition(0, 0, 0);
        ArtAssetBinder.applySprite(this.node, 'resultPanel', width, height);

        if (this.resultLabel) {
            this.resultLabel.node.setPosition(0, 35, 0);
            this.resultLabel.node.getComponent(UITransform)?.setContentSize(500, 345);
            this.resultLabel.color = new Color(92, 61, 43, 255);
            this.resultLabel.fontSize = 16;
            this.resultLabel.lineHeight = 22;
            this.resultLabel.overflow = Overflow.SHRINK;
            this.resultLabel.enableWrapText = true;
        }

        const nextDayButton = this.node.getChildByName('NextDayButton');
        if (nextDayButton) {
            nextDayButton.setPosition(0, -285, 0);
            nextDayButton.getComponent(UITransform)?.setContentSize(150, 52);
        }
        ArtAssetBinder.applyButton(nextDayButton, 'primary');
    }
}
