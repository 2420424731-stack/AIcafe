type EventHandler<T = unknown> = (payload: T) => void;

export enum GameEvent {
    GameStateChanged = 'game-state-changed',
    DayStarted = 'day-started',
    CustomerArrived = 'customer-arrived',
    CustomerDesireChanged = 'customer-desire-changed',
    CustomerLeft = 'customer-left',
    SaleCompleted = 'sale-completed',
    PlayerMessageSent = 'player-message-sent',
    DayEnded = 'day-ended',
    SkillChanged = 'skill-changed',
    AchievementUnlocked = 'achievement-unlocked',
    StarUpgraded = 'star-upgraded',
}

export class EventBus {
    private static listeners: Map<string, Set<EventHandler>> = new Map();

    static on<T>(eventName: GameEvent, handler: EventHandler<T>): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName)!.add(handler as EventHandler);
    }

    static off<T>(eventName: GameEvent, handler: EventHandler<T>): void {
        this.listeners.get(eventName)?.delete(handler as EventHandler);
    }

    static emit<T>(eventName: GameEvent, payload?: T): void {
        this.listeners.get(eventName)?.forEach((handler) => handler(payload));
    }

    static clear(): void {
        this.listeners.clear();
    }
}
