import { _decorator, Component } from 'cc';
import { GameManager } from '../core/GameManager';
import type { SellableProductOffer } from '../core/GameManager';
import { CustomerData, CustomerPersonality } from '../data/CustomerData';
import { ProductData } from '../data/ProductData';

const { ccclass, property } = _decorator;

export enum PurchaseDecision {
    Pending = 'pending',
    Leave = 'leave',
    Buy = 'buy',
}

export interface AIResponse {
    message: string;
    desireDelta: number;
    currentDesire: number;
    decision: PurchaseDecision;
    productId: string | null;
    reason: string;
}

/** 单轮对话记录 */
export interface ConversationTurn {
    role: 'player' | 'customer' | 'system';
    message: string;
    desireAfter: number;
    decision?: PurchaseDecision;
}

/** 顾客会话追踪 */
export interface CustomerSession {
    customerId: string;
    customerName: string;
    turns: ConversationTurn[];
    startDesire: number;
    finalDesire: number;
    finalDecision: PurchaseDecision;
    purchasedProductId: string | null;
}

// ── 紧急兜底回复模板（仅 API 彻底失败时使用） ──────────────

interface EmergencyTemplate {
    positive: string[];
    neutral: string[];
    negative: string[];
    buy: string[];
    leave: string[];
}

const EMERGENCY_TEMPLATES: Record<CustomerPersonality, EmergencyTemplate> = {
    [CustomerPersonality.Introvert]: {
        positive: ['嗯...这样说我就比较放心了。', '简单一点挺好的，我想再了解一下。'],
        neutral: ['嗯……我再想一下。', '可以再简单说一句吗？'],
        negative: ['有点太热情了...我想先冷静一下。', '不好意思，我有点紧张。'],
        buy: ['那我就要这个吧，谢谢。', '听起来比较稳妥，我试试看。'],
        leave: ['不好意思，我还是先不买了。', '我再想想，先走了。'],
    },
    [CustomerPersonality.Expert]: {
        positive: ['说得挺具体的，听起来还算专业。', '这个描述有细节，我愿意继续听。'],
        neutral: ['还有没有更明确的口感区别？', '能再说清楚一点吗？'],
        negative: ['这个说法太笼统了。', '如果只是随便推荐，我就没什么兴趣了。'],
        buy: ['细节说清楚了，那我买这个。', '可以，就按你说的这款来。'],
        leave: ['信息不够准确，我先不买了。', '今天先算了。'],
    },
    [CustomerPersonality.Artistic]: {
        positive: ['这个描述有画面感，我挺喜欢的。', '听起来很适合慢慢喝。'],
        neutral: ['氛围不错，但我还想再感受一下。', '能再讲讲它特别的地方吗？'],
        negative: ['这样说有点太功利了。', '我没什么感觉。'],
        buy: ['那就它吧，听起来很有意思。', '这个感觉对了，我想试试。'],
        leave: ['今天的感觉不太对，我先走了。', '我再去别处看看。'],
    },
    [CustomerPersonality.Social]: {
        positive: ['哈哈，你这么一说我就有兴趣了。', '挺会推荐的，我感觉能常来。'],
        neutral: ['行，那你再给我唠两句。', '还有啥招牌的？'],
        negative: ['你这也太冷淡了吧。', '这么敷衍我可不太想买。'],
        buy: ['行，就冲你这推荐，我来一份。', '好嘞，那我就点这个。'],
        leave: ['今天聊得不太舒服，我先撤了。', '算啦，下次再说。'],
    },
    [CustomerPersonality.Worker]: {
        positive: ['能快点就行，那我就要这个。', '直接明了，可以。'],
        neutral: ['我赶时间，能不能直接推荐一个？', '别太复杂，哪个最快？'],
        negative: ['太慢了，我可能来不及。', '说太多了，我先不等了。'],
        buy: ['就这个，帮我打包。', '可以，马上做的话我买。'],
        leave: ['来不及了，我先走。', '太耽误时间了。'],
    },
    [CustomerPersonality.Hesitant]: {
        positive: ['你这样帮我缩小范围，我就好选多了。', '那我更倾向这个了。'],
        neutral: ['我还是有点纠结，你能直接建议一个吗？', '两个里面你更推荐哪个？'],
        negative: ['你让我自己选，我更纠结了。', '选择太多了，我有点乱。'],
        buy: ['好，那我听你的选这个。', '就按你的建议来吧。'],
        leave: ['我还是决定不了，先不买了。', '今天先算了，我再想想。'],
    },
};

@ccclass('AIManager')
export class AIManager extends Component {
    @property
    apiUrl = '/api/chat';

    @property
    aiTimeoutMs = 8000;

