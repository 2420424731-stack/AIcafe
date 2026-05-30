import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const ARK_API_KEY = process.env.ARK_API_KEY || process.env.AI_API_KEY || '';
const ARK_BASE_URL = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
const ARK_MODEL = process.env.ARK_MODEL || process.env.AI_MODEL || 'doubao-seed-2-0-mini-260428';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 8000);

// 顾客画像配置：后端只读取这些风格信息，/api/chat 的返回字段保持不变。
const DEFAULT_CUSTOMER_PROFILE = {
  style: '自然、礼貌，像普通咖啡店顾客一样简短回应。',
  likes: ['清楚说明商品特点', '礼貌推荐', '回答具体问题'],
  dislikes: ['强行推销', '答非所问', '过度夸张'],
  maxTurns: 4,
  fallbackPositiveReply: '听起来不错，我想再了解一下。',
  fallbackNegativeReply: '我还有点犹豫，暂时先看看。',
  examples: [
    { player: '这款口感比较温和，适合第一次来试试。', customer: '听起来挺稳的，那我再看看。' },
    { player: '如果你喜欢简单一点，我可以推荐基础款。', customer: '可以，简单介绍就好。' },
  ],
};

const CUSTOMER_PROFILES = {
  introvert: {
    style: '说话轻声、谨慎、句子偏短，不喜欢被过度关注。',
    likes: ['温和礼貌', '简单说明', '给足自主空间'],
    dislikes: ['连续追问', '强烈催买', '过度热情'],
    maxTurns: 3,
    fallbackPositiveReply: '这样说我比较放心，可以再看看。',
    fallbackNegativeReply: '有点太热情了，我可能不太适应。',
    examples: [
      { player: '不用急，我简单说一下，你可以慢慢看。', customer: '嗯，这样我比较自在一点。' },
      { player: '这杯拿铁比较温和，不喜欢也可以先不点。', customer: '好，我想先听听它是什么味道。' },
    ],
  },
  expert: {
    style: '表达挑剔、重视专业细节，会关注口感和品质依据。',
    likes: ['专业描述', '说明风味层次', '给出明确依据'],
    dislikes: ['敷衍回应', '都差不多', '专业错误'],
    maxTurns: 4,
    fallbackPositiveReply: '这个描述有细节，我愿意继续听。',
    fallbackNegativeReply: '信息不够准确，我暂时不太满意。',
    examples: [
      { player: '这杯酸度低，奶香明显，尾段有一点坚果香。', customer: '这个描述比较具体，我能接受。' },
      { player: '如果你在意层次，我更推荐这款烘焙更干净的。', customer: '可以，那它和美式的差别在哪里？' },
    ],
  },
  artistic: {
    style: '说话有画面感，重视氛围、故事和情绪价值。',
    likes: ['分享故事', '描述氛围', '温柔共情'],
    dislikes: ['功利推销', '催促购买', '否定审美'],
    maxTurns: 4,
    fallbackPositiveReply: '这个描述有画面感，我挺喜欢的。',
    fallbackNegativeReply: '这样说有点太功利了，我没什么感觉。',
    examples: [
      { player: '这杯喝起来像下午刚晒过太阳的窗边，适合慢慢坐一会。', customer: '这个说法有画面感，我有点喜欢。' },
      { player: '它的果香比较轻，适合想放松一下的时候喝。', customer: '听起来很温柔，我想再了解一点。' },
    ],
  },
  social: {
    style: '热情外向、像熟客聊天，语气轻松自然。',
    likes: ['积极互动', '朋友式沟通', '接住闲聊'],
    dislikes: ['冷淡敷衍', '打断对话', '急着结束'],
    maxTurns: 4,
    fallbackPositiveReply: '哈哈，你这么一说我就有兴趣了。',
    fallbackNegativeReply: '你这也太冷淡了吧，我有点不想买。',
    examples: [
      { player: '今天来得正好，热拿铁刚好适合聊两句。', customer: '哈哈，那你挺会推荐的。' },
      { player: '老朋友口味的话，我建议来杯甜一点的。', customer: '行啊，听着挺亲切的。' },
    ],
  },
  worker: {
    style: '节奏快、目标明确，回答要短，重视效率。',
    likes: ['快速推荐', '说明出餐速度', '直接给结论'],
    dislikes: ['闲聊啰嗦', '复杂介绍', '多轮无效对话'],
    maxTurns: 2,
    fallbackPositiveReply: '直接明了，可以，就这个吧。',
    fallbackNegativeReply: '太慢了，我可能来不及。',
    examples: [
      { player: '美式最快，两分钟能打包。', customer: '行，够快就可以。' },
      { player: '赶时间的话直接选这个，不耽误。', customer: '好，别太复杂。' },
    ],
  },
  hesitant: {
    style: '犹豫、反复比较，需要被温和引导和缩小选择。',
    likes: ['精准推荐', '说明差异', '帮忙二选一'],
    dislikes: ['给太多选择', '不耐烦', '催促决策'],
    maxTurns: 4,
    fallbackPositiveReply: '你这样帮我缩小范围，我就好选多了。',
    fallbackNegativeReply: '选择太多了，我更纠结了。',
    examples: [
      { player: '如果你纠结，我建议拿铁和美式里选拿铁，更温和。', customer: '这样说我就好选多了。' },
      { player: '不用全看，今天先从不容易踩雷的这杯开始。', customer: '好，那我会更有方向一点。' },
    ],
  },
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === '/api/chat') {
    if (req.method !== 'POST') {
      sendJson(res, 405, createErrorGameResponse({}, new Error('method not allowed')));
      return;
    }

    let payload = {};
    try {
      payload = await readJsonBody(req);
      const result = await chatWithModel(payload);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, createErrorGameResponse(payload, error));
    }
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`AIcafe AI server listening on http://localhost:${PORT}`);
});

