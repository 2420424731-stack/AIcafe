export enum ProductTier {
    Basic = 'basic',
    Advanced = 'advanced',
    Limited = 'limited',
}

export enum ProductShelfLife {
    Fresh = 'fresh',
    Dry = 'dry',
}

export interface ProductData {
    id: string;
    name: string;
    tier: ProductTier;
    unlockStar: number;
    cost: number;
    suggestedPrice: number;
    description: string;
    shelfLife: ProductShelfLife;
    tags: string[];
}

export const PRODUCT_LIST: ProductData[] = [
    {
        id: 'americano',
        name: '美式咖啡',
        tier: ProductTier.Basic,
        unlockStar: 1,
        cost: 4,
        suggestedPrice: 14,
        description: '清爽直接，适合赶时间和基础需求顾客。',
        shelfLife: ProductShelfLife.Fresh,
        tags: ['coffee', 'fast', 'bitter', 'takeaway'],
    },
    {
        id: 'latte',
        name: '拿铁',
        tier: ProductTier.Basic,
        unlockStar: 1,
        cost: 6,
        suggestedPrice: 18,
        description: '口感温和，适合大多数顾客。',
        shelfLife: ProductShelfLife.Fresh,
        tags: ['coffee', 'mild', 'popular', 'comfort'],
    },
    {
        id: 'croissant',
        name: '原味牛角包',
        tier: ProductTier.Basic,
        unlockStar: 1,
        cost: 5,
        suggestedPrice: 16,
        description: '基础甜点，可提高客单价。',
        shelfLife: ProductShelfLife.Fresh,
        tags: ['dessert', 'food', 'fast', 'takeaway', 'popular'],
    },
    {
        id: 'coconut_latte',
        name: '生椰拿铁',
        tier: ProductTier.Advanced,
        unlockStar: 2,
        cost: 9,
        suggestedPrice: 26,
        description: '进阶款饮品，适合喜欢新鲜口味的顾客。',
        shelfLife: ProductShelfLife.Fresh,
        tags: ['coffee', 'mild', 'sweet', 'popular', 'comfort'],
    },
    {
        id: 'tiramisu',
        name: '提拉米苏',
        tier: ProductTier.Advanced,
        unlockStar: 2,
        cost: 12,
        suggestedPrice: 30,
        description: '高利润甜品，适合氛围型和高消费顾客。',
        shelfLife: ProductShelfLife.Fresh,
        tags: ['dessert', 'relax', 'art', 'sweet', 'premium'],
    },
    {
        id: 'blue_mountain',
        name: '蓝山手冲',
        tier: ProductTier.Limited,
        unlockStar: 4,
        cost: 18,
        suggestedPrice: 45,
        description: '限定高客单产品，适合高购买欲望顾客。',
        shelfLife: ProductShelfLife.Dry,
        tags: ['coffee', 'premium', 'story', 'bitter'],
    },
];

export function getUnlockedProducts(star: number): ProductData[] {
    return PRODUCT_LIST.filter((product) => product.unlockStar <= star);
}

export function findProduct(productId: string): ProductData | undefined {
    return PRODUCT_LIST.find((product) => product.id === productId);
}
