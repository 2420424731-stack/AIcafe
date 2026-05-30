import { _decorator, Component, Label } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('TutorialTipUI')
export class TutorialTipUI extends Component {
    @property(Label)
    tipLabel: Label | null = null;

    @property
    displaySeconds = 4;

    private hasShownPrepTip = false;
    private hasShownBusinessTip = false;
    private hasShownMessageTip = false;
    private hasShownResultTip = false;

    onEnable(): void {
        EventBus.on<GameManager>(GameEvent.GameStateChanged, this.handleGameStateChanged);
        EventBus.on(GameEvent.PlayerMessageSent, this.handlePlayerMessageSent);
        this.handleGameStateChanged(GameManager.instance);
    }

    onDisable(): void {
        EventBus.off<GameManager>(GameEvent.GameStateChanged, this.handleGameStateChanged);
        EventBus.off(GameEvent.PlayerMessageSent, this.handlePlayerMessageSent);
        this.unschedule(this.hideTip);
    }

    private handleGameStateChanged = (game?: GameManager | null): void => {
        if (!game) {
            return;
        }

        if (game.phase === GamePhase.Prep && !this.hasShownPrepTip) {
            this.hasShownPrepTip = true;
            this.showTip('新手提示：开店前先选择商品进货，并设置合适售价。');
            return;
        }

        if (game.phase === GamePhase.Business && !this.hasShownBusinessTip) {
            this.hasShownBusinessTip = true;
            this.showTip('新手提示：不同性格的顾客喜欢不同话术，先观察再推荐。');
            return;
        }

        if ((game.phase === GamePhase.Result || game.phase === GamePhase.GameOver) && !this.hasShownResultTip) {
            this.hasShownResultTip = true;
            this.showTip('新手提示：每天结算后，根据日报调整进货、定价和沟通策略。');
        }
    };

    private handlePlayerMessageSent = (): void => {
        if (this.hasShownMessageTip) {
            return;
        }

        this.hasShownMessageTip = true;
        this.showTip('新手提示：购买欲望会受你的话术影响，合适的表达更容易成交。');
    };

    private showTip(content: string): void {
        const label = this.tipLabel ?? this.getComponent(Label);
        if (!label) {
            return;
        }

        this.unschedule(this.hideTip);
        label.string = content;
        label.node.active = true;

        if (this.displaySeconds > 0) {
            this.scheduleOnce(this.hideTip, this.displaySeconds);
        }
    }

    private hideTip = (): void => {
        const label = this.tipLabel ?? this.getComponent(Label);
        if (label) {
            label.node.active = false;
        }
    };
}
