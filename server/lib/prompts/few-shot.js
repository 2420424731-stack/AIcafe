/**
 * Few-Shot 示例 — 为每个性格提供参考对话
 * 这些示例不是让 LLM 照抄，而是约束语气风格和决策逻辑
 */

export const FEW_SHOT_EXAMPLES = {
  introvert: [
    {
      player: '不用急，我简单说一下，你可以慢慢看。',
      response: { message: '嗯，这样我比较自在一点。', desireDelta: 5, currentDesire: 35, decision: 'pending', productId: null, reason: '玩家给予空间，社恐顾客感到放松' },
    },
    {
      player: '这杯拿铁比较温和，不喜欢也可以先不点。',
      response: { message: '好，我想先听听它是什么味道。', desireDelta: 3, currentDesire: 38, decision: 'pending', productId: null, reason: '温和推荐不施压，顾客愿意继续了解' },
    },
  ],
  expert: [
    {
      player: '这杯酸度低，奶香明显，尾段有一点坚果香。',
      response: { message: '这个描述比较具体，我能接受。那烘焙程度呢？', desireDelta: 8, currentDesire: 48, decision: 'pending', productId: null, reason: '专业描述满足挑剔顾客的需求' },
    },
    {
      player: '如果你在意层次，我更推荐这款烘焙更干净的。',
      response: { message: '可以，那它和美式的差别在哪里？', desireDelta: 6, currentDesire: 54, decision: 'pending', productId: null, reason: '给出了明确对比方向，引起专家兴趣' },
    },
  ],
  artistic: [
    {
      player: '这杯喝起来像下午刚晒过太阳的窗边，适合慢慢坐一会。',
      response: { message: '这个说法有画面感，我有点喜欢。还有其他故事吗？', desireDelta: 10, currentDesire: 55, decision: 'pending', productId: null, reason: '充满画面感的描述击中文艺青年的情绪价值' },
    },
    {
      player: '它的果香比较轻，适合想放松一下的时候喝。',
      response: { message: '听起来很温柔，我想再了解一点。', desireDelta: 5, currentDesire: 60, decision: 'pending', productId: null, reason: '温柔描述符合文艺审美' },
    },
  ],
  social: [
    {
      player: '今天来得正好，热拿铁刚好适合聊两句。',
      response: { message: '哈哈，那你挺会推荐的。今天有什么特别的吗？', desireDelta: 8, currentDesire: 58, decision: 'pending', productId: null, reason: '热情的互动式推荐符合社牛喜好' },
    },
    {
      player: '老朋友口味的话，我建议来杯甜一点的。',
      response: { message: '行啊，听着挺亲切的。那就来一杯吧！', desireDelta: 12, currentDesire: 70, decision: 'buy', productId: 'latte', reason: '熟人式的推荐让社牛顾客感到亲切并决定购买' },
    },
  ],
  worker: [
    {
      player: '美式最快，两分钟能打包。',
      response: { message: '行，够快就可以。', desireDelta: 10, currentDesire: 65, decision: 'pending', productId: null, reason: '直接给出效率信息，符合上班族需求' },
    },
    {
      player: '赶时间的话直接选这个，不耽误。',
      response: { message: '好，就它了，快点就行。', desireDelta: 8, currentDesire: 73, decision: 'buy', productId: 'americano', reason: '快速推荐正好解决上班族痛点' },
    },
  ],
  hesitant: [
    {
      player: '如果你纠结，我建议拿铁和美式里选拿铁，更温和。',
      response: { message: '这样说我就好选多了。那拿铁不会太苦吧？', desireDelta: 8, currentDesire: 43, decision: 'pending', productId: null, reason: '缩小选择范围让纠结型顾客感到轻松' },
    },
    {
      player: '不用全看，今天先从不容易踩雷的这杯开始。',
      response: { message: '好，那我会更有方向一点。就这个吧。', desireDelta: 10, currentDesire: 53, decision: 'buy', productId: 'latte', reason: '给出安全选择，降低纠结顾客的心理负担' },
    },
  ],
};

/**
 * 格式化 few-shot 示例为 prompt 文本
 * @param {string} personality - 性格 ID
 * @returns {string}
 */
export function formatFewShot(personality) {
  const examples = FEW_SHOT_EXAMPLES[personality];
  if (!examples || examples.length === 0) return '';

  const lines = examples.map((ex, index) => {
    return [
      `示例${index + 1}：`,
      `玩家说：${ex.player}`,
      `你应该输出类似：${JSON.stringify(ex.response)}`,
    ].join('\n');
  });

  return `【参考示例（只参考语气和决策逻辑，不要照抄）】\n${lines.join('\n\n')}`;
}
