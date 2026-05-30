export enum AchievementId {
    FirstSale = 'firstSale',
    CommunicationMaster = 'communicationMaster',
    IntrovertFriend = 'introvertFriend',
    ZeroWaste = 'zeroWaste',
    FullDesire = 'fullDesire',
    ViralMoment = 'viralMoment',
    DailyKing = 'dailyKing',
    SteadyWeek = 'steadyWeek',
    FiveStar = 'fiveStar',
}

export interface AchievementReward {
    reputation?: number;
    skillPoints?: number;
    money?: number;
}

export interface AchievementData {
    id: AchievementId;
    name: string;
    description: string;
    rewardText: string;
    reward: AchievementReward;
}

export const ACHIEVEMENT_LIST: AchievementData[] = [
    {
        id: AchievementId.FirstSale,
        name: '第一杯咖啡',
        description: '完成第一笔成交。',
        rewardText: '+20 声望',
        reward: { reputation: 20 },
    },
    {
        id: AchievementId.CommunicationMaster,
        name: '沟通大师',
        description: '单轮对话让顾客购买欲望提升 20 分或以上。',
        rewardText: '+1 技能点',
        reward: { skillPoints: 1 },
    },
    {
        id: AchievementId.IntrovertFriend,
        name: '社恐福音',
        description: '成功接待 5 名社恐内向型顾客。',
        rewardText: '+80 声望',
        reward: { reputation: 80 },
    },
    {
        id: AchievementId.ZeroWaste,
        name: '零报废日',
        description: '某天打烊时没有鲜制品报废，且至少成交 1 单。',
        rewardText: '+60 声望',
        reward: { reputation: 60 },
    },
    {
        id: AchievementId.FullDesire,
        name: '满分服务',
        description: '将任意顾客购买欲望推到 100。',
        rewardText: '+120 声望',
        reward: { reputation: 120 },
    },
    {
        id: AchievementId.ViralMoment,
        name: '网红打卡',
        description: '触发一次次日客流量提升事件。',
        rewardText: '+1 技能点',
        reward: { skillPoints: 1 },
    },
    {
        id: AchievementId.DailyKing,
        name: '单日销冠',
        description: '单日净利润突破 1000 元。',
        rewardText: '+1 技能点，+120 声望',
        reward: { skillPoints: 1, reputation: 120 },
    },
    {
        id: AchievementId.SteadyWeek,
        name: '街角常青',
        description: '经营到第 7 天且声望不低于 500。',
        rewardText: '+180 声望',
        reward: { reputation: 180 },
    },
    {
        id: AchievementId.FiveStar,
        name: '五星店长',
        description: '店铺升级至 5 星网红咖啡屋。',
        rewardText: '+500 资金',
        reward: { money: 500 },
    },
];

export function findAchievement(achievementId: string): AchievementData | undefined {
    return ACHIEVEMENT_LIST.find((achievement) => achievement.id === achievementId);
}
