/**
 * 负载测试 — 模拟多用户并发
 *
 * 用法: node test-load.js [--concurrent N] [--turns M]
 * 默认: 3 并发 × 5 轮
 */

const baseUrl = (process.env.CHECK_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const concurrentArg = process.argv.indexOf('--concurrent');
const CONCURRENT = concurrentArg > -1 ? Number(process.argv[concurrentArg + 1]) || 3 : 3;
const turnsArg = process.argv.indexOf('--turns');
const TURNS = turnsArg > -1 ? Number(process.argv[turnsArg + 1]) || 5 : 5;

const PERSONALITIES = ['introvert', 'expert', 'artistic', 'social', 'worker', 'hesitant'];

async function main() {
  console.log(`=== 负载测试: ${CONCURRENT} 并发 × ${TURNS} 轮 ===\n`);

  const startTime = Date.now();
  const allResults = [];
  const errors = [];

  // 创建并发用户
  const users = Array.from({ length: CONCURRENT }, (_, i) => ({
    id: i,
    personality: PERSONALITIES[i % PERSONALITIES.length],
  }));

  // 每用户单独跑 TURNS 轮
  const userPromises = users.map(async (user) => {
    const userResults = [];
    let currentDesire = 50;

    for (let turn = 0; turn < TURNS; turn++) {
      const payload = {
        customer: { id: user.personality, name: `顾客${user.id}`, patience: 4 },
        playerMessage: getPlayerMessage(turn),
        currentDesire,
        forceDecision: turn >= TURNS - 1,
        turnCount: turn + 1,
        dayNumber: 1,
        products: [
          { id: 'americano', name: '美式咖啡', price: 14, amount: 3, tags: ['coffee', 'fast'], description: '清爽' },
          { id: 'latte', name: '拿铁', price: 18, amount: 5, tags: ['coffee', 'mild'], description: '温和' },
        ],
      };

      try {
        const start = Date.now();
        const resp = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
        });
        const latency = Date.now() - start;

        if (resp.ok) {
          const data = await resp.json();
          currentDesire = data.currentDesire;
          userResults.push({ turn, latency, ok: true, decision: data.decision, desire: data.currentDesire });
        } else {
          userResults.push({ turn, latency, ok: false, status: resp.status });
          errors.push(`user ${user.id} turn ${turn}: HTTP ${resp.status}`);
        }
      } catch (error) {
        userResults.push({ turn, latency: 0, ok: false, error: error.message });
        errors.push(`user ${user.id} turn ${turn}: ${error.message}`);
      }
    }
    return userResults;
  });

  const allUserResults = await Promise.all(userPromises);
  const totalTime = Date.now() - startTime;

  // 统计
  const allLatencies = allUserResults.flat().filter((r) => r.ok).map((r) => r.latency);
  const totalRequests = CONCURRENT * TURNS;
  const successCount = allLatencies.length;

  const sorted = [...allLatencies].sort((a, b) => a - b);
  const avg = sorted.length > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const max = sorted[sorted.length - 1] || 0;

  console.log('--- 结果 ---');
  console.log(`总耗时: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`总请求: ${totalRequests}, 成功: ${successCount}, 失败: ${totalRequests - successCount}`);
  console.log(`成功率: ${Math.round(successCount / totalRequests * 100)}%`);
  console.log(`平均延迟: ${avg}ms`);
  console.log(`P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms, Max: ${max}ms`);

  if (errors.length > 0) {
    console.log(`\n错误列表:`);
    errors.forEach((e) => console.log(`  ${e}`));
  }

  process.exit(successCount === totalRequests ? 0 : 1);
}

function getPlayerMessage(turn) {
  const messages = [
    '你好，想喝什么？',
    '我们的拿铁很受欢迎，口感温和。',
    '美式咖啡也很快，两分钟就好。',
    '如果你喜欢甜的，可以试试搭配牛角包。',
    '怎么样，决定好了吗？',
  ];
  return messages[turn % messages.length];
}

main();
