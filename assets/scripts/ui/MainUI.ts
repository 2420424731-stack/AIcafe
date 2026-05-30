import { _decorator, Color, Component, Label, Node, UITransform } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';
import { ArtAssetBinder } from './ArtAssetBinder';

const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends Component {
    @property(Label)
    moneyLabel: Label | null = null;

    @property(Label)
    dayLabel: Label | null = null;

    @property(Label)
    reputationLabel: Label | null = null;

    @property(Label)
    phaseLabel: Label | null = null;

    @property(Node)
    shopPrepPanel: Node | null = null;

    @property(Node)
    chatPanel: Node | null = null;

    @property(Node)
    resultPanel: Node | null = null;

    onEnable(): void {
        EventBus.on(GameEvent.GameStateChanged, this.refresh);
        this.cachePhasePanels();
        this.applyArtAssets();
        this.refresh();
    }

    onDisable(): void {
        EventBus.off(GameEvent.GameStateChanged, this.refresh);
    }

    refresh = (): void => {
        const game = GameManager.instance;
        if (!game) {
            return;
        }

        if (this.moneyLabel) this.moneyLabel.string = `资金：${game.money}`;
        if (this.dayLabel) this.dayLabel.string = `第 ${game.day} 天`;
        if (this.reputationLabel) this.reputationLabel.string = this.formatReputation(game);
        if (this.phaseLabel) this.phaseLabel.string = `阶段：${game.phase}`;
        this.applyArtAssets();
        this.refreshPhasePanels(game.phase);
    };

    private formatReputation(game: GameManager): string {
        if (game.star >= 5) {
            return `声望：${game.reputation}（⭐5 已满级）`;
        }

        const nextThreshold = game.getNextStarThreshold();
        return `声望：${game.reputation}/${nextThreshold}（⭐${game.star} → ${game.star + 1}）`;
    }

    private cachePhasePanels(): void {
        const parent = this.node.parent;
        if (!parent) {
            return;
        }

        this.shopPrepPanel = this.shopPrepPanel ?? parent.getChildByName('ShopPrepPanel');
        this.chatPanel = this.chatPanel ?? parent.getChildByName('ChatPanel');
        this.resultPanel = this.resultPanel ?? parent.getChildByName('ResultPanel');
    }

    private refreshPhasePanels(phase: GamePhase): void {
        if (!this.shopPrepPanel || !this.chatPanel || !this.resultPanel) {
            this.cachePhasePanels();
        }

        if (this.shopPrepPanel) this.shopPrepPanel.active = phase === GamePhase.Prep || phase === GamePhase.Business;
        if (this.chatPanel) this.chatPanel.active = phase === GamePhase.Business;
        if (this.resultPanel) this.resultPanel.active = phase === GamePhase.Result || phase === GamePhase.GameOver;
    }

    private applyArtAssets(): void {
        const parent = this.node.parent;
        if (!parent) {
            return;
        }

        const canvasTransform = parent.getComponent(UITransform);
        const width = canvasTransform?.width || 1280;
        const height = canvasTransform?.height || 720;
        ArtAssetBinder.ensureSpriteNode(parent, 'ArtMainBackground', 'mainBackground', width, height, 0, 0, 0);
        ArtAssetBinder.ensureSpriteNode(parent, 'ArtTopStatusBar', 'topStatusBar', 1160, 64, 0, this.node.position.y, 1);

        ArtAssetBinder.applySprite(this.shopPrepPanel, 'prepPanel', 440, 480);
        ArtAssetBinder.applySprite(this.chatPanel, 'chatPanel', 650, 500);
        if (this.resultPanel) {
            this.resultPanel.setPosition(0, 0, 0);
            ArtAssetBinder.applySprite(this.resultPanel, 'resultPanel', width, height);
        }

        ArtAssetBinder.applyButton(this.shopPrepPanel?.getChildByName('StartBusinessButton') ?? null, 'primary');
        ArtAssetBinder.applyButton(this.chatPanel?.getChildByName('SendButton') ?? null, 'secondary');
        ArtAssetBinder.applyButton(this.resultPanel?.getChildByName('NextDayButton') ?? null, 'primary');

        this.hideStatusIcons();
        this.styleStatusLabel(this.moneyLabel);
        this.styleStatusLabel(this.dayLabel);
        this.styleStatusLabel(this.reputationLabel);
        this.styleStatusLabel(this.phaseLabel);
    }

    private hideStatusIcons(): void {
        ['MoneyIcon', 'DayIcon', 'ReputationIcon', 'PhaseIcon'].forEach((nodeName) => {
            const iconNode = this.node.getChildByName(nodeName);
            if (iconNode) {
                iconNode.active = false;
            }
        });
    }

    private styleStatusLabel(label: Label | null): void {
        if (!label) {
            return;
        }

        label.color = new Color(255, 248, 232, 255);
        label.fontSize = label === this.phaseLabel ? 18 : 20;
        label.lineHeight = 28;
    }
}
