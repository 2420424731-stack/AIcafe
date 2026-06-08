import { CustomerData } from '../data/CustomerData';
import type { SellableProductOffer } from '../core/GameManager';

/**
 * 客户端校验与序列化工具
 *
 * 服务端自己构建完整 prompt，客户端 PromptBuilder 重新定位为轻量级校验工具：
 * - 发请求前校验数据完整性
 * - 序列化顾客/商品数据（用于调试或日志）
 */

export interface ValidatedPayload {
    customer: {
        id: string;
        name: string;
        displayName: string;
        traits: string;
        conversationPreference: string;
        likes: string[];
        dislikes: string[];
        likesKeywords: string[];
        dislikesKeywords: string[];
        preferredProductTags: string[];
        decisionStyle: string;
        priceSensitivity: number;
        patience: number;
    };
    playerMessage: string;
    currentDesire: number;
    forceDecision: boolean;
    turnCount: number;
    dayNumber: number;
    products: {
        id: string;
        name: string;
        tags: string[];
        description: string;
        suggestedPrice: number;
        cost: number;
        amount: number;
        price: number;
    }[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    payload?: ValidatedPayload;
}

export class PromptBuilder {
    /** 请求发送前的完整校验 */
    static validatePayload(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
        turnCount: number,
        dayNumber: number,
    ): ValidationResult {
        const errors: string[] = [];

        // 顾客数据完整性
        if (!customer?.id) errors.push('customer.id is missing');
        if (!customer?.name) errors.push('customer.name is missing');
        if (!customer?.traits) errors.push('customer.traits is missing');
        if (!Number.isFinite(customer?.patience) || customer.patience < 1) {
            errors.push('customer.patience is invalid');
        }

        // 玩家消息
        if (!playerMessage || typeof playerMessage !== 'string') {
            errors.push('playerMessage is missing or invalid');
        } else if (playerMessage.trim().length === 0) {
            errors.push('playerMessage is empty');
        } else if (playerMessage.length > 500) {
            errors.push(`playerMessage too long (${playerMessage.length} > 500)`);
        }

        // 欲望值
        if (!Number.isFinite(currentDesire) || currentDesire < 0 || currentDesire > 100) {
            errors.push(`currentDesire out of range: ${currentDesire}`);
        }

        // 商品列表（空列表在强制决策时是合理的，但记录警告）
        if (!Array.isArray(products)) {
            errors.push('products is not an array');
        } else if (products.length === 0 && forceDecision) {
            errors.push('forceDecision=true but products is empty');
        }

        // 轮数
        if (!Number.isFinite(turnCount) || turnCount < 0) {
            errors.push(`turnCount invalid: ${turnCount}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            payload: errors.length === 0 ? PromptBuilder.serializePayload(
                customer, playerMessage, currentDesire, products, forceDecision, turnCount, dayNumber,
            ) : undefined,
        };
    }

    /** 序列化为 API 请求体 */
    static serializePayload(
        customer: CustomerData,
        playerMessage: string,
        currentDesire: number,
        products: SellableProductOffer[],
        forceDecision: boolean,
        turnCount: number,
        dayNumber: number,
    ): ValidatedPayload {
        return {
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
            dayNumber,
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
    }

    /**
     * 序列化顾客数据为人类可读文本（用于调试和日志）
     */
    static formatCustomerForDebug(customer: CustomerData): string {
        return [
            `顾客：${customer.name}（${customer.displayName}）`,
            `性格：${customer.traits}`,
            `对话偏好：${customer.conversationPreference}`,
            `加分：${customer.likes.join('、')}`,
            `扣分：${customer.dislikes.join('、')}`,
            `偏好标签：${customer.preferredProductTags.join('、')}`,
            `价格敏感度：${customer.priceSensitivity}`,
            `耐心：${customer.patience}轮`,
            `决策风格：${customer.decisionStyle}`,
            `初始购买欲：${customer.initialDesire}`,
        ].join('\n');
    }
}
