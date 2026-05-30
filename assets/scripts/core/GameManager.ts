import { _decorator, Component } from 'cc';
import { EventBus, GameEvent } from './EventBus';
import { AchievementId, ACHIEVEMENT_LIST, findAchievement } from '../data/AchievementData';
import { findProduct, getUnlockedProducts, ProductData } from '../data/ProductData';
import { findSkill, SkillId, SKILL_LIST } from '../data/SkillData';

const { ccclass, property } = _decorator;

const REPUTATION_GAME_OVER_START_DAY = 3;

export enum GamePhase {
    Prep = 'prep',
    Business = 'business',
    Result = 'result',
    GameOver = 'game-over',
}

export interface ProductStock {
    productId: string;
    amount: number;
    price: number;
}

export interface SellableProductOffer {
    product: ProductData;
    amount: number;
    price: number;
}

export interface DayStats {
    day: number;
    revenue: number;
    cost: number;
    profit: number;
    profitTarget: number;
    customers: number;
    deals: number;
    satisfiedCustomers: number;
    neutralCustomers: number;
    lostCustomers: number;
    totalFinalDesire: number;
    reputationDelta: number;
    discardedCost: number;
}

@ccclass('GameManager')
export class GameManager extends Component {
    static instance: GameManager | null = null;

    @property
    startMoney = 300;

    money = 300;
    reputation = 100;
    star = 1;
    day = 1;
    phase = GamePhase.Prep;
    negativeProfitDays = 0;
    skillPoints = 0;
    introvertServed = 0;

    inventory: ProductStock[] = [];
    skills: Partial<Record<SkillId, number>> = {};
    unlockedAchievements: Set<AchievementId> = new Set();
    todayStats: DayStats = this.createEmptyStats();

    onLoad(): void {
        GameManager.instance = this;
        this.resetGame();
    }

    resetGame(): void {
        this.money = this.startMoney;
        this.reputation = 100;
        this.star = 1;
        this.day = 1;
        this.phase = GamePhase.Prep;
        this.negativeProfitDays = 0;
        this.skillPoints = 0;
        this.introvertServed = 0;
        this.inventory = [];
        this.skills = {};
        this.unlockedAchievements = new Set();
        this.todayStats = this.createEmptyStats();
        EventBus.emit(GameEvent.GameStateChanged, this);
    }

    getUnlockedProducts(): ProductData[] {
        return getUnlockedProducts(this.star);
    }

    getSellableProducts(): ProductData[] {
        return this.inventory
            .filter((stock) => stock.amount > 0)
            .map((stock) => findProduct(stock.productId))
            .filter((product): product is ProductData => !!product);
    }

    getSellableProductOffers(): SellableProductOffer[] {
        return this.inventory
            .filter((stock) => stock.amount > 0)
            .map((stock) => {
                const product = findProduct(stock.productId);
                return product ? { product, amount: stock.amount, price: stock.price } : null;
            })
            .filter((offer): offer is SellableProductOffer => !!offer);
    }

    getProductStockAmount(productId: string): number {
        return this.inventory.find((item) => item.productId === productId)?.amount ?? 0;
    }

    getProductPrice(productId: string): number | null {
        return this.inventory.find((item) => item.productId === productId)?.price ?? null;
    }

    getDailyProfitTarget(star = this.star, day = this.day): number {
        const baseTargets = [0, 45, 85, 140, 220, 320];
        const baseTarget = baseTargets[Math.max(1, Math.min(5, star))];
        const growth = Math.min(120, Math.max(0, day - 1) * 8);
        return baseTarget + growth;
    }

    buyProduct(productId: string, amount: number, price?: number): boolean {
        const product = findProduct(productId);
        if (!product || !Number.isFinite(amount) || amount <= 0 || product.unlockStar > this.star) {
            return false;
        }

        const normalizedAmount = Math.floor(amount);
        if (normalizedAmount <= 0) {
            return false;
        }

        const unitCost = this.getActualProductCost(product);
        const cost = unitCost * normalizedAmount;
        if (this.money < cost) {
            return false;
        }

        this.money -= cost;
        this.todayStats.cost += cost;

        const stock = this.getOrCreateStock(productId, price ?? product.suggestedPrice);
        stock.amount += normalizedAmount;
        if (price !== undefined && Number.isFinite(price) && price > 0) {
            stock.price = Math.floor(price);
        }

        EventBus.emit(GameEvent.GameStateChanged, this);
        return true;
    }

