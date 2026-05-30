export enum CustomerPersonality {
    Introvert = 'introvert',
    Expert = 'expert',
    Artistic = 'artistic',
    Social = 'social',
    Worker = 'worker',
    Hesitant = 'hesitant',
}

export interface CustomerData {
    id: CustomerPersonality;
    name: string;
    displayName: string;
    traits: string;
    conversationPreference: string;
    likes: string[];
    dislikes: string[];
    likesKeywords: string[];
    dislikesKeywords: string[];
    preferredProductTags: string[];
    priceSensitivity: number;
    patience: number;
    decisionStyle: string;
    initialDesire: number;
    unlockStar: number;
}

export const CUSTOMER_LIST: CustomerData[] = [
    {
        id: CustomerPersonality.Introvert,
        name: '小林',
        displayName: '社恐内向型',
        traits: '话少、怕过度热情，喜欢安静自主的购物环境。',
        conversationPreference: '简洁、礼貌、点到为止。',
        likes: ['温和礼貌', '告知基础信息', '给足自主空间'],
        dislikes: ['过度热情', '连续追问', '强行推销'],
        likesKeywords: ['不用急', '慢慢', '简单', '温和', '安静', '自己看看', '拿铁', '基础'],
        dislikesKeywords: ['必须', '强烈推荐', '大家都买', '快点', '马上买', '别犹豫', '一直问'],
        preferredProductTags: ['mild', 'comfort', 'popular', 'coffee'],
        priceSensitivity: 0.9,
        patience: 3,
        decisionStyle: 'careful_short',
        initialDesire: 30,
        unlockStar: 1,
    },
    {
        id: CustomerPersonality.Expert,
        name: '陈老师',
        displayName: '挑剔达人型',
        traits: '注重品质和专业度，会询问咖啡细节。',
        conversationPreference: '专业、精准、有依据。',
        likes: ['准确解答', '说明产品优势', '接受定制'],
        dislikes: ['答非所问', '敷衍回应', '专业错误'],
        likesKeywords: ['酸度', '香气', '烘焙', '口感', '层次', '手冲', '产地', '咖啡豆', '干净', '专业'],
        dislikesKeywords: ['都差不多', '随便', '不知道', '不懂', '都一样', '便宜就行', '别问'],
        preferredProductTags: ['premium', 'coffee', 'story', 'bitter'],
        priceSensitivity: 0.65,
        patience: 4,
        decisionStyle: 'detail_check',
        initialDesire: 40,
        unlockStar: 1,
    },
    {
        id: CustomerPersonality.Artistic,
        name: '阿岚',
        displayName: '文艺青年型',
        traits: '注重氛围、故事和生活感，消费能力较强。',
        conversationPreference: '有温度、有内容、有共鸣。',
        likes: ['分享故事', '共情表达', '聊生活审美'],
        dislikes: ['功利推销', '低俗敷衍', '否定审美'],
        likesKeywords: ['故事', '氛围', '果香', '慢慢喝', '坐下来', '生活', '温柔', '手作', '灵感', '春日'],
        dislikesKeywords: ['便宜', '快点买', '赶紧', '划算就行', '别装', '买不买', '功利'],
        preferredProductTags: ['story', 'art', 'relax', 'premium', 'dessert'],
        priceSensitivity: 0.7,
        patience: 4,
        decisionStyle: 'mood_driven',
        initialDesire: 45,
        unlockStar: 1,
    },
    {
        id: CustomerPersonality.Social,
        name: '大宇',
        displayName: '社牛自来熟型',
        traits: '话多，喜欢闲聊，重视亲切感。',
        conversationPreference: '热情、接地气、能接住话题。',
        likes: ['积极回应', '记住偏好', '朋友式沟通'],
        dislikes: ['冷漠敷衍', '打断对话', '急着结束'],
        likesKeywords: ['今天', '熟客', '朋友', '哈哈', '常来', '喜欢', '聊', '老样子', '热乎'],
        dislikesKeywords: ['随便', '自己看', '别聊', '快点', '别说了', '无所谓', '不知道'],
        preferredProductTags: ['popular', 'sweet', 'dessert', 'mild', 'comfort'],
        priceSensitivity: 0.8,
        patience: 4,
        decisionStyle: 'social_chat',
        initialDesire: 50,
        unlockStar: 2,
    },
    {
        id: CustomerPersonality.Worker,
        name: '周姐',
        displayName: '赶时间上班族',
        traits: '节奏快、目标明确，追求效率。',
        conversationPreference: '极简、高效、直击重点。',
        likes: ['快速响应', '推荐便捷产品', '告知出餐速度'],
        dislikes: ['闲聊啰嗦', '推荐复杂产品', '多轮无效对话'],
        likesKeywords: ['快', '马上', '打包', '带走', '方便', '不耽误', '最快', '直接', '出餐'],
        dislikesKeywords: ['慢慢选', '坐一会', '复杂', '等一下', '故事', '聊聊', '不急'],
        preferredProductTags: ['fast', 'coffee', 'takeaway', 'food'],
        priceSensitivity: 0.8,
        patience: 2,
        decisionStyle: 'fast_decision',
        initialDesire: 55,
        unlockStar: 2,
    },
    {
        id: CustomerPersonality.Hesitant,
        name: '米米',
        displayName: '纠结选择困难型',
        traits: '目标不明确，喜欢对比，需要温和引导。',
        conversationPreference: '耐心、有引导性、帮忙缩小选择。',
        likes: ['精准推荐', '说明差异', '温和鼓励'],
        dislikes: ['不耐烦', '给过多选择', '催促决策'],
        likesKeywords: ['我建议', '直接选', '更适合', '不容易踩雷', '二选一', '温和', '区别', '帮你选'],
        dislikesKeywords: ['都可以', '看你自己', '随便', '快点', '全都看看', '自己决定', '都行'],
        preferredProductTags: ['popular', 'mild', 'comfort', 'coffee'],
        priceSensitivity: 1.1,
        patience: 4,
        decisionStyle: 'guided_choice',
        initialDesire: 35,
        unlockStar: 3,
    },
];

export function getUnlockedCustomers(star: number): CustomerData[] {
    return CUSTOMER_LIST.filter((customer) => customer.unlockStar <= star);
}
