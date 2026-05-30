import { CustomerData } from '../data/CustomerData';
import { ProductData } from '../data/ProductData';

export interface PromptContext {
    customer: CustomerData;
    products: ProductData[];
    desire: number;
    playerMessage: string;
    history: string[];
}

export class PromptBuilder {
    static buildCustomerPrompt(context: PromptContext): string {
        const productText = context.products
            .map((product) => `${product.name}，建议售价${product.suggestedPrice}元，标签：${product.tags.join('、')}，特点：${product.description}`)
            .join('；');

        return [
            `你是《AI客来：街角咖啡屋》中的${context.customer.displayName}顾客。`,
            `性格特点：${context.customer.traits}`,
            `对话偏好：${context.customer.conversationPreference}`,
            `加分项：${context.customer.likes.join('、')}`,
            `扣分项：${context.customer.dislikes.join('、')}`,
            `喜欢关键词：${context.customer.likesKeywords.join('、')}`,
            `讨厌关键词：${context.customer.dislikesKeywords.join('、')}`,
            `偏好商品标签：${context.customer.preferredProductTags.join('、')}`,
            `价格敏感度：${context.customer.priceSensitivity}`,
            `耐心轮数：${context.customer.patience}`,
            `决策风格：${context.customer.decisionStyle}`,
            `当前购买欲望：${context.desire}`,
            `可购买产品：${productText}`,
            `历史对话：${context.history.join('\n') || '暂无'}`,
            `玩家本轮回复：${context.playerMessage}`,
            '请严格输出：',
            '【对话内容】：',
            '【欲望变动值】：',
            '【当前购买欲望】：',
            '【购买决策】：暂不决策/离店/购买',
        ].join('\n');
    }
}