async function chatWithModel(payload) {
  if (!isUsableApiKey(ARK_API_KEY)) {
    throw new Error('ARK_API_KEY is not set');
  }

  const prompt = buildPrompt(payload);
  const response = await fetchWithTimeout(`${ARK_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: ARK_MODEL,
      reasoning: { effort: 'minimal' },
      max_output_tokens: 220,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: '你是《AI客来：街角咖啡屋》的顾客 AI。必须只输出包含固定字段的 JSON，不要输出 Markdown。',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  }, AI_TIMEOUT_MS);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`model request failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = getArkOutputText(data);
  const parsed = parseModelContent(content);
  return normalizeGameResponse(parsed, payload);
}

function getArkOutputText(data) {
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    if (item?.type && item.type !== 'message') {
      continue;
    }

    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.output_text === 'string') {
        return part.output_text;
      }

      if (typeof part?.text === 'string') {
        return part.text;
      }
    }
  }

  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string') {
    return messageContent;
  }

  throw new Error('empty model response');
}

function buildPrompt(payload) {
  const customer = payload?.customer || {};
  const customerProfile = getCustomerProfile(payload);
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const productText = products.length > 0
    ? products.map((product) => [
      `id=${product.id}`,
      `名称=${product.name}`,
      `售价=${product.price}`,
      `库存=${product.amount}`,
      `标签=${Array.isArray(product.tags) ? product.tags.join('/') : ''}`,
      `描述=${product.description || ''}`,
    ].join('，')).join('\n')
    : '当前没有可售商品';

  return [
    '【绝对角色限制】',
    '你只能扮演一名正在街角咖啡屋点单的真实顾客。',
    '你不是 AI，不是助手，不是旁白，也不是系统提示解释者。',
    '禁止在任何输出字段中说出或暗示以下内容：我是AI、作为语言模型、Prompt、API、代码、游戏机制、购买欲望数值。',
    '顾客只能围绕咖啡店点单场景说话，包括询问饮品、口味、价格、等待、购买或离开。',
    '不能凭空创造不存在的商品；只能从“可购买商品”列表里选择商品。',
    '必须只输出 JSON，不要输出 Markdown，不要输出解释性段落。',
    '',
    '【顾客画像】',
    `顾客名称：${customer.name || '顾客'}`,
    `顾客性格：${customer.displayName || customer.id || '未知'}`,
    `性格特点：${customer.traits || ''}`,
    `对话偏好：${customer.conversationPreference || ''}`,
    `喜欢：${arrayText(customer.likes)}`,
    `讨厌：${arrayText(customer.dislikes)}`,
    `喜欢关键词：${arrayText(customer.likesKeywords)}`,
    `讨厌关键词：${arrayText(customer.dislikesKeywords)}`,
    `偏好商品标签：${arrayText(customer.preferredProductTags)}`,
    `说话风格：${customerProfile.style}`,
    `喜欢的话术：${arrayText(customerProfile.likes)}`,
    `讨厌的话术：${arrayText(customerProfile.dislikes)}`,
    `最大对话轮数：${customerProfile.maxTurns}`,
    `后端正向兜底回复：${customerProfile.fallbackPositiveReply}`,
    `后端负向兜底回复：${customerProfile.fallbackNegativeReply}`,
    `语气示例（只用于约束语气，不要照抄）：\n${formatExamples(customerProfile.examples)}`,
    `决策风格：${customer.decisionStyle || ''}`,
    `价格敏感度：${customer.priceSensitivity ?? ''}`,
    `内部当前欲望值：${payload?.currentDesire}`,
    `当前对话轮数：${payload?.turnCount ?? 0} / ${customerProfile.maxTurns}`,
    `是否必须做最终决策：${payload?.forceDecision ? '是' : '否'}`,
    '',
    '【咖啡店商品】',
    `可购买商品：\n${productText}`,
    `玩家回复：${payload?.playerMessage || ''}`,
    '',
    '【输出格式】',
    '请根据顾客性格、玩家回复、商品库存和价格，输出严格 JSON：',
    '{',
    '  "message": "顾客对玩家说的话",',
    '  "desireDelta": -20 到 20 的整数,',
    '  "currentDesire": 0 到 100 的整数,',
    '  "decision": "pending" 或 "leave" 或 "buy",',
    '  "productId": "购买时填写商品 id，否则填 null",',
    '  "reason": "一句话解释为什么加分、为什么扣分、为什么购买或为什么离店"',
    '}',
    '规则：必须始终输出以上 6 个字段；decision 为 buy 时 productId 必须来自可购买商品；如果没有可购买商品，不能 buy。',
    '规则：message 必须像顾客自然说话，不能出现被禁止词，也不能提到内部数值或规则。',
    '规则：reason 只能简短说明话术和商品匹配原因，不能提到内部数值、系统规则或游戏机制。',
    '规则：reason 不直接作为顾客发言，后续可以给前端系统提示使用。',
  ].join('\n');
}

