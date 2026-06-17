const OPEN_TAG = '<proposed_plan>';
const CLOSE_TAG = '</proposed_plan>';

export interface ProposedPlanParseResult {
  visibleText: string;
  planText: string | null;
}

export const parseProposedPlanBlock = (content: string): ProposedPlanParseResult => {
  const openIndex = content.indexOf(OPEN_TAG);
  if (openIndex === -1) {
    return { visibleText: content, planText: null };
  }

  const contentStart = openIndex + OPEN_TAG.length;
  const closeIndex = content.indexOf(CLOSE_TAG, contentStart);
  if (closeIndex === -1) {
    return { visibleText: content, planText: null };
  }

  const before = content.slice(0, openIndex).replace(/[ \t]*\n?$/, '');
  const after = content.slice(closeIndex + CLOSE_TAG.length).replace(/^\n?/, '');
  const visibleText = [before, after].filter(Boolean).join(before && after ? '\n' : '').trimEnd();
  const planText = content.slice(contentStart, closeIndex).trim();

  return {
    visibleText,
    planText: planText || null,
  };
};
