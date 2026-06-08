/**
 * Prompt 质量测试 — 验证 6 种性格的返回格式和内容质量
 *
 * 用法: node test-prompts.js
 *
 * 对每种性格发送同一条玩家消息，验证：
 * 1. 返回格式正确（6 个字段，类型正确）
 * 2. desireDelta 在 [-20, 20] 范围内
 * 3. currentDesire 在 [0, 100] 范围内
 * 4. decision 是有效值
 * 5. productId 在 buy 时有效
 * 6. message 是自然中文（不含 AI 泄露词）
 * 7. 回复长度合理
 */

const baseUrl = (process.env.CHECK_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const PERSONALITIES = ['introvert', 'expert', 'artistic', 'social', 'worker', 'hesitant'];

const CUSTOMERS = {
  introvert: { id: 'introvert', name: '小林', patience: 3 },
  expert: { id: 'expert', name: '陈老师', patience: 4 },
  artistic: { id: 'artistic', name: '阿岚', patience: 4 },
  social: { id: 'social', name: '大宇', patience: 4 },
  worker: { id: 'worker', name: '周姐', patience: 2 },
  hesitant: { id: 'hesitant', name: '米米', patience: 4 },
};

const PLAYER_MESSAGES = [
  '你好，今天想喝点什么？',
  '我们今天的美式很不错，用的是中深烘焙的豆子。',
];

async function main() {
  console.log('=== Prompt 质量测试 ===\n');

  let totalTests = 0;
  let passedTests = 0;
  const results = {};

  for (const personality of PERSONALITIES) {
    console.log(`--- ${personality} (${CUSTOMERS[personality].name}) ---`);
    results[personality] = [];

    for (const msg of PLAYER_MESSAGES) {
      totalTests++;
      const result = await testSingle(personality, msg);
      results[personality].push(result);

      if (result.passed) {
        passedTests++;
        console.log(`  ✅ "${msg.slice(0, 20)}..." → ${result.response.decision} d=${result.response.currentDesire} "${result.response.message.slice(0, 30)}..."`);
      } else {
        console.log(`  ❌ "${msg.slice(0, 20)}..." → ${result.errors.join('; ')}`);
      }
    }
    console.log('');
  }

  // 汇总报告
  console.log('=== 测试报告 ===');
  console.log(`通过: ${passedTests}/${totalTests} (${Math.round(passedTests / totalTests * 100)}%)`);

  // 每性格统计
  for (const personality of PERSONALITIES) {
    const personalityResults = results[personality];
    const passed = personalityResults.filter((r) => r.passed).length;
    const decisions = personalityResults.map((r) => r.response.decision);
    const avgDesireDelta = personalityResults
      .filter((r) => r.passed)
      .reduce((sum, r) => sum + r.response.desireDelta, 0) / Math.max(passed, 1);

    console.log(`  ${personality}: ${passed}/${personalityResults.length} 通过, 决策分布: ${JSON.stringify(countBy(decisions))}, 平均欲望变化: ${avgDesireDelta.toFixed(1)}`);
  }

  // 检查所有性格是否都有区分
  const allMessages = Object.values(results).flat().filter((r) => r.passed).map((r) => r.response.message);
  const uniqueMessages = new Set(allMessages);
  if (uniqueMessages.size < allMessages.length * 0.5) {
    console.log('\n⚠️  警告：AI 回复重复率偏高，性格区分度可能不足');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

async function testSingle(personality, playerMessage) {
  const errors = [];
  const payload = {
    customer: CUSTOMERS[personality],
    playerMessage,
    currentDesire: 50,
    forceDecision: false,
    turnCount: 1,
    dayNumber: 1,
    products: [
      { id: 'americano', name: '美式咖啡', price: 14, amount: 3, tags: ['coffee', 'fast', 'bitter'], description: '清爽直接' },
      { id: 'latte', name: '拿铁', price: 18, amount: 5, tags: ['coffee', 'mild', 'popular'], description: '温和顺口' },
      { id: 'croissant', name: '原味牛角包', price: 16, amount: 2, tags: ['dessert', 'food', 'fast', 'popular'], description: '金黄酥脆' },
    ],
  };

  let response;
  try {
    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { passed: false, errors: [`HTTP ${resp.status}: ${text.slice(0, 100)}`], response: null };
    }

    response = await resp.json();
  } catch (error) {
    return { passed: false, errors: [error.message], response: null };
  }

  // 格式校验
  if (typeof response.message !== 'string' || !response.message.trim()) {
    errors.push('message 缺失或为空');
  }
  if (!Number.isFinite(response.desireDelta) || response.desireDelta < -20 || response.desireDelta > 20) {
    errors.push(`desireDelta 超出范围: ${response.desireDelta}`);
  }
  if (!Number.isFinite(response.currentDesire) || response.currentDesire < 0 || response.currentDesire > 100) {
    errors.push(`currentDesire 超出范围: ${response.currentDesire}`);
  }
  if (!['buy', 'leave', 'pending'].includes(response.decision)) {
    errors.push(`decision 无效: ${response.decision}`);
  }
  if (response.decision === 'buy' && (!response.productId || typeof response.productId !== 'string')) {
    errors.push('decision=buy 时 productId 缺失');
  }
  if (typeof response.reason !== 'string' || !response.reason.trim()) {
    errors.push('reason 缺失或为空');
  }

  // 内容校验
  const aiLeakTerms = ['我是AI', '作为AI', '作为语言模型', 'prompt', 'API', '游戏机制', '系统提示'];
  const hasLeak = aiLeakTerms.some((term) => (response.message || '').toLowerCase().includes(term.toLowerCase()));
  if (hasLeak) {
    errors.push('AI 角色泄露');
  }

  // 长度校验
  if (response.message && response.message.length > 300) {
    errors.push(`回复过长: ${response.message.length} 字`);
  }
  if (response.message && response.message.length < 3) {
    errors.push(`回复过短: ${response.message.length} 字`);
  }

  return { passed: errors.length === 0, errors, response };
}

function countBy(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return counts;
}

main();
