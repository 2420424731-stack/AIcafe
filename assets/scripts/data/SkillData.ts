export enum SkillId {
    Eloquence = 'eloquence',
    CostControl = 'costControl',
    Traffic = 'traffic',
    Tolerance = 'tolerance',
    ReputationBoost = 'reputationBoost',
}

export interface SkillData {
    id: SkillId;
    name: string;
    maxLevel: number;
    description: string;
    effectText: string;
}

export const SKILL_LIST: SkillData[] = [
    {
        id: SkillId.Eloquence,
        name: '口才精通',
        maxLevel: 3,
        description: '命中顾客偏好时，单轮购买欲望加分上限更高。',
        effectText: '正向欲望上限 +5/级',
    },
    {
        id: SkillId.CostControl,
        name: '成本管控',
        maxLevel: 3,
        description: '开店前进货时降低所有产品成本。',
        effectText: '进货成本 -10%/级',
    },
    {
        id: SkillId.Traffic,
        name: '客流吸引',
        maxLevel: 3,
        description: '提高每日最低客流量，让经营更稳定。',
        effectText: '每日客流下限 +1/级',
    },
    {
        id: SkillId.Tolerance,
        name: '容错提升',
        maxLevel: 3,
        description: '踩到顾客雷区时，减少单轮欲望扣分。',
        effectText: '负向扣分减轻 4/级',
    },
    {
        id: SkillId.ReputationBoost,
        name: '口碑加成',
        maxLevel: 3,
        description: '好评带来的声望提升更多。',
        effectText: '好评声望 +25%/级',
    },
];

export function findSkill(skillId: string): SkillData | undefined {
    return SKILL_LIST.find((skill) => skill.id === skillId);
}