    setProductPrice(productId: string, price: number): void {
        const product = findProduct(productId);
        if (!product || !Number.isFinite(price) || price <= 0) {
            return;
        }

        const stock = this.getOrCreateStock(productId, product.suggestedPrice);
        stock.price = Math.floor(price);
        EventBus.emit(GameEvent.GameStateChanged, this);
    }

    completeSale(productId: string, amount: number): boolean {
        const stock = this.inventory.find((item) => item.productId === productId);
        if (!stock || !Number.isFinite(amount) || amount <= 0 || stock.amount < amount) {
            return false;
        }

        const normalizedAmount = Math.floor(amount);
        if (normalizedAmount <= 0) {
            return false;
        }

        if (stock.amount < normalizedAmount) {
            return false;
        }

        stock.amount -= normalizedAmount;
        const income = stock.price * normalizedAmount;
        this.money += income;
        this.todayStats.revenue += income;
        this.todayStats.deals += 1;
        this.unlockAchievement(AchievementId.FirstSale);

        EventBus.emit(GameEvent.SaleCompleted, { productId, amount: normalizedAmount, income });
        EventBus.emit(GameEvent.GameStateChanged, this);
        return true;
    }

    startBusiness(): void {
        this.phase = GamePhase.Business;
        EventBus.emit(GameEvent.GameStateChanged, this);
    }

    finishDay(reputationDelta: number): DayStats {
        const previousStar = this.star;
        const discardedCost = this.discardFreshProducts();
        this.todayStats.discardedCost = discardedCost;
        this.todayStats.profit = this.todayStats.revenue - this.todayStats.cost;
        this.todayStats.profitTarget = this.getDailyProfitTarget(previousStar, this.day);
        this.todayStats.reputationDelta = reputationDelta;

        this.reputation = Math.max(0, this.reputation + reputationDelta);
        this.updateStarFromReputation(previousStar);
        this.checkDayEndAchievements();
        this.negativeProfitDays = this.todayStats.profit < 0 ? this.negativeProfitDays + 1 : 0;
        this.phase = this.shouldGameOver() ? GamePhase.GameOver : GamePhase.Result;

        EventBus.emit(GameEvent.DayEnded, this.todayStats);
        EventBus.emit(GameEvent.GameStateChanged, this);
        return this.todayStats;
    }

    nextDay(): void {
        this.day += 1;
        this.phase = GamePhase.Prep;
        this.todayStats = this.createEmptyStats();
        EventBus.emit(GameEvent.DayStarted, this.day);
        EventBus.emit(GameEvent.GameStateChanged, this);
    }

    canGoNextDay(): boolean {
        if (this.phase === GamePhase.Result) {
            return true;
        }

        return this.phase === GamePhase.GameOver
            && this.day < REPUTATION_GAME_OVER_START_DAY
            && this.negativeProfitDays < 3;
    }

    getSkillLevel(skillId: SkillId): number {
        return this.skills[skillId] ?? 0;
    }

    upgradeSkill(skillId: SkillId): boolean {
        const skill = findSkill(skillId);
        if (!skill || this.skillPoints <= 0) {
            return false;
        }

        const currentLevel = this.getSkillLevel(skillId);
        if (currentLevel >= skill.maxLevel) {
            return false;
        }

        this.skills[skillId] = currentLevel + 1;
        this.skillPoints -= 1;
        EventBus.emit(GameEvent.SkillChanged, this);
        EventBus.emit(GameEvent.GameStateChanged, this);
        return true;
    }

    getSkillText(): string {
        const lines = [`技能点：${this.skillPoints}`];
        SKILL_LIST.forEach((skill) => {
            lines.push(`${skill.name} Lv.${this.getSkillLevel(skill.id)}/${skill.maxLevel}：${skill.effectText}`);
        });
        return lines.join('\n');
    }

