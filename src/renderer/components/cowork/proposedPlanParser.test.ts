import { describe, expect, test } from 'vitest';

import { parseProposedPlanBlock } from './proposedPlanParser';

describe('parseProposedPlanBlock', () => {
  test('extracts a proposed plan and removes it from visible text', () => {
    expect(parseProposedPlanBlock('Intro\n<proposed_plan>\n- Step\n</proposed_plan>\nOutro')).toEqual({
      visibleText: 'Intro\nOutro',
      planText: '- Step',
    });
  });

  test('leaves text unchanged when no complete plan block exists', () => {
    expect(parseProposedPlanBlock('Intro')).toEqual({
      visibleText: 'Intro',
      planText: null,
    });
    expect(parseProposedPlanBlock('<proposed_plan>\n- Step')).toEqual({
      visibleText: '<proposed_plan>\n- Step',
      planText: null,
    });
  });
});
