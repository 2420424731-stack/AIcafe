const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: {
      id: 'artistic',
      name: '阿岚',
      displayName: '文艺青年型',
      traits: '注重氛围和故事',
      conversationPreference: '有温度、有内容',
      likes: ['分享故事'],
      dislikes: ['功利推销'],
      likesKeywords: ['故事', '氛围'],
      dislikesKeywords: ['快点'],
      preferredProductTags: ['sweet', 'special'],
      decisionStyle: 'normal',
      priceSensitivity: 1,
    },
    playerMessage: '这杯拿铁口感温和，有淡淡奶香，适合慢慢喝。',
    currentDesire: 45,
    forceDecision: false,
    products: [
      {
        id: 'latte',
        name: '拿铁',
        tags: ['coffee', 'milk'],
        description: '温和顺口',
        suggestedPrice: 18,
        cost: 6,
        amount: 3,
        price: 18,
      },
    ],
  }),
});

console.log(response.status);
console.log(await response.text());
