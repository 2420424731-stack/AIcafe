/**
 * AIcafe AI 后端服务 — Express 生产级架构
 *
 * 职责：
 * 1. 接收客户端对话请求
 * 2. 组装模块化 Prompt（按顾客性格）
 * 3. 调用火山引擎 Ark API (Doubao 模型)
 * 4. 校验 + 安全过滤 + 规范化 AI 响应
 * 5. 返回标准化 JSON 给 Cocos 客户端
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ── 配置加载 ──────────────────────────────────────────────
loadEnv();

const PORT = Number(process.env.PORT || 3000);
const ARK_API_KEY = process.env.ARK_API_KEY || process.env.AI_API_KEY || '';
const ARK_BASE_URL = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
const ARK_MODEL = process.env.ARK_MODEL || process.env.AI_MODEL || 'doubao-seed-2-0-mini-260428';
const ARK_MODEL_FALLBACK = process.env.ARK_MODEL_FALLBACK || '';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 8000);
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ── 模块导入 ──────────────────────────────────────────────
import { buildPrompt } from './lib/prompts/builder.js';
import { getFallbackReply, resolvePersonalityId } from './lib/prompts/personality/index.js';
import { checkPlayerInput, checkAIOutput, getSafeFallbackMessage } from './lib/safety.js';

// ── 简易日志 ──────────────────────────────────────────────
const logger = {
  _level: { debug: 0, info: 1, warn: 2, error: 3 }[LOG_LEVEL] ?? 1,
  _ts() { return new Date().toISOString(); },
  debug(msg, meta) { if (this._level <= 0) console.log(`[${this._ts()}] DEBUG ${msg}`, meta || ''); },
  info(msg, meta) { if (this._level <= 1) console.log(`[${this._ts()}] INFO  ${msg}`, meta || ''); },
  warn(msg, meta) { if (this._level <= 2) console.warn(`[${this._ts()}] WARN  ${msg}`, meta || ''); },
  error(msg, meta) { if (this._level <= 3) console.error(`[${this._ts()}] ERROR ${msg}`, meta || ''); },
};

// ── 简易限流 ──────────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 2000;
const RATE_LIMIT_MAX = 1; // 每窗口最多 1 次 chat 请求

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (entry && now - entry.timestamp < RATE_LIMIT_WINDOW_MS) {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return false;
  } else {
    rateLimitStore.set(ip, { timestamp: now, count: 1 });
  }
  return true;
}

// 定期清理过期限流记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS * 2) rateLimitStore.delete(ip);
  }
}, 60000);

// ── 请求/响应工具 ─────────────────────────────────────────
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
      try { resolveBody(body ? JSON.parse(body) : {}); }
      catch { rejectBody(new Error('invalid JSON body')); }
    });
    req.on('error', rejectBody);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ── 请求校验 ──────────────────────────────────────────────
function validateChatRequest(payload) {
  const errors = [];
  if (!payload.customer || typeof payload.customer !== 'object') {
    errors.push('customer is required');
  }
  if (typeof payload.playerMessage !== 'string' || !payload.playerMessage.trim()) {
    errors.push('playerMessage is required (non-empty string)');
  }
  if (payload.playerMessage && payload.playerMessage.length > 500) {
    errors.push('playerMessage too long (max 500 chars)');
  }
  if (payload.currentDesire !== undefined && (!Number.isFinite(Number(payload.currentDesire)) || Number(payload.currentDesire) < 0 || Number(payload.currentDesire) > 100)) {
    errors.push('currentDesire must be number 0-100');
  }
  if (!Array.isArray(payload.products)) {
    errors.push('products array is required');
  }
  return errors;
}

// ── AI 核心逻辑 ───────────────────────────────────────────
async function chatWithModel(payload) {
  if (!isUsableApiKey(ARK_API_KEY)) {
    throw new Error('ARK_API_KEY is not set');
  }

  const prompt = buildPrompt(payload);
  const models = [ARK_MODEL, ARK_MODEL_FALLBACK].filter(Boolean);

  let lastError;
  for (const model of models) {
    try {
      logger.debug(`calling model: ${model}`);
      const response = await fetchWithTimeout(`${ARK_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ARK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          reasoning: { effort: 'minimal' },
          max_output_tokens: 256,
          input: [
            { role: 'system', content: [{ type: 'input_text', text: '你是《AI客来：街角咖啡屋》的顾客 AI。必须只输出包含固定字段的 JSON，不要输出 Markdown。' }] },
            { role: 'user', content: [{ type: 'input_text', text: prompt }] },
          ],
        }),
      }, AI_TIMEOUT_MS + (models.indexOf(model) * 2000));

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`model ${model} returned ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = getArkOutputText(data);
      const parsed = parseModelContent(content);
      const normalized = normalizeGameResponse(parsed, payload);

      // 内容安全检查
      const safetyCheck = checkAIOutput(normalized.message);
      if (!safetyCheck.ok) {
        logger.warn(`AI output flagged: ${safetyCheck.reason}`, { model, message: normalized.message.slice(0, 100) });
        normalized.message = getSafeFallbackMessage(
          resolvePersonalityId(payload?.customer?.id),
          normalized.currentDesire,
        );
        normalized.desireDelta = 0;
        normalized.reason = `safety_filter: ${safetyCheck.reason}`;
      }

      return normalized;
    } catch (error) {
      lastError = error;
      logger.warn(`model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('all models failed');
}

// ── 响应解析与规范化 ─────────────────────────────────────
function parseModelContent(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('empty model response');
  }
  const trimmed = content.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('model response is not JSON');
  return JSON.parse(match[0]);
}

function getArkOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    if (item?.type && item.type !== 'message') continue;
    for (const part of (Array.isArray(item?.content) ? item.content : [])) {
      if (typeof part?.output_text === 'string') return part.output_text;
      if (typeof part?.text === 'string') return part.text;
    }
  }
  if (typeof data?.choices?.[0]?.message?.content === 'string') return data.choices[0].message.content;
  throw new Error('empty model response');
}

function normalizeGameResponse(parsed, payload) {
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const message = stringValue(parsed.message || parsed.content || parsed.text);
  const desireDelta = numberValue(parsed.desireDelta ?? parsed.delta ?? parsed.desire_delta);
  const currentDesire = numberValue(parsed.currentDesire ?? parsed.desire ?? parsed.current_desire);
  const decision = normalizeDecision(parsed.decision || parsed.purchaseDecision || parsed.purchase_decision, 'pending');
  const reason = stringValue(parsed.reason || parsed.explanation || '') || createDefaultReason(decision);
  const productId = normalizeProductId(parsed.productId ?? parsed.product_id ?? parsed.product ?? null, `${message} ${reason}`, products);

  if (!message) throw new Error('model response missing message field');

  return normalizeAIResult({ message, desireDelta, currentDesire, decision, productId, reason }, payload);
}

function normalizeAIResult(result, payload) {
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const turnCount = Math.max(0, Math.floor(numberValue(payload?.turnCount) || 0));
  const availableProducts = products.filter((p) => Number(p.amount) > 0);
  const personalityId = resolvePersonalityId(payload?.customer?.id);
  const maxTurns = payload?.customer?.patience || 4;

  let desireDelta = Number.isFinite(result.desireDelta) ? Math.round(result.desireDelta) : 0;
  desireDelta = clamp(desireDelta, -20, 20);

  const fallbackDesire = Number.isFinite(numberValue(payload?.currentDesire)) ? numberValue(payload?.currentDesire) : 50;
  let currentDesire = Number.isFinite(result.currentDesire) ? Math.round(result.currentDesire) : Math.round(fallbackDesire + desireDelta);
  currentDesire = clamp(currentDesire, 0, 100);

  let decision = normalizeDecision(result.decision, 'pending');
  let productId = normalizeProductId(result.productId, `${result.message} ${result.reason}`, products);
  let reason = result.reason || createDefaultReason(decision);

  // 强制决策逻辑
  if (currentDesire <= 20) {
    decision = 'leave';
    productId = null;
    reason = appendReason(reason, '购买意愿过低，顾客离开');
  }

  if (currentDesire >= 80 && turnCount >= 2 && availableProducts.length > 0) {
    decision = 'buy';
    reason = appendReason(reason, '多轮沟通后顾客决定购买');
  }

  if (turnCount >= maxTurns) {
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

  // 角色泄露检测
  if (isOutOfRole(result.message)) {
    result.message = getFallbackReply(personalityId, currentDesire);
    reason = appendReason(reason, 'AI回复越界，已替换为兜底回复');
  }

  return {
    message: result.message,
    desireDelta,
    currentDesire,
    decision,
    productId,
    reason,
  };
}

// ── 工具函数 ──────────────────────────────────────────────
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
  if (text && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'none' && text !== '无') {
    const direct = products.find((p) => p.id === text || p.name === text);
    if (direct) return direct.id;
  }
  const byMessage = products.find((p) => String(message || '').includes(p.id) || String(message || '').includes(p.name));
  return byMessage?.id ?? null;
}

function isAvailableProductId(productId, availableProducts) {
  return !!productId && availableProducts.some((p) => p.id === productId && Number(p.amount) > 0);
}

function pickAvailableProductId(availableProducts) {
  return availableProducts.find((p) => Number(p.amount) > 0)?.id ?? null;
}

function appendReason(reason, extra) {
  return reason.includes(extra) ? reason : `${reason}；${extra}`;
}

function isOutOfRole(message) {
  const text = String(message || '').toLowerCase();
  const terms = ['我是ai', '作为ai', '作为语言模型', '我无法', 'prompt', 'api', '代码', '游戏机制', '购买欲望', '系统提示'];
  return terms.some((t) => text.includes(t));
}

function createDefaultReason(decision) {
  if (decision === 'buy') return '顾客购买欲望较高，决定购买';
  if (decision === 'leave') return '顾客购买欲望较低，决定离店';
  return '顾客仍在考虑，需要继续对话';
}

function createErrorResponse(payload, error) {
  const rawDesire = numberValue(payload?.currentDesire);
  const currentDesire = Number.isFinite(rawDesire) ? clamp(Math.round(rawDesire), 0, 100) : 50;
  const personalityId = resolvePersonalityId(payload?.customer?.id);
  return {
    message: getSafeFallbackMessage(personalityId, currentDesire),
    desireDelta: 0,
    currentDesire,
    decision: 'pending',
    productId: null,
    reason: `server_error: ${error instanceof Error ? error.message : 'unknown'}`,
  };
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function stringValue(value) { return typeof value === 'string' ? value.trim() : ''; }
function numberValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(/[+＋]/g, '').trim());
  return Number.NaN;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function isUsableApiKey(value) {
  return typeof value === 'string' && value.trim().length > 0
    && !value.includes('填入') && /^[\x20-\x7E]+$/.test(value);
}

// ── 统计 ──────────────────────────────────────────────────
const stats = { requestsToday: 0, errorsToday: 0, startTime: Date.now(), totalLatencyMs: 0 };

// ── HTTP 路由 ─────────────────────────────────────────────
const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    stats.requestsToday++;
    sendJson(res, 200, {
      ok: true,
      uptime: Math.floor((Date.now() - stats.startTime) / 1000),
      model: ARK_MODEL,
      modelOk: isUsableApiKey(ARK_API_KEY),
      requestsToday: stats.requestsToday,
      errorsToday: stats.errorsToday,
      avgLatencyMs: stats.requestsToday > 0 ? Math.round(stats.totalLatencyMs / stats.requestsToday) : 0,
    });
    return;
  }

  // Chat endpoint
  if (req.url === '/api/chat') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method not allowed, use POST' });
      return;
    }

    // 限流
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(String(clientIp))) {
      sendJson(res, 429, { error: 'rate limit exceeded, please wait' });
      return;
    }

    const startTime = Date.now();
    stats.requestsToday++;

    let payload = {};
    try {
      payload = await readJsonBody(req);

      // 输入校验
      const validationErrors = validateChatRequest(payload);
      if (validationErrors.length > 0) {
        stats.errorsToday++;
        sendJson(res, 400, { error: 'validation failed', details: validationErrors });
        return;
      }

      // 内容安全检查（玩家输入）
      const inputCheck = checkPlayerInput(payload.playerMessage);
      if (!inputCheck.safe) {
        logger.warn(`input safety flag: ${inputCheck.reason}`, { ip: clientIp });
      }

      // 调用 AI
      const result = await chatWithModel(payload);
      const latency = Date.now() - startTime;
      stats.totalLatencyMs += latency;

      logger.info(`chat OK ${latency}ms decision=${result.decision} desire=${result.currentDesire}`);
      sendJson(res, 200, result);
    } catch (error) {
      stats.errorsToday++;
      const latency = Date.now() - startTime;
      logger.error(`chat FAIL ${latency}ms: ${error.message}`);

      sendJson(res, error.message.includes('not set') ? 503 : 500, createErrorResponse(payload, error));
    }
    return;
  }

  // 404
  sendJson(res, 404, { error: 'not found' });
});

// ── 启动 ──────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`AIcafe AI server started on http://localhost:${PORT}`);
  logger.info(`model: ${ARK_MODEL}${ARK_MODEL_FALLBACK ? ` (fallback: ${ARK_MODEL_FALLBACK})` : ''}`);

  if (!isUsableApiKey(ARK_API_KEY)) {
    logger.warn('ARK_API_KEY is not set or invalid — AI requests will fail');
  } else {
    logger.info('ARK_API_KEY is configured');
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
process.on('unhandledRejection', (reason) => {
  logger.error(`unhandled rejection: ${reason}`);
});
