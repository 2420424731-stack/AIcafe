import { _decorator, Component, Label } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager } from '../core/GameManager';
import { SkillId } from '../data/SkillData';

const { ccclass, property } = _decorator;

@ccclass('GrowthUI')
export class GrowthUI extends Component {
    @property(Label)
    skillLabel: Label | null = null;

    @property(Label)
    achievementLabel: Label | null = null;

    onEnable(): void {
        EventBus.on(GameEvent.GameStateChanged, this.refresh);
        EventBus.on(GameEvent.SkillChanged, this.refresh);
        EventBus.on(GameEvent.AchievementUnlocked, this.refresh);
        this.refresh();
    }

    onDisable(): void {
        EventBus.off(GameEvent.GameStateChanged, this.refresh);
        EventBus.off(GameEvent.SkillChanged, this.refresh);
        EventBus.off(GameEvent.AchievementUnlocked, this.refresh);
    }

    refresh = (): void => {
        const game = GameManager.instance;
        if (!game) {
            return;
        }

        if (this.skillLabel) this.skillLabel.string = game.getSkillText();
        if (this.achievementLabel) this.achievementLabel.string = game.getAchievementText();
    };

    upgradeEloquence(): void {
        this.upgrade(SkillId.Eloquence);
    }

    upgradeCostControl(): void {
        this.upgrade(SkillId.CostControl);
    }

    upgradeTraffic(): void {
        this.upgrade(SkillId.Traffic);
    }

    upgradeTolerance(): void {
        this.upgrade(SkillId.Tolerance);
    }

    upgradeReputationBoost(): void {
        this.upgrade(SkillId.ReputationBoost);
    }

    private upgrade(skillId: SkillId): void {
        GameManager.instance?.upgradeSkill(skillId);
    }
}
