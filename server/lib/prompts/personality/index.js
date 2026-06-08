/**
 * 性格模块索引导出
 * 根据性格 ID 返回对应的 Prompt 片段
 */

import { personality as introvert } from './introvert.js';
import { personality as expert } from './expert.js';
import { personality as artistic } from './artistic.js';
import { personality as social } from './social.js';
import { personality as worker } from './worker.js';
import { personality as hesitant } from './hesitant.js';

const PROFILES = {
  introvert,
  expert,
  artistic,
  social,
  worker,
  hesitant,
};

const ALIASES = {
  '社恐内向型': 'introvert',
  '挑剔达人型': 'expert',
  '文艺青年型': 'artistic',
  '社牛自来熟型': 'social',
  '赶时间上班族': 'worker',
  '纠结选择困难型': 'hesitant',
};

/**
 * 解析顾客类型（支持中英文和 ID）
 * @param {string} raw - 原始类型字符串
 * @returns {string} 标准化的性格 ID
 */
export function resolvePersonalityId(raw) {
  const text = String(raw || '').trim().toLowerCase();
  return ALIASES[text] || (PROFILES[text] ? text : 'introvert');
}

/**
 * 获取指定性格的完整 Prompt 片段
 * @param {string} personalityId - 性格 ID
 * @param {object} payload - 包含 currentDesire 等状态
 * @returns {string} 性格专属 Prompt 文本
 */
export function getPersonalityPrompt(personalityId, payload = {}) {
  const id = resolvePersonalityId(personalityId);
  const profile = PROFILES[id] || PROFILES.introvert;
  const currentDesire = Number(payload?.currentDesire) || 50;

  const sections = [
    `【顾客性格 — ${profile.id}】`,
    `说话风格：${profile.style}`,
    `对话策略（你应该怎样说）：`,
    ...profile.conversationalTactics.map((t, i) => `  ${i + 1}. ${t}`),
    `禁忌行为（你绝对不能做）：`,
    ...profile.forbiddenBehaviors.map((b, i) => `  ${i + 1}. ${b}`),
    `口头禅/语气特征：${profile.verbalTics}`,
    `句子长度偏好：${profile.sentenceStyle}`,
    `当前心情：${profile.getMoodModifier(currentDesire)}`,
  ];

  return sections.join('\n');
}

/**
 * 获取性格的兜底回复
 * @param {string} personalityId
 * @param {number} currentDesire
 * @returns {string}
 */
export function getFallbackReply(personalityId, currentDesire) {
  const id = resolvePersonalityId(personalityId);
  const profile = PROFILES[id] || PROFILES.introvert;
  return currentDesire >= 50 ? profile.fallbackPositive : profile.fallbackNegative;
}

/**
 * 获取所有可用的性格 ID 列表
 * @returns {string[]}
 */
export function getAllPersonalityIds() {
  return Object.keys(PROFILES);
}