    @property
    maxRetries = 2;

    /** 当前顾客的会话记录 */
    private _currentSession: CustomerSession | null = null;

    /** 所有已完成会话记录（用于结算页面的回顾展示） */
    private _completedSessions: CustomerSession[] = [];

    /**
     * 核心入口：处理玩家消息，返回 AI 响应。
     * 始终尝试调用真实 AI API，失败时回退到紧急兜底模板。
     */
    async reply(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision = false,
        turnCount = 0,
    ): Promise<AIResponse> {
        // 初始化会话（新顾客时）
        if (!this._currentSession || this._currentSession.customerId !== customer.id) {
            this._currentSession = {
                customerId: customer.id,
                customerName: customer.name,
                turns: [],
                startDesire: currentDesire,
                finalDesire: currentDesire,
                finalDecision: PurchaseDecision.Pending,
                purchasedProductId: null,
            };
        }

        try {
            const response = await this.requestWithRetry(
                customer,
                playerMessage,
                currentDesire,
                products,
                forceDecision,
                turnCount,
            );

            // 记录会话
            this.recordTurn(playerMessage, response);

            return response;
        } catch (error) {
            console.warn('[AIManager] All AI attempts failed, using emergency fallback.', error);
            return this.createEmergencyFallback(customer, playerMessage, currentDesire, products, forceDecision);
        }
    }

    /** 获取已完成会话记录（结算页面使用） */
    get completedSessions(): readonly CustomerSession[] {
        return this._completedSessions;
    }

    /** 结束当前顾客会话 */
    finishCurrentSession(): void {
        if (this._currentSession) {
            this._currentSession.finalDesire = this._currentSession.turns.length > 0
                ? this._currentSession.turns[this._currentSession.turns.length - 1].desireAfter
                : this._currentSession.startDesire;

            const lastTurn = this._currentSession.turns[this._currentSession.turns.length - 1];
            this._currentSession.finalDecision = lastTurn?.decision ?? PurchaseDecision.Leave;
            this._currentSession.purchasedProductId = lastTurn?.decision === PurchaseDecision.Buy
                ? (lastTurn as any).productId ?? null
                : null;

            this._completedSessions.push(this._currentSession);
            this._currentSession = null;
        }
    }

    /** 重置所有会话数据（新游戏时调用） */
    resetSessions(): void {
        this._currentSession = null;
        this._completedSessions = [];
    }

    // ── AI 请求 ────────────────────────────────────────────

