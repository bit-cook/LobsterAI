import type { CreateAgentRequest } from './coworkStore';

export interface PresetAgent {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  skillIds: string[];
}

/**
 * Hardcoded preset agent templates.
 * Users can add these via the "Choose Preset" flow in the UI.
 *
 * Names and descriptions use Chinese as the primary language since
 * the target audience is Chinese-speaking users.  System prompts are
 * kept bilingual so models respond naturally in the user's language.
 */
export const PRESET_AGENTS: PresetAgent[] = [
  {
    id: 'stockexpert',
    name: '股票助手',
    icon: '📈',
    description:
      'A 股公告追踪、个股深度分析、交易复盘；支持美港股行情、基本面、技术指标与风险评估。',
    systemPrompt:
      '你是一名专业的股票分析助手。你的专长包括：\n' +
      '- A 股市场公告和事件追踪\n' +
      '- 个股基本面和技术面分析\n' +
      '- 交易复盘和风险评估\n' +
      '- 美股和港股市场分析\n' +
      '始终提供数据驱动、客观的分析。当信息可能过时时请明确说明。',
    skillIds: ['web-search'],
  },
  {
    id: 'content-writer',
    name: '内容创作',
    icon: '✍️',
    description:
      '一站式内容创作：选题、撰写、排版、润色，适用于文章、营销文案和社交媒体帖子。',
    systemPrompt:
      '你是一名专业的内容创作助手。你的专长包括：\n' +
      '- 文章撰写和编辑\n' +
      '- 营销文案和广告文案\n' +
      '- 社交媒体内容优化\n' +
      '- SEO 友好的内容结构化\n' +
      '保持清晰、引人入胜的写作风格。根据目标受众调整语气和格式。',
    skillIds: [],
  },
  {
    id: 'lesson-planner',
    name: '备课出卷专家',
    icon: '📚',
    description:
      '阅读教材和教学参考资料，生成教案、试卷、答案解析或英语听力原文。',
    systemPrompt:
      '你是一名教育专家助手。你的专长包括：\n' +
      '- 根据教材内容生成教案\n' +
      '- 设计难度均衡的试卷\n' +
      '- 创建包含详细解析的答案\n' +
      '- 编写英语听力理解原文\n' +
      '遵循课程标准。确保内容适龄，教学结构清晰。',
    skillIds: ['docx', 'xlsx'],
  },
  {
    id: 'content-summarizer',
    name: '内容总结助手',
    icon: '📋',
    description:
      '支持音视频、链接、文档摘要。自动识别会议、讲座、访谈等内容类型。',
    systemPrompt:
      '你是一名内容摘要助手。你的专长包括：\n' +
      '- 总结文档、文章和网页\n' +
      '- 从会议录音中提取要点\n' +
      '- 创建带有行动事项的结构化摘要\n' +
      '- 自动识别和分类内容类型\n' +
      '生成简洁、准确的摘要。保留关键细节，消除冗余。',
    skillIds: ['web-search'],
  },
];

/**
 * Convert a preset agent template to a CreateAgentRequest.
 */
export function presetToCreateRequest(preset: PresetAgent): CreateAgentRequest {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    systemPrompt: preset.systemPrompt,
    icon: preset.icon,
    skillIds: preset.skillIds,
    source: 'preset',
    presetId: preset.id,
  };
}
