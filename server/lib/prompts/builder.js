/**
 * Prompt 构建器 — 编排所有模块，组装最终发给 LLM 的完整提示词
 */

import { SYSTEM_CONSTRAINTS } from './system.js';
import { formatGameState } from './system.js';
import { formatProducts, formatLowStockWarning } from './products.js';
import { formatFewShot } from './few-shot.js';
import { getPersonalityPrompt } from './personality/index.js';

/**
 * 构建完整的聊天 prompt
 * @param {object} payload - 客户端请求体
 * @param {object} payload.customer - 顾客数据
 * @param {Array} payload.products - 商品列表
 * @param {string} payload.playerMessage - 玩家消息
 * @param {number} payload.currentDesire - 当前欲望值
 * @param {number} payload.turnCount - 当前对话轮数
 * @param {boolean} payload.forceDecision - 是否强制决策
 * @param {number} payload.dayNumber - 当前天数
 * @returns {string} 完整 prompt
 */
export function buildPrompt(payload) {
  const customer = payload?.customer || {};
  const personalityId = customer.id || 'introvert';
  const customerProfile = getCustomerProfile(customer, personalityId);
  const personalityPrompt = getPersonalityPrompt(personalityId, payload);

  const sections = [
    SYSTEM_CONSTRAINTS,

    `【顾客基本信息】
名称：${customer.name || '顾客'}
性格：${customer.displayName || personalityId}
特点：${customer.traits || ''}
对话偏好：${customer.conversationPreference || ''}
喜欢的关键词：${arrayText(customer.likesKeywords)}
讨厌的关键词：${arrayText(customer.dislikesKeywords)}
偏好的商品类型：${arrayText(customer.preferredProductTags)}
价格敏感度：${customer.priceSensitivity ?? '中等'}
决策风格：${customer.decisionStyle || '普通'}`,

    personalityPrompt,

    formatGameState({ ...payload, customerProfile }),

    formatProducts(payload?.products),
    formatLowStockWarning(payload?.products),

    formatFewShot(personalityId),

    `【玩家本轮说的话】
"${payload?.playerMessage || ''}"

请根据以上所有信息，以该顾客的身份和性格，输出 JSON 回复。`,
  ];

  return sections.filter(Boolean).join('\n\n');
}

/**
 * 从顾客数据提取服务端画像
 */
function getCustomerProfile(customer, personalityId) {
  return {
    id: personalityId,
    name: customer.name || '顾客',
    displayName: customer.displayName || personalityId,
    maxTurns: customer.patience || 4,
  };
}

function arrayText(value) {
  return Array.isArray(value) && value.length > 0 ? value.join('、') : '无特殊偏好';
}
