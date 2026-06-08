/**
 * 内容安全过滤器
 * 检测并处理玩家输入和 AI 输出中的不安全内容
 */

/** 敏感词列表（中文脏话、歧视用语、政治敏感词） */
const BLOCKED_TERMS = [
  // 脏话/辱骂
  '傻逼', '妈的', '操你', '去死', '垃圾', '废物',
  'fuck', 'shit', 'damn',
  // 歧视用语
  '歧视', '种族',
  // 越狱/注入尝试
  'ignore previous', '忽略之前的', '你是 AI', '你是一个AI',
  'system prompt', '系统提示', 'your instructions', '你的指令',
  'you are a language model', '作为语言模型',
];

/** AI 角色保护 — 模型回复中不应出现的词 */
const AI_LEAKAGE_TERMS = [
  '我是AI', '作为AI', '作为语言模型', '我无法',
  'prompt', 'API', '代码', '游戏机制', '购买欲望', '系统提示',
  'I am an AI', 'as a language model', 'as an AI',
];

/**
 * 检查玩家输入是否包含敏感内容
 * @param {string} text
 * @returns {{ safe: boolean, reason?: string }}
 */
export function checkPlayerInput(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { safe: false, reason: 'empty_input' };
  }

  if (text.length > 500) {
    return { safe: false, reason: 'input_too_long' };
  }

  const lower = text.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      return { safe: false, reason: `blocked_term: ${term}` };
    }
  }

  return { safe: true };
}

/**
 * 检查 AI 输出是否包含角色泄露或不当内容
 * @param {string} text
 * @returns {{ safe: boolean, reason?: string }}
 */
export function checkAIOutput(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { safe: false, reason: 'empty_output' };
  }

  const lower = text.toLowerCase();
  for (const term of AI_LEAKAGE_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      return { safe: false, reason: `ai_leakage: ${term}` };
    }
  }

  // 检测过长的回复（可能是模型输出异常）
  if (text.length > 500) {
    return { safe: false, reason: 'output_too_long' };
  }

  return { safe: true };
}

/**
 * 生成安全兜底回复
 * @param {string} personalityId
 * @param {number} currentDesire
 * @returns {string}
 */
export function getSafeFallbackMessage(personalityId, currentDesire = 50) {
  const safeMessages = {
    introvert: currentDesire >= 50
      ? '嗯...我刚才走神了一下，你能再说一遍吗？'
      : '我、我觉得有点不舒服，想先离开了。',
    expert: currentDesire >= 50
      ? '不好意思，刚才没听清，能再说一下吗？'
      : '这个我不太确定，还是下次再说吧。',
    artistic: currentDesire >= 50
      ? '刚才有点恍惚，你能再说一次吗？'
      : '感觉不太对...我可能今天不适合做决定。',
    social: currentDesire >= 50
      ? '哈哈刚才走神了，你再说一遍？'
      : '呃，今天状态不太好，改天再来吧。',
    worker: currentDesire >= 50
      ? '刚才没注意听，再说一次？简短点。'
      : '算了来不及了，下次再说。',
    hesitant: currentDesire >= 50
      ? '啊对不起，我刚才犹豫了一下走神了，你能再介绍一下吗？'
      : '我还是想不清楚...今天先不买了吧。',
  };

  return safeMessages[personalityId]
    || (currentDesire >= 50 ? '不好意思，能再说一遍吗？' : '我今天还是先不买了。');
}