    getAchievementText(): string {
        return ACHIEVEMENT_LIST.map((achievement) => {
            const status = this.unlockedAchievements.has(achievement.id) ? '已完成' : '未完成';
            return `${status}｜${achievement.name}：${achievement.description}（${achievement.rewardText}）`;
        }).join('\n');
    }

    unlockAchievement(achievementId: AchievementId): boolean {
        if (this.unlockedAchievements.has(achievementId)) {
            return false;
        }

        const achievement = findAchievement(achievementId);
        if (!achievement) {
            return false;
        }

        this.unlockedAchievements.add(achievementId);
        if (achievement.reward.money) this.money += achievement.reward.money;
        if (achievement.reward.reputation) this.reputation += achievement.reward.reputation;
        if (achievement.reward.skillPoints) {
            this.skillPoints += achievement.reward.skillPoints;
            EventBus.emit(GameEvent.SkillChanged, this);
        }

        this.updateStarFromReputation(this.star);

        EventBus.emit(GameEvent.AchievementUnlocked, achievement);
        EventBus.emit(GameEvent.GameStateChanged, this);
        return true;
    }

    getNextStarThreshold(): number {
        if (this.star >= 5) return this.reputation;
        return [0, 400, 1000, 2500, 5000][this.star];
    }

    incrementIntrovertServed(): void {
        this.introvertServed += 1;
        if (this.introvertServed >= 5) {
            this.unlockAchievement(AchievementId.IntrovertFriend);
        }
    }

    private getOrCreateStock(productId: string, price: number): ProductStock {
        let stock = this.inventory.find((item) => item.productId === productId);
        if (!stock) {
            stock = { productId, amount: 0, price };
            this.inventory.push(stock);
        }

        return stock;
    }

    private discardFreshProducts(): number {
        return 0;
    }

    private getActualProductCost(product: ProductData): number {
        const costControlLevel = this.getSkillLevel(SkillId.CostControl);
        const discount = Math.min(0.3, costControlLevel * 0.1);
        return Math.max(1, Math.floor(product.cost * (1 - discount)));
    }

    private updateStarFromReputation(previousStar: number): void {
        this.star = this.calculateStar();
        if (this.star > previousStar) {
            this.skillPoints += this.star - previousStar;
            EventBus.emit(GameEvent.SkillChanged, this);
            EventBus.emit(GameEvent.StarUpgraded, { previousStar, newStar: this.star });
        }
    }

    private checkDayEndAchievements(): void {
        if (this.todayStats.discardedCost === 0 && this.todayStats.deals > 0) {
            this.unlockAchievement(AchievementId.ZeroWaste);
        }

        if (this.todayStats.profit >= 1000) {
            this.unlockAchievement(AchievementId.DailyKing);
        }

        if (this.day >= 7 && this.reputation >= 500) {
            this.unlockAchievement(AchievementId.SteadyWeek);
        }

        if (this.star >= 5) {
            this.unlockAchievement(AchievementId.FiveStar);
        }
    }

    private calculateStar(): number {
        if (this.reputation >= 5000) return 5;
        if (this.reputation >= 2500) return 4;
        if (this.reputation >= 1000) return 3;
        if (this.reputation >= 400) return 2;
        return 1;
    }

    private shouldGameOver(): boolean {
        const reputationFailed = this.reputation <= 0 && this.day >= REPUTATION_GAME_OVER_START_DAY;
        return reputationFailed || this.negativeProfitDays >= 3;
    }

    private createEmptyStats(): DayStats {
        return {
            day: this.day,
            revenue: 0,
            cost: 0,
            profit: 0,
            profitTarget: this.getDailyProfitTarget(),
            customers: 0,
            deals: 0,
            satisfiedCustomers: 0,
            neutralCustomers: 0,
            lostCustomers: 0,
            totalFinalDesire: 0,
            reputationDelta: 0,
            discardedCost: 0,
        };
    }
}
