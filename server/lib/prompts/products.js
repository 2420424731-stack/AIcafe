/**
 * 商品列表 Prompt 格式化
 * 将客户端传来的商品数组转换为 LLM 可理解的结构化文本
 */

/**
 * 格式化商品列表为提示词文本
 * @param {Array} products - 商品数组 [{id, name, price, amount, tags, description}]
 * @returns {string} 格式化后的商品文本
 */
export function formatProducts(products) {
  const list = Array.isArray(products) ? products : [];

  if (list.length === 0) {
    return '当前没有可售商品（所有商品已售罄或未进货）。';
  }

  const lines = list.map((product) => {
    return [
      `id=${product.id}`,
      `名称=${product.name}`,
      `售价=${product.price}元`,
      `库存=${product.amount}份`,
      `标签=${Array.isArray(product.tags) ? product.tags.join('/') : ''}`,
      `描述=${product.description || '暂无描述'}`,
    ].join('，');
  });

  return `【咖啡店商品】
可购买商品：
${lines.join('\n')}

（只有以上列出的商品可以推荐和购买，库存为 0 的商品不能推荐）`;
}

/**
 * 生成库存不足时的提示
 * @param {Array} products
 * @returns {string}
 */
export function formatLowStockWarning(products) {
  const list = Array.isArray(products) ? products : [];
  const lowStock = list.filter((p) => Number(p.amount) <= 2 && Number(p.amount) > 0);

  if (lowStock.length === 0) return '';

  const names = lowStock.map((p) => p.name).join('、');
  return `\n注意：以下商品库存紧张 — ${names}。在推荐时可以提及"数量有限"。`;
}
