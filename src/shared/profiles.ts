import type { MbtiType } from "./domain";

export interface CommunicationProfile {
  informationOrder: string;
  evidenceStyle: string;
  tone: string;
  decisionStyle: string;
  relationshipSignal: string;
  density: string;
}

const baseProfiles: Record<MbtiType, CommunicationProfile> = {
  INTJ: {
    informationOrder: "先结论，再给判断依据",
    evidenceStyle: "原理逻辑、系统风险、长期影响",
    tone: "直接、克制、少情绪判断",
    decisionStyle: "明确建议和判断标准",
    relationshipSignal: "尊重自主判断空间",
    density: "高密度简洁"
  },
  INTP: {
    informationOrder: "先问题框架，再给可能性",
    evidenceStyle: "原理逻辑、假设边界、反例",
    tone: "开放、精确、低压",
    decisionStyle: "多个可讨论选项",
    relationshipSignal: "保留探索空间",
    density: "解释充分但不催促"
  },
  ENTJ: {
    informationOrder: "先目标和决策点，再给行动建议",
    evidenceStyle: "结果、效率、风险收益",
    tone: "直接、有推进感",
    decisionStyle: "明确建议和优先级",
    relationshipSignal: "强调共同目标",
    density: "高密度、行动导向"
  },
  ENTP: {
    informationOrder: "先可能性和问题张力，再给选择",
    evidenceStyle: "反例、机会、概念连接",
    tone: "开放、有弹性",
    decisionStyle: "多个选项和讨论空间",
    relationshipSignal: "尊重对方的思辨空间",
    density: "轻快但有信息量"
  },
  INFJ: {
    informationOrder: "先关系和意义，再给具体问题",
    evidenceStyle: "长期影响、价值一致性、人的感受",
    tone: "温和、真诚、带边界",
    decisionStyle: "共同理解后的建议",
    relationshipSignal: "表达理解和善意",
    density: "解释充分"
  },
  INFP: {
    informationOrder: "先感受和价值，再给请求",
    evidenceStyle: "个人意义、感受影响、真诚动机",
    tone: "柔和、尊重、不压迫",
    decisionStyle: "保留选择空间",
    relationshipSignal: "保护对方感受和自我表达",
    density: "温和展开"
  },
  ENFJ: {
    informationOrder: "先共同目标和关系，再给行动",
    evidenceStyle: "团队影响、情绪氛围、共同收益",
    tone: "鼓励、清晰、有关照",
    decisionStyle: "协商式建议",
    relationshipSignal: "明确认可和共同感",
    density: "结构清楚但有人情味"
  },
  ENFP: {
    informationOrder: "先可能性和动机，再给重点",
    evidenceStyle: "愿景、体验、联想和人的影响",
    tone: "热情、灵活、开放",
    decisionStyle: "选择空间和灵感启发",
    relationshipSignal: "表达善意和连接感",
    density: "轻松口语"
  },
  ISTJ: {
    informationOrder: "先事实和责任边界，再给结论",
    evidenceStyle: "事实、流程、已有约定",
    tone: "具体、稳定、少夸张",
    decisionStyle: "明确步骤和交付标准",
    relationshipSignal: "尊重规则和承诺",
    density: "分步骤"
  },
  ISFJ: {
    informationOrder: "先关系和已有承诺，再给请求",
    evidenceStyle: "具体经验、实际影响、责任感",
    tone: "温和、体贴、清楚",
    decisionStyle: "可执行的小步骤",
    relationshipSignal: "表达感谢和照顾",
    density: "具体但不压迫"
  },
  ESTJ: {
    informationOrder: "先目标、规则和责任，再给行动",
    evidenceStyle: "事实、效率、标准",
    tone: "直接、明确、有秩序",
    decisionStyle: "明确分工和期限",
    relationshipSignal: "强调可靠和负责",
    density: "简洁有条理"
  },
  ESFJ: {
    informationOrder: "先关系氛围和共同期待，再给请求",
    evidenceStyle: "对人的影响、具体责任、群体协调",
    tone: "友好、清楚、带认可",
    decisionStyle: "协作式步骤",
    relationshipSignal: "表达感谢、认可和共同体感",
    density: "清楚具体"
  },
  ISTP: {
    informationOrder: "先问题本身，再给可操作信息",
    evidenceStyle: "事实、机制、实际可行性",
    tone: "简短、冷静、不绕",
    decisionStyle: "可选方案和动手空间",
    relationshipSignal: "减少情绪压力",
    density: "低冗余"
  },
  ISFP: {
    informationOrder: "先感受和具体处境，再给请求",
    evidenceStyle: "个人体验、当下影响、具体例子",
    tone: "柔和、尊重、不评价",
    decisionStyle: "低压选择",
    relationshipSignal: "保护自主和感受",
    density: "自然口语"
  },
  ESTP: {
    informationOrder: "先当前问题和机会，再给动作",
    evidenceStyle: "即时结果、现实反馈、具体例子",
    tone: "直接、轻快、少抽象",
    decisionStyle: "马上能试的选项",
    relationshipSignal: "保持空间和灵活度",
    density: "短句、高行动性"
  },
  ESFP: {
    informationOrder: "先人和当下感受，再给具体事",
    evidenceStyle: "真实体验、现场影响、例子",
    tone: "友好、鲜活、少压迫",
    decisionStyle: "轻松可选的行动",
    relationshipSignal: "表达喜欢、认可和在意",
    density: "轻松口语"
  }
};

export function getCommunicationProfile(type: MbtiType): CommunicationProfile {
  return baseProfiles[type];
}

export function summarizeDirection(senderType: MbtiType, receiverType: MbtiType): string {
  const sender = getCommunicationProfile(senderType);
  const receiver = getCommunicationProfile(receiverType);

  return `${senderType} 的表达可能更自然地偏向「${sender.informationOrder}」和「${sender.tone}」；${receiverType} 可能更容易接收「${receiver.informationOrder}」与「${receiver.evidenceStyle}」的组织方式。`;
}