function normalizeGameResponse(parsed, payload) {
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const message = stringValue(parsed.message || parsed.content || parsed.text);
  const desireDelta = numberValue(parsed.desireDelta ?? parsed.delta ?? parsed.desire_delta);
  const currentDesire = numberValue(parsed.currentDesire ?? parsed.desire ?? parsed.current_desire);
  const decision = normalizeDecision(parsed.decision || parsed.purchaseDecision || parsed.purchase_decision, 'pending');
  const reason = stringValue(parsed.reason || parsed.explanation || parsed.理由 || parsed.原因) || createDefaultReason(decision);
  const productId = normalizeProductId(parsed.productId ?? parsed.product_id ?? parsed.product ?? null, `${message} ${reason}`, products);

  if (!message || !reason) {
    throw new Error('model response missing required fields');
  }

  return normalizeAIResult({
    message,
    desireDelta,
    currentDesire,
    decision,
    productId,
    reason,
  }, payload);
}

function normalizeAIResult(result, payload) {
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const profile = getCustomerProfile(payload);
  const turnCount = Math.max(0, Math.floor(numberValue(payload?.turnCount) || 0));
  const availableProducts = products.filter((product) => Number(product?.amount) > 0);

  let desireDelta = Number.isFinite(result.desireDelta) ? Math.round(result.desireDelta) : 0;
  desireDelta = clamp(desireDelta, -20, 20);

  const fallbackDesire = Number.isFinite(numberValue(payload?.currentDesire)) ? numberValue(payload?.currentDesire) : 50;
  let currentDesire = Number.isFinite(result.currentDesire) ? Math.round(result.currentDesire) : Math.round(fallbackDesire + desireDelta);
  currentDesire = clamp(currentDesire, 0, 100);

  let decision = normalizeDecision(result.decision, 'pending');
  let productId = normalizeProductId(result.productId, `${result.message} ${result.reason}`, products);
  let reason = result.reason || createDefaultReason(decision);

  if (currentDesire <= 20) {
    decision = 'leave';
    productId = null;
    reason = appendReason(reason, '购买意愿过低，顾客离开');
  }

  if (currentDesire >= 80 && turnCount >= 2 && availableProducts.length > 0) {
    decision = 'buy';
    reason = appendReason(reason, '多轮沟通后顾客决定购买');
  }

  if (turnCount >= profile.maxTurns) {
    decision = currentDesire >= 50 ? 'buy' : 'leave';
    reason = appendReason(reason, '达到最大对话轮数，顾客做出最终决定');
  }

  if (availableProducts.length === 0) {
    decision = 'leave';
    productId = null;
    reason = appendReason(reason, '没有可售库存，顾客离开');
  }

  if (decision === 'buy') {
    if (!isAvailableProductId(productId, availableProducts)) {
      productId = pickAvailableProductId(availableProducts);
      reason = appendReason(reason, '已自动选择有库存商品');
    }

    if (!productId) {
      decision = 'leave';
      reason = appendReason(reason, '没有可购买商品，顾客离开');
    }
  } else {
    productId = null;
  }

  const message = isOutOfRole(result.message)
    ? getFallbackRoleReply(profile, currentDesire)
    : result.message;

  return {
    message,
    desireDelta,
    currentDesire,
    decision,
    productId,
    reason,
  };
}

