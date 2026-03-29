import { describe, expect, it } from 'vitest'
import {
  MINI_TOOL_LOADING_STEPS,
  buildMockToolConcept,
} from './mock-tool'

describe('buildMockToolConcept', () => {
  it('returns the sponsor preset when the brief mentions sponsors', () => {
    const result = buildMockToolConcept(
      'Create a sponsor follow-up helper for a student hackathon team',
    )

    expect(result.name).toBe('Sponsor Follow-up Copilot')
    expect(result.tags).toContain('Partnerships')
    expect(result.outputs).toContain('Priority follow-up queue')
  })

  it('returns the operations preset when the brief mentions volunteer shifts', () => {
    const result = buildMockToolConcept(
      'Need a volunteer shift planner with check-in windows and schedule swaps',
    )

    expect(result.name).toBe('Volunteer Shift Planner')
    expect(result.tags).toContain('Operations')
    expect(result.inputs).toContain('Volunteer role list')
  })

  it('falls back to the general preset when no keywords match', () => {
    const result = buildMockToolConcept(
      'Turn a rough event request into a compact operations helper',
    )

    expect(result.name).toBe('Run of Show Builder')
    expect(result.outputs).toContain('Shareable run sheet')
  })
})

describe('MINI_TOOL_LOADING_STEPS', () => {
  it('keeps the three deterministic fake loading messages in order', () => {
    expect(MINI_TOOL_LOADING_STEPS).toEqual([
      'Parsing workflow goal',
      'Drafting inputs and outputs',
      'Composing interface concept',
    ])
  })
})
