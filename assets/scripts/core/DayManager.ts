import { _decorator, Component } from 'cc';
import { GameManager } from './GameManager';
import { EventBus, GameEvent } from './EventBus';
import { CustomerData, CustomerPersonality, getUnlockedCustomers } from '../data/CustomerData';
import { SkillId } from '../data/SkillData';
import { AchievementId } from '../data/AchievementData';

const { ccclass, property } = _decorator;

const CUSTOMER_COUNT_BY_STAR: Record<number, { min: number; max: number }> = {
    1: { min: 3, max: 5 },
    2: { min: 4, max: 6 },
    3: { min: 5, max: 7 },
    4: { min: 6, max: 8 },
    5: { min: 6, max: 8 },
};

@ccclass('DayManager')
export class DayManager extends Component {
    @property
    minCustomers = 3;

    @property
    maxCustomers = 5;

    customersToday: CustomerData[] = [];
    currentCustomerIndex = -1;
    reputationDelta = 0;

    onEnable(): void {
        EventBus.on<{ currentDesire: number }>(GameEvent.CustomerLeft, this.handleCustomerLeft);
    }

    onDisable(): void {
        EventBus.off<{ currentDesire: number }>(GameEvent.CustomerLeft, this.handleCustomerLeft);
    }

    startBusinessDay(): void {
        const game = GameManager.instance;
        if (!game) {
            return;
        }

        this.customersToday = this.createCustomersForToday(game.star);
        this.currentCustomerIndex = -1;
        this.reputationDelta = 0;
        game.startBusiness();
        this.nextCustomer();

        this.checkViralMoment(game.star);
    }

    nextCustomer(): void {
        this.currentCustomerIndex += 1;

        if (this.currentCustomerIndex >= this.customersToday.length) {
            GameManager.instance?.finishDay(this.reputationDelta);
            return;
        }

        const customer = this.customersToday[this.currentCustomerIndex];
        const game = GameManager.instance;
        if (game) {
            game.todayStats.customers += 1;
        }

        EventBus.emit(GameEvent.CustomerArrived, customer);
    }

    addReputation(value: number): void {
        this.reputationDelta += value;
    }

    private handleCustomerLeft = (payload: { currentDesire: number }): void => {
        this.recordCustomerResult(payload.currentDesire);
        this.trackIntrovertCustomer(payload.currentDesire);
        this.addReputation(this.calculateReputationByDesire(payload.currentDesire));
        this.nextCustomer();
    };

    private recordCustomerResult(desire: number): void {
        const stats = GameManager.instance?.todayStats;
        if (!stats) {
            return;
        }

        stats.totalFinalDesire += desire;

        if (desire <= 40) {
            stats.lostCustomers += 1;
            return;
        }

        if (desire <= 60) {
            stats.neutralCustomers += 1;
            return;
        }

        stats.satisfiedCustomers += 1;
    }

    private trackIntrovertCustomer(desire: number): void {
        const customer = this.customersToday[this.currentCustomerIndex];
        if (!customer || customer.id !== CustomerPersonality.Introvert) {
            return;
        }

        if (desire > 40) {
            GameManager.instance?.incrementIntrovertServed();
        }
    }

    private calculateReputationByDesire(desire: number): number {
        const baseValue = desire <= 20 ? -50 : desire <= 40 ? -30 : desire <= 60 ? 0 : desire <= 80 ? 20 : 50;
        if (baseValue <= 0) {
            return baseValue;
        }

        const reputationBoostLevel = GameManager.instance?.getSkillLevel(SkillId.ReputationBoost) ?? 0;
        return Math.round(baseValue * (1 + reputationBoostLevel * 0.25));
    }

    private checkViralMoment(star: number): void {
        const range = CUSTOMER_COUNT_BY_STAR[Math.max(1, Math.min(5, star))];
        if (this.customersToday.length >= range.max) {
            GameManager.instance?.unlockAchievement(AchievementId.ViralMoment);
        }
    }

    private createCustomersForToday(star: number): CustomerData[] {
        const pool = getUnlockedCustomers(star);
        const count = this.getCustomerCount(star);
        const result: CustomerData[] = [];

        for (let i = 0; i < count; i += 1) {
            result.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        return result;
    }

    private getCustomerCount(star: number): number {
        const range = CUSTOMER_COUNT_BY_STAR[Math.max(1, Math.min(5, star))];
        const trafficLevel = GameManager.instance?.getSkillLevel(SkillId.Traffic) ?? 0;
        const max = range.max;
        const min = Math.min(range.min + trafficLevel, max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