function parseModelContent(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('empty model response');
  }

  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('model response is not JSON');
    }
    return JSON.parse(match[0]);
  }
}

function normalizeDecision(value, fallback = null) {
  const text = String(value || '').toLowerCase();
  if (text.includes('buy') || text.includes('购买')) return 'buy';
  if (text.includes('leave') || text.includes('离店')) return 'leave';
  if (text.includes('pending') || text.includes('暂不')) return 'pending';
  if (fallback) return fallback;
  throw new Error('invalid decision');
}

function normalizeProductId(value, message, products) {
  const text = typeof value === 'string' ? value.trim() : '';
  const normalized = text.toLowerCase();
  if (text && normalized !== 'null' && normalized !== 'none' && text !== '无') {
    const direct = products.find((product) => product.id === text || product.name === text);
    if (direct) return direct.id;
  }

  const byMessage = products.find((product) => String(message || '').includes(product.id) || String(message || '').includes(product.name));
  return byMessage?.id ?? null;
}

function isAvailableProductId(productId, availableProducts) {
  return !!productId && availableProducts.some((product) => product.id === productId && Number(product.amount) > 0);
}

function pickAvailableProductId(availableProducts) {
  return availableProducts.find((product) => Number(product.amount) > 0)?.id ?? null;
}

function appendReason(reason, extra) {
  return reason.includes(extra) ? reason : `${reason}；${extra}`;
}

function isOutOfRole(message) {
  const text = String(message || '').toLowerCase();
  const forbiddenTerms = [
    '我是ai',
    '作为ai',
    '作为语言模型',
    '我无法',
    'prompt',
    'api',
    '代码',
    '游戏机制',
    '购买欲望',
    '系统提示',
  ];

  return forbiddenTerms.some((term) => text.includes(term));
}

function getFallbackRoleReply(profile, currentDesire) {
  return currentDesire >= 50
    ? profile.fallbackPositiveReply
    : profile.fallbackNegativeReply;
}

function getCustomerProfile(payload) {
  const customer = payload?.customer || {};
  // 兼容未来可能直接传 customerType 的情况；当前 Cocos 主要传 customer.id 和 displayName。
  const rawType = payload?.customerType
    ?? customer.customerType
    ?? customer.type
    ?? customer.id
    ?? customer.displayName
    ?? '';
  const key = normalizeCustomerType(rawType);
  return CUSTOMER_PROFILES[key] ?? DEFAULT_CUSTOMER_PROFILE;
}

function normalizeCustomerType(value) {
  const text = String(value || '').trim().toLowerCase();
  const aliases = {
    introvert: 'introvert',
    '社恐内向型': 'introvert',
    expert: 'expert',
    '挑剔达人型': 'expert',
    artistic: 'artistic',
    '文艺青年型': 'artistic',
    social: 'social',
    '社牛自来熟型': 'social',
    worker: 'worker',
    '赶时间上班族': 'worker',
    hesitant: 'hesitant',
    '纠结选择困难型': 'hesitant',
  };

  return aliases[text] ?? text;
}

function createDefaultReason(decision) {
  if (decision === 'buy') return '顾客购买欲望较高，决定购买';
  if (decision === 'leave') return '顾客购买欲望较低，决定离店';
  return '顾客仍在考虑，需要继续对话';
}

function createErrorGameResponse(payload, error) {
  const rawDesire = numberValue(payload?.currentDesire);
  const currentDesire = Number.isFinite(rawDesire) ? clamp(Math.round(rawDesire), 0, 100) : 50;
  const message = error instanceof Error ? error.message : 'unknown server error';

  return {
    message: '我刚才有点没听清，可以再说一遍吗？',
    desireDelta: 0,
    currentDesire,
    decision: 'pending',
    productId: null,
    reason: `真实 AI 请求失败：${message}`,
  };
}

function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        rejectBody(new Error('request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        rejectBody(new Error('invalid JSON body'));
      }
    });
    req.on('error', rejectBody);
  });
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function arrayText(value) {
  return Array.isArray(value) ? value.join('、') : '';
}

function formatExamples(examples) {
  if (!Array.isArray(examples) || examples.length === 0) {
    return '无';
  }

  return examples
    .map((example, index) => `${index + 1}. 玩家：${example.player} / 顾客：${example.customer}`)
    .join('\n');
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(/[+＋]/g, '').trim());
  return Number.NaN;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isUsableApiKey(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && !value.includes('填入')
    && /^[\x20-\x7E]+$/.test(value);
}