    private async requestWithRetry(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
        turnCount: number,
    ): Promise<AIResponse> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.requestRealAI(
                    customer,
                    playerMessage,
                    currentDesire,
                    products,
                    forceDecision,
                    turnCount,
                    attempt,
                );
            } catch (error) {
                lastError = error as Error;
                console.warn(`[AIManager] Attempt ${attempt + 1}/${this.maxRetries + 1} failed: ${lastError.message}`);

                if (attempt < this.maxRetries) {
                    // 指数退避：1s, 2s, 4s
                    await this.delay(1000 * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('all retry attempts failed');
    }

    private async requestRealAI(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
        turnCount: number,
        attempt: number,
    ): Promise<AIResponse> {
        const runtime = globalThis as unknown as { fetch?: (url: string, options: Record<string, unknown>) => Promise<any> };
        if (typeof runtime.fetch !== 'function') {
            throw new Error('fetch is not available');
        }

        const payload = {
            customer: {
                id: customer.id,
                name: customer.name,
                displayName: customer.displayName,
                traits: customer.traits,
                conversationPreference: customer.conversationPreference,
                likes: customer.likes,
                dislikes: customer.dislikes,
                likesKeywords: customer.likesKeywords,
                dislikesKeywords: customer.dislikesKeywords,
                preferredProductTags: customer.preferredProductTags,
                decisionStyle: customer.decisionStyle,
                priceSensitivity: customer.priceSensitivity,
                patience: customer.patience,
            },
            playerMessage,
            currentDesire,
            forceDecision,
            turnCount: Math.max(0, Math.floor(turnCount)),
            dayNumber: GameManager.instance?.day ?? 1,
            products: products.map((offer) => ({
                id: offer.product.id,
                name: offer.product.name,
                tags: offer.product.tags,
                description: offer.product.description,
                suggestedPrice: offer.product.suggestedPrice,
                cost: offer.product.cost,
                amount: offer.amount,
                price: offer.price,
            })),
        };

        const timeoutMs = this.aiTimeoutMs + attempt * 2000; // 每次重试增加超时
        const data = await this.withTimeout(
            (async () => {
                const response = await runtime.fetch!(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response || !response.ok) {
                    const errorText = await response?.text?.().catch(() => '') ?? '';
                    throw new Error(`HTTP ${response?.status ?? 'unknown'}: ${errorText.slice(0, 100)}`);
                }

                return response.json();
            })(),
            timeoutMs,
        );

        return this.parseAIResponse(data, products);
    }

    // ── 响应解析 ────────────────────────────────────────────

    private parseAIResponse(data: unknown, products: SellableProductOffer[]): AIResponse {
        const source = this.unwrapAIResponse(data);
        if (typeof source === 'string') {
            return this.parseTextAIResponse(source, products);
        }

        if (!source || typeof source !== 'object') {
            throw new Error('invalid AI response format');
        }

        const record = source as Record<string, unknown>;
        const message = this.pickString(record, ['message', 'content', 'text', 'dialogue', '对话内容']);
        const desireDelta = this.pickNumber(record, ['desireDelta', 'delta', 'desire_delta', '欲望变动值']);
        const currentDesire = this.pickNumber(record, ['currentDesire', 'desire', 'current_desire', '当前购买欲望']);
        const decision = this.normalizeDecision(this.pickString(record, ['decision', 'purchaseDecision', 'purchase_decision', '购买决策']));
        const reason = this.pickString(record, ['reason', '原因', 'explanation', '理由']);
        const productId = this.normalizeProductId(
            this.pickNullableString(record, ['productId', 'product_id', 'product', '商品ID']),
            `${message} ${reason}`,
            products,
        );

        return this.validateAIResponse({ message, desireDelta, currentDesire, decision, productId, reason }, products);
    }

    private unwrapAIResponse(data: unknown): unknown {
        if (!data || typeof data !== 'object') return data;
        const record = data as Record<string, unknown>;
        return record.reply ?? record.result ?? record.response ?? record.data ?? data;
    }

    private parseTextAIResponse(text: string, products: SellableProductOffer[]): AIResponse {
        const message = this.extractLabeledValue(text, '对话内容') ?? '';
        const desireDelta = Number(this.extractLabeledValue(text, '欲望变动值'));
        const currentDesire = Number(this.extractLabeledValue(text, '当前购买欲望'));
        const decisionText = this.extractLabeledValue(text, '购买决策') ?? '';
        const decision = this.normalizeDecision(decisionText);
        const reason = this.extractLabeledValue(text, '原因') ?? this.extractLabeledValue(text, '理由') ?? '模型返回了文本格式结果';
        const productId = this.normalizeProductId(null, `${message} ${decisionText} ${reason}`, products);

        return this.validateAIResponse({ message, desireDelta, currentDesire, decision, productId, reason }, products);
    }

    private validateAIResponse(response: AIResponse, products: SellableProductOffer[]): AIResponse {
        if (!response.message || !response.reason || !Number.isFinite(response.desireDelta) || !Number.isFinite(response.currentDesire)) {
            throw new Error('missing AI response fields');
        }

        if (response.desireDelta < -20 || response.desireDelta > 20 || response.currentDesire < 0 || response.currentDesire > 100) {
            throw new Error('AI response number out of range');
        }

        if (response.decision === PurchaseDecision.Buy) {
            if (!response.productId || !products.some((offer) => offer.product.id === response.productId)) {
                throw new Error('AI response buy decision missing valid product');
            }
        }

        return {
            message: response.message,
            desireDelta: Math.round(response.desireDelta),
            currentDesire: Math.round(response.currentDesire),
            decision: response.decision,
            productId: response.productId ?? null,
            reason: response.reason,
        };
    }

    // ── 紧急兜底 ────────────────────────────────────────────

    /**
     * API 彻底失败时的紧急兜底。
     * 不做欲望计算，只返回模板回复让游戏可以继续。
     */
    private createEmergencyFallback(
        customer: CustomerData,
        _playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
    ): AIResponse {
        const delta = 0; // 兜底不改变欲望值
        const templates = EMERGENCY_TEMPLATES[customer.id];

        // 强制决策时：高欲望买、低欲望走
        if (forceDecision) {
            if (currentDesire >= 50 && products.length > 0) {
                const product = products[Math.floor(Math.random() * products.length)];
                return {
                    message: `${this.pickTemplate(customer, 'buy')} 我要${product.product.name}。`,
                    desireDelta: delta,
                    currentDesire,
                    decision: PurchaseDecision.Buy,
                    productId: product.product.id,
                    reason: '紧急兜底：强制决策-购买',
                };
            }
            return {
                message: this.pickTemplate(customer, 'leave'),
                desireDelta: delta,
                currentDesire,
                decision: PurchaseDecision.Leave,
                productId: null,
                reason: '紧急兜底：强制决策-离店',
            };
        }

        // 非强制决策：发送中性/正面消息
        const type = currentDesire >= 50 ? 'positive' : currentDesire <= 25 ? 'negative' : 'neutral';
        return {
            message: `[网络波动] ${this.pickTemplate(customer, type)}`,
            desireDelta: delta,
            currentDesire,
            decision: PurchaseDecision.Pending,
            productId: null,
            reason: '紧急兜底：AI服务不可用',
        };
    }

    private pickTemplate(customer: CustomerData, type: keyof EmergencyTemplate): string {
        const list = EMERGENCY_TEMPLATES[customer.id][type];
        return list[Math.floor(Math.random() * list.length)];
    }

    // ── 会话记录 ────────────────────────────────────────────

    private recordTurn(playerMessage: string, response: AIResponse): void {
        if (!this._currentSession) return;

        this._currentSession.turns.push({
            role: 'player',
            message: playerMessage,
            desireAfter: response.currentDesire,
        });

        this._currentSession.turns.push({
            role: 'customer',
            message: response.message,
            desireAfter: response.currentDesire,
            decision: response.decision,
        });
    }

    // ── 开场白 ──────────────────────────────────────────────

    calculateInitialDesire(customer: CustomerData, products: SellableProductOffer[]): number {
        const availabilityModifier = products.length > 0 ? 0 : -18;
        const priceModifier = this.calculateInitialPriceModifier(customer, products);
        return Math.max(0, Math.min(100, Math.round(customer.initialDesire + availabilityModifier + priceModifier)));
    }

    private calculateInitialPriceModifier(customer: CustomerData, products: SellableProductOffer[]): number {
        if (products.length === 0) return 0;
        const total = products.reduce((sum, offer) => {
            const ratio = offer.price / offer.product.suggestedPrice;
            if (ratio <= 0.9) return sum + 4;
            if (ratio <= 1.15) return sum + 3;
            if (ratio <= 1.3) return sum - 4;
            if (ratio <= 1.6) return sum - 8;
            return sum - 14;
        }, 0);
        return Math.round((total / products.length) * customer.priceSensitivity);
    }

    createOpening(customer: CustomerData, desire = customer.initialDesire): string {
        if (customer.id === CustomerPersonality.Worker) return '你好，我是上班族。我赶时间，想快点买好带走。';
        if (customer.id === CustomerPersonality.Hesitant) return '你好，我有点不知道选什么，可以帮我推荐吗？';
        if (desire >= 50) return `你好，我是${customer.displayName}顾客。我想看看今天有什么推荐。`;
        if (desire >= 40) return `你好，我是${customer.displayName}顾客。第一次来，想了解一下你们店里的咖啡。`;
        return `你好，我是${customer.displayName}顾客。我想买杯咖啡，简单一点就好。`;
    }

    // ── 工具方法 ────────────────────────────────────────────

    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
            promise
                .then((value) => { clearTimeout(timer); resolve(value); })
                .catch((error) => { clearTimeout(timer); reject(error); });
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private pickString(record: Record<string, unknown>, keys: string[]): string {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    }

    private pickNullableString(record: Record<string, unknown>, keys: string[]): string | null {
        for (const key of keys) {
            const value = record[key];
            if (value === null) return null;
            if (typeof value === 'string') {
                const text = value.trim();
                if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none' || text === '无') return null;
                return text;
            }
        }
        return null;
    }

    private pickNumber(record: Record<string, unknown>, keys: string[]): number {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'number') return value;
            if (typeof value === 'string' && value.trim()) return Number(value.replace(/[+＋]/g, '').trim());
        }
        return Number.NaN;
    }

    private normalizeDecision(value: string): PurchaseDecision {
        if (value.includes('购买') || value.toLowerCase().includes('buy')) return PurchaseDecision.Buy;
        if (value.includes('离店') || value.toLowerCase().includes('leave')) return PurchaseDecision.Leave;
        if (value.includes('暂不') || value.toLowerCase().includes('pending')) return PurchaseDecision.Pending;
        throw new Error('invalid AI decision');
    }

    private normalizeProductId(value: string | null, text: string, products: SellableProductOffer[]): string | null {
        if (value) {
            const directMatch = products.find((offer) => offer.product.id === value || offer.product.name === value);
            if (directMatch) return directMatch.product.id;
        }
        const textMatch = products.find((offer) => text.includes(offer.product.id) || text.includes(offer.product.name));
        return textMatch?.product.id ?? null;
    }

    private extractLabeledValue(text: string, label: string): string | null {
        const match = text.match(new RegExp(`【${label}】\\s*[:：]?\\s*([^【\\n]+)`));
        return match?.[1]?.trim() ?? null;
    }
}
