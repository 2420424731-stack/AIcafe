/**
 * API 连通性检查脚本
 * 用法: node check-api.js [--chat] [--count N]
 */

const baseUrl = (process.env.CHECK_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const runChatTest = process.argv.includes('--chat');
const countArg = process.argv.indexOf('--count');
const testCount = countArg > -1 ? Number(process.argv[countArg + 1]) || 5 : 5;

async function main() {
  // 1. 健康检查
  try {
    const health = await fetchJson(`${baseUrl}/health`, { method: 'GET' });
    console.log('[health]', JSON.stringify(health, null, 2));

    if (!health.ok) {
      console.log('❌ 后端健康检查未通过');
      process.exitCode = 1;
    }

    if (!health.modelOk) {
      console.log('⚠️  ARK_API_KEY 未正确配置，AI 请求会失败');
    } else {
      console.log('✅ API Key 已配置');
    }
  } catch (error) {
    console.error('❌ 无法连接后端:', error.message);
    process.exit(1);
  }

  // 2. GET /api/chat (should return 405)
  try {
    const resp = await fetch(`${baseUrl}/api/chat`);
    console.log(`[GET /api/chat] ${resp.status} (expected 405)`);
  } catch {}

  // 3. POST /api/chat with invalid body (should return 400)
  try {
    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await resp.json();
    console.log(`[POST /api/chat - invalid] ${resp.status} ${JSON.stringify(body)}`);
  } catch {}

  // 4. Real chat test (if --chat)
  if (!runChatTest) {
    console.log('\n基础连接检查完成。加 --chat 参数可测试真实模型调用。');
    return;
  }

  console.log(`\n--- 真实模型测试 (${testCount} 次) ---`);
  let success = 0, fail = 0;
  const latencies = [];

  for (let i = 0; i < testCount; i++) {
    const personality = ['introvert', 'expert', 'artistic', 'social', 'worker', 'hesitant'][i % 6];
    const payload = buildSamplePayload(personality);
    const start = Date.now();

    try {
      const result = await fetchJson(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const latency = Date.now() - start;
      latencies.push(latency);

      // 验证返回格式
      const valid = result.message && typeof result.desireDelta === 'number'
        && typeof result.currentDesire === 'number'
        && ['buy', 'leave', 'pending'].includes(result.decision);

      if (valid) {
        success++;
        console.log(`  [${i + 1}] ✅ ${latency}ms ${result.decision} desire=${result.currentDesire} "${result.message.slice(0, 30)}..."`);
      } else {
        fail++;
        console.log(`  [${i + 1}] ⚠️  格式异常: ${JSON.stringify(result).slice(0, 100)}`);
      }
    } catch (error) {
      fail++;
      console.log(`  [${i + 1}] ❌ ${error.message.slice(0, 80)}`);
    }
  }

  // 统计
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const p95Latency = latencies.length > 0
    ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
    : 0;

  console.log(`\n--- 结果 ---`);
  console.log(`成功率: ${success}/${testCount} (${Math.round(success / testCount * 100)}%)`);
  console.log(`平均延迟: ${avgLatency}ms`);
  console.log(`P95 延迟: ${p95Latency}ms`);

  if (fail > 0) process.exitCode = 1;
}

function buildSamplePayload(personalityId) {
  const customers = {
    introvert: { id: 'introvert', name: '小林', patience: 3 },
    expert: { id: 'expert', name: '陈老师', patience: 4 },
    artistic: { id: 'artistic', name: '阿岚', patience: 4 },
    social: { id: 'social', name: '大宇', patience: 4 },
    worker: { id: 'worker', name: '周姐', patience: 2 },
    hesitant: { id: 'hesitant', name: '米米', patience: 4 },
  };

  const messages = {
    introvert: '不用急，你慢慢看，不喜欢也没关系。',
    expert: '这杯美式采用中深烘焙，酸度低，尾段有坚果和黑巧克力的风味。',
    artistic: '这杯拿铁喝起来像冬天午后的阳光，温暖又温柔。',
    social: '哈哈老朋友来了！今天推荐你试试我们的招牌拿铁。',
    worker: '美式最快，两分钟打包好。',
    hesitant: '拿铁和美式里我建议拿铁，更温和，不容易踩雷。',
  };

  return {
    customer: customers[personalityId],
    playerMessage: messages[personalityId],
    currentDesire: 50,
    forceDecision: false,
    turnCount: 1,
    dayNumber: 1,
    products: [
      { id: 'americano', name: '美式咖啡', price: 14, amount: 3, tags: ['coffee', 'fast', 'bitter'], description: '清爽直接' },
      { id: 'latte', name: '拿铁', price: 18, amount: 5, tags: ['coffee', 'mild', 'popular'], description: '温和顺口' },
    ],
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`${url} returned non-JSON: ${text.slice(0, 160)}`);
  }
  if (!response.ok) {
    throw new Error(`${url} ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

main();
