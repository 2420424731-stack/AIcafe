import { _decorator, Component } from 'cc';
import { GameManager } from '../core/GameManager';
import type { SellableProductOffer } from '../core/GameManager';
import { CustomerData, CustomerPersonality } from '../data/CustomerData';
import { ProductData, PRODUCT_LIST } from '../data/ProductData';
import { SkillId } from '../data/SkillData';

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

interface DesireBreakdown {
    keyword: number;
    product: number;
    price: number;
    personality: number;
}

interface ReplyTemplate {
    positive: string[];
    neutral: string[];
    negative: string[];
    buy: string[];
    leave: string[];
}

const REPLY_TEMPLATES: Record<CustomerPersonality, ReplyTemplate> = {
    [CustomerPersonality.Introvert]: {
        positive: ['这样说我比较放心，那我可以试试。', '嗯，简单一点挺好的，我想再了解一下。'],
        neutral: ['嗯……我再想一下。', '可以再简单说一句区别吗？'],
        negative: ['有点太热情了，我可能不太适应。', '不好意思，我有点紧张。'],
        buy: ['那我就要这个吧，谢谢。', '听起来比较稳妥，我试试看。'],
        leave: ['不好意思，我还是先不买了。', '我再想想，先走了。'],
    },
    [CustomerPersonality.Expert]: {
        positive: ['你说得比较具体，听起来还算专业。', '这个描述有细节，我愿意继续听。'],
        neutral: ['还有没有更明确的口感区别？', '产地、烘焙或者风味能再说清楚一点吗？'],
        negative: ['这个说法太笼统了，我不太满意。', '如果只是随便推荐，我就没什么兴趣了。'],
        buy: ['细节说清楚了，那我买这个。', '可以，就按你说的这款来。'],
        leave: ['信息不够准确，我先不买了。', '今天先算了。'],
    },
    [CustomerPersonality.Artistic]: {
        positive: ['这个描述有画面感，我挺喜欢的。', '听起来很适合慢慢喝。'],
        neutral: ['氛围不错，但我还想再感受一下。', '能再讲讲它特别的地方吗？'],
        negative: ['这样说有点太功利了，我没什么感觉。', '只是催我买的话，我会有点出戏。'],
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
    useRealAI = false;

    @property
    apiUrl = '/api/chat';

    @property
    aiTimeoutMs = 8000;

    async reply(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision = false,
        turnCount = 0,
    ): Promise<AIResponse> {
        if (this.useRealAI) {
            try {
                return await this.requestRealAIReply(customer, playerMessage, currentDesire, products, forceDecision, turnCount);
            } catch (error) {
                console.warn('[AIManager] real AI failed, fallback to local AI.', error);
            }
        }

        return this.createLocalMockReply(customer, playerMessage, currentDesire, products, forceDecision);
    }

    private async requestRealAIReply(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
        turnCount: number,
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
            },
            playerMessage,
            currentDesire,
            forceDecision,
            turnCount: Math.max(0, Math.floor(turnCount)),
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

        const data = await this.withTimeout(
            (async () => {
                const response = await runtime.fetch!(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response || !response.ok) {
                    throw new Error(`request failed: ${response?.status ?? 'unknown'}`);
                }

                return response.json();
            })(),
            this.aiTimeoutMs,
        );

        return this.parseAIResponse(data, products);
    }

    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
            promise
                .then((value) => {
                    clearTimeout(timer);
                    resolve(value);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

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
        if (!data || typeof data !== 'object') {
            return data;
        }

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
            currentDesire: this.clampDesire(response.currentDesire),
            decision: response.decision,
            productId: response.productId ?? null,
            reason: response.reason,
        };
    }

    private pickString(record: Record<string, unknown>, keys: string[]): string {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }

        return '';
    }

    private pickNullableString(record: Record<string, unknown>, keys: string[]): string | null {
        for (const key of keys) {
            const value = record[key];
            if (value === null) {
                return null;
            }

            if (typeof value === 'string') {
                const text = value.trim();
                if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none' || text === '无') {
                    return null;
                }

                return text;
            }
        }

        return null;
    }

    private pickNumber(record: Record<string, unknown>, keys: string[]): number {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'number') {
                return value;
            }

            if (typeof value === 'string' && value.trim()) {
                return Number(value.replace(/[+＋]/g, '').trim());
            }
        }

        return Number.NaN;
    }

    private normalizeDecision(value: string): PurchaseDecision {
        if (value.includes('购买') || value.toLowerCase().includes('buy')) {
            return PurchaseDecision.Buy;
        }

        if (value.includes('离店') || value.toLowerCase().includes('leave')) {
            return PurchaseDecision.Leave;
        }

        if (value.includes('暂不') || value.toLowerCase().includes('pending')) {
            return PurchaseDecision.Pending;
        }

        throw new Error('invalid AI decision');
    }

    private normalizeProductId(value: string | null, text: string, products: SellableProductOffer[]): string | null {
        if (value) {
            const directMatch = products.find((offer) => offer.product.id === value || offer.product.name === value);
            if (directMatch) {
                return directMatch.product.id;
            }
        }

        const textMatch = products.find((offer) => text.includes(offer.product.id) || text.includes(offer.product.name));
        return textMatch?.product.id ?? null;
    }

    private extractLabeledValue(text: string, label: string): string | null {
        const match = text.match(new RegExp(`【${label}】\\s*[:：]?\\s*([^【\\n]+)`));
        return match?.[1]?.trim() ?? null;
    }

    calculateInitialDesire(customer: CustomerData, products: SellableProductOffer[]): number {
        const availabilityModifier = products.length > 0 ? 0 : -18;
        const priceModifier = this.calculatePriceAcceptance(customer, products);
        return this.clampDesire(customer.initialDesire + availabilityModifier + priceModifier);
    }

    createOpening(customer: CustomerData, desire = customer.initialDesire): string {
        return `你好，我是${customer.displayName}顾客。${this.getOpeningByDesire(customer, desire)}`;
    }

    private createLocalMockReply(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
    ): AIResponse {
        const breakdown = this.calculateDesireBreakdown(customer, playerMessage, products);
        const delta = this.clampDesireDelta(breakdown.keyword + breakdown.product + breakdown.price + breakdown.personality);
        const nextDesire = this.clampDesire(currentDesire + delta);

        if (nextDesire <= 20) {
            return {
                message: this.pickReply(customer, 'leave'),
                desireDelta: delta,
                currentDesire: nextDesire,
                decision: PurchaseDecision.Leave,
                productId: null,
                reason: '购买欲望过低，顾客选择离店',
            };
        }

        if (products.length === 0) {
            return {
                message: forceDecision ? this.pickReply(customer, 'leave') : this.pickReply(customer, 'neutral'),
                desireDelta: delta,
                currentDesire: nextDesire,
                decision: forceDecision ? PurchaseDecision.Leave : PurchaseDecision.Pending,
                productId: null,
                reason: products.length === 0 ? '当前没有可售商品' : '顾客还在考虑',
            };
        }

        const decision = this.resolveDecision(customer, nextDesire, forceDecision);
        if (decision === PurchaseDecision.Buy) {
            const product = this.pickProductByPreference(customer, products, nextDesire);
            return {
                message: `${this.pickReply(customer, 'buy')} 我要${product.product.name}。`,
                desireDelta: delta,
                currentDesire: nextDesire,
                decision: PurchaseDecision.Buy,
                productId: product.product.id,
                reason: '购买欲望较高且存在可购买商品',
            };
        }

        if (decision === PurchaseDecision.Leave) {
            return {
                message: this.pickReply(customer, 'leave'),
                desireDelta: delta,
                currentDesire: nextDesire,
                decision: PurchaseDecision.Leave,
                productId: null,
                reason: '最终决策未被说服，顾客离店',
            };
        }

        return {
            message: this.pickReply(customer, delta >= 6 ? 'positive' : delta <= -6 ? 'negative' : 'neutral'),
            desireDelta: delta,
            currentDesire: nextDesire,
            decision: PurchaseDecision.Pending,
            productId: null,
            reason: '顾客仍在考虑，等待下一轮对话',
        };
    }

    private calculateDesireBreakdown(
        customer: CustomerData,
        playerMessage: string,
        products: SellableProductOffer[],
    ): DesireBreakdown {
        const message = playerMessage.toLowerCase();
        return {
            keyword: this.scoreKeywords(playerMessage, customer.likesKeywords, 5) - this.scoreKeywords(playerMessage, customer.dislikesKeywords, 8),
            product: this.scoreProductPreference(customer, message, products),
            price: this.scorePriceAcceptance(customer, message, products),
            personality: this.scorePersonalityRule(customer, message, playerMessage.length, products),
        };
    }

    private resolveDecision(customer: CustomerData, desire: number, forceDecision: boolean): PurchaseDecision {
        if (desire >= 85) {
            return PurchaseDecision.Buy;
        }

        if (customer.decisionStyle === 'fast_decision' && desire >= 62) {
            return PurchaseDecision.Buy;
        }

        if (!forceDecision) {
            if (customer.decisionStyle === 'guided_choice') {
                return desire >= 78 && Math.random() < 0.35 ? PurchaseDecision.Buy : PurchaseDecision.Pending;
            }

            return desire >= 75 && Math.random() < 0.45 ? PurchaseDecision.Buy : PurchaseDecision.Pending;
        }

        const buyChance = desire <= 40 ? 0.2 : desire <= 60 ? 0.55 : customer.decisionStyle === 'guided_choice' ? 0.75 : 0.9;
        return Math.random() < buyChance ? PurchaseDecision.Buy : PurchaseDecision.Leave;
    }

    private scoreKeywords(playerMessage: string, keywords: string[], points: number): number {
        return keywords.reduce((total, keyword) => playerMessage.includes(keyword) ? total + points : total, 0);
    }

    private scoreProductPreference(customer: CustomerData, message: string, products: SellableProductOffer[]): number {
        if (products.length === 0) {
            return -8;
        }

        const mentionedOffers = products.filter((offer) => this.mentionsProduct(message, offer.product));
        const mentionsUnavailable = PRODUCT_LIST.some((product) => !products.some((offer) => offer.product.id === product.id) && this.mentionsProduct(message, product));

        if (mentionsUnavailable) {
            return -8;
        }

        if (mentionedOffers.length > 0) {
            return mentionedOffers.reduce((total, offer) => total + this.countTagMatches(offer.product.tags, customer.preferredProductTags) * 3, 0);
        }

        if (this.containsAny(message, ['推荐', '适合', '建议', '选', '来一份'])) {
            return products.some((offer) => this.hasTagOverlap(offer.product.tags, customer.preferredProductTags)) ? 3 : 0;
        }

        return 0;
    }

    private scorePriceAcceptance(customer: CustomerData, message: string, products: SellableProductOffer[]): number {
        const priceScore = this.calculatePriceAcceptance(customer, products);
        if (priceScore === 0) {
            return 0;
        }

        if (this.containsAny(message, ['价格', '售价', '多少钱', '元', '便宜', '划算', '贵'])) {
            return priceScore;
        }

        return priceScore < 0 ? Math.ceil(priceScore / 2) : 0;
    }

    private calculatePriceAcceptance(customer: CustomerData, products: SellableProductOffer[]): number {
        if (products.length === 0) {
            return 0;
        }

        const total = products.reduce((sum, offer) => sum + this.scoreOfferPrice(customer, offer), 0);
        return Math.round(total / products.length);
    }

    private scoreOfferPrice(customer: CustomerData, offer: SellableProductOffer): number {
        const suggestedRatio = offer.price / offer.product.suggestedPrice;
        const grossMargin = (offer.price - offer.product.cost) / offer.product.cost;
        let score = 0;

        if (suggestedRatio <= 0.9) score += 4;
        else if (suggestedRatio <= 1.15) score += 3;
        else if (suggestedRatio <= 1.3) score -= 4;
        else if (suggestedRatio <= 1.6) score -= 8;
        else score -= 14;

        if (grossMargin > 3) score -= 4;
        if (grossMargin < 0.5) score += 2;
        return Math.round(score * customer.priceSensitivity);
    }

    private scorePersonalityRule(
        customer: CustomerData,
        message: string,
        length: number,
        products: SellableProductOffer[],
    ): number {
        switch (customer.id) {
            case CustomerPersonality.Introvert:
                return (length <= 50 ? 3 : -2) + ((message.match(/[?？]/g)?.length ?? 0) >= 2 ? -5 : 0);
            case CustomerPersonality.Expert:
                return (/[0-9０-９]+/.test(message) || this.containsAny(message, ['分钟', '元', '度', '比例']) ? 3 : 0)
                    + (this.containsAny(message, ['酸度', '烘焙', '香气', '层次', '产地']) ? 5 : 0);
            case CustomerPersonality.Artistic:
                return this.containsAny(message, ['故事', '氛围', '果香', '慢慢喝', '坐下来', '生活']) ? 6 : 0;
            case CustomerPersonality.Social:
                return this.containsAny(message, ['哈哈', '熟客', '朋友', '常来', '今天']) ? 6 : length < 8 ? -3 : 0;
            case CustomerPersonality.Worker:
                return (length <= 45 ? 5 : -6) + (products.some((offer) => this.isOneOf('fast', offer.product.tags)) && this.containsAny(message, ['快', '马上', '打包']) ? 4 : 0);
            case CustomerPersonality.Hesitant:
                return (this.containsAny(message, ['我建议', '直接选', '二选一', '不容易踩雷']) ? 7 : 0)
                    + (products.filter((offer) => this.mentionsProduct(message, offer.product)).length > 2 ? -6 : 0);
            default:
                return 0;
        }
    }

    private pickProductByPreference(
        customer: CustomerData,
        products: SellableProductOffer[],
        desire: number,
    ): SellableProductOffer {
        const preferredProducts = products.filter((offer) => this.hasTagOverlap(offer.product.tags, customer.preferredProductTags));
        const candidates = preferredProducts.length > 0 ? preferredProducts : products;

        return this.pickRandomOffer(candidates);
    }

    private scoreProductPriceTier(offer: SellableProductOffer, desire: number): number {
        if (desire >= 81) {
            return offer.price * 0.3;
        }

        if (desire >= 61) {
        return offer.price * 0.15;
        }

        return -offer.price * 0.25;
    }

    private pickRandomOffer(products: SellableProductOffer[]): SellableProductOffer {
        return products[Math.floor(Math.random() * products.length)];
    }

    private pickReply(customer: CustomerData, type: keyof ReplyTemplate): string {
        const list = REPLY_TEMPLATES[customer.id][type];
        return list[Math.floor(Math.random() * list.length)];
    }

    private mentionsProduct(message: string, product: ProductData): boolean {
        const shortName = product.name
            .replace('咖啡', '')
            .replace('原味', '')
            .replace('春日', '')
            .trim();
        return message.includes(product.name) || (!!shortName && message.includes(shortName));
    }

    private hasTagOverlap(tags: string[], preferredTags: string[]): boolean {
        return this.countTagMatches(tags, preferredTags) > 0;
    }

    private countTagMatches(tags: string[], preferredTags: string[]): number {
        return tags.reduce((total, tag) => total + (this.isOneOf(tag, preferredTags) ? 1 : 0), 0);
    }

    private containsAny(message: string, keywords: string[]): boolean {
        return keywords.some((keyword) => message.includes(keyword));
    }

    private isOneOf(value: string, candidates: string[]): boolean {
        return candidates.indexOf(value) >= 0;
    }

    private clampDesireDelta(value: number): number {
        const eloquenceLevel = GameManager.instance?.getSkillLevel(SkillId.Eloquence) ?? 0;
        const toleranceLevel = GameManager.instance?.getSkillLevel(SkillId.Tolerance) ?? 0;
        const positiveCap = 20 + eloquenceLevel * 5;
        const negativeCap = -20 + toleranceLevel * 4;
        return Math.max(negativeCap, Math.min(positiveCap, Math.round(value || 1)));
    }

    private clampDesire(value: number): number {
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    private getOpeningByDesire(customer: CustomerData, desire: number): string {
        if (customer.id === CustomerPersonality.Worker) return '我赶时间，想快点买好带走。';
        if (customer.id === CustomerPersonality.Hesitant) return '我有点不知道选什么，可以帮我推荐吗？';
        if (desire >= 50) return '我想看看今天有什么推荐。';
        if (desire >= 40) return '第一次来，想了解一下你们店里的咖啡。';
        return '我想买杯咖啡，简单一点就好。';
    }
}
