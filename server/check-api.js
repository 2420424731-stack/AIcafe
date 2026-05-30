const baseUrl = (process.env.CHECK_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const runChatTest = process.argv.includes('--chat');

try {
  const health = await fetchJson(`${baseUrl}/health`, { method: 'GET' });
  console.log('[health]', JSON.stringify(health));

  if (!health.ok) {
    console.log('后端健康检查未通过。');
    process.exitCode = 1;
  }

  if (!health.keyConfigured) {
    console.log('ARK_API_KEY 未正确配置，真实 AI 聊天会失败。');
  }

  const chatGet = await fetch(`${baseUrl}/api/chat`);
  console.log(`[GET /api/chat] ${chatGet.status}`);

  if (!runChatTest) {
    console.log('基础连接检查完成。如需真实调用模型，请运行：npm run check:chat');
  } else {
    const chat = await fetchJson(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSamplePayload()),
    });
    console.log('[POST /api/chat]', JSON.stringify(chat));
  }
} catch (error) {
  console.error('API 检查失败：', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${url} 返回的不是 JSON：${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(`${url} 请求失败：${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function buildSamplePayload() {
  return {
    customer: {
      id: 'worker',
      name: '周姐',
      displayName: '赶时间上班族',
      traits: '节奏快、目标明确，追求效率。',
      conversationPreference: '极简、高效、直击重点。',
      likes: ['快速响应', '推荐便捷产品', '告知出餐速度'],
      dislikes: ['闲聊啰嗦', '推荐复杂产品', '多轮无效对话'],
      likesKeywords: ['快', '马上', '打包', '带走', '方便'],
      dislikesKeywords: ['慢慢选', '坐一会', '复杂', '等一下'],
      preferredProductTags: ['fast', 'coffee', 'takeaway'],
      decisionStyle: 'fast_decision',
      priceSensitivity: 0.8,
      patience: 2,
    },
    playerMessage: '美式最快，马上可以打包带走。',
    currentDesire: 55,
    forceDecision: false,
    dialogue: {
      currentRound: 1,
      roundLimit: 2,
    },
    ruleSuggestion: {
      message: '能快点就行，那我就要这个。',
      desireDelta: 14,
      currentDesire: 69,
      decision: 'buy',
      productId: 'americano',
    },
    products: [
      {
        id: 'americano',
        name: '美式咖啡',
        tags: ['coffee', 'fast', 'bitter', 'takeaway'],
        description: '清爽直接，适合赶时间和基础需求顾客。',
        suggestedPrice: 14,
        cost: 4,
        amount: 3,
        price: 14,
      },
    ],
  };
}
