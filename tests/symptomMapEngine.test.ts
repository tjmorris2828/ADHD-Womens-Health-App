import { describe, expect, it } from 'vitest'
import {
  evaluateSymptomPath,
  getClaimsByIds,
  getCitationsForClaim,
  getLearnTopics,
  getSourceFreshnessWarnings,
  getSuggestedEntrySymptoms,
  hasDiagnosticPhrasing,
} from '../src/lib/symptomMapEngine'

describe('symptom map engine', () => {
  it('ranks likely causes for branch traversal input', () => {
    const result = evaluateSymptomPath({
      selectedSymptomIds: ['mood_swings', 'cramps'],
      answersByNodeId: {
        frequency: ['freq_weekly'],
        cycle_window: ['cycle_yes'],
        sleep_quality: ['sleep_mixed'],
        stress_level: ['stress_medium'],
        red_flags: ['flag_none'],
      },
    })

    expect(result.rankedLikelyCauses.length).toBe(3)
    expect(result.rankedLikelyCauses[0].id).toBe('pmdd_window')
  })

  it('ensures claims have citation links and evidence tiers', () => {
    const topics = getLearnTopics()
    for (const topic of topics) {
      const topicClaims = getClaimsByIds(topic.claimIds)
      expect(topicClaims.length).toBeGreaterThanOrEqual(3)
      for (const claim of topicClaims) {
        expect(claim.evidenceTier).toMatch(/High|Medium|Low/)
        const claimCitations = getCitationsForClaim(claim.id)
        expect(claimCitations.length).toBeGreaterThan(0)
        claimCitations.forEach((citation) => {
          expect(citation.url).toMatch(/^https:\/\//)
          expect(citation.evidenceTier).toMatch(/High|Medium|Low/)
        })
      }
    }
  })

  it('returns safety flags when red-flag branches are selected', () => {
    const result = evaluateSymptomPath({
      selectedSymptomIds: ['fatigue'],
      answersByNodeId: {
        frequency: ['freq_most_days'],
        cycle_window: ['cycle_no'],
        sleep_quality: ['sleep_good'],
        red_flags: ['flag_heavy_bleeding'],
      },
    })

    expect(result.safetyFlags.length).toBeGreaterThan(0)
    expect(result.safetyFlags.some((flag) => flag.id === 'redflag_heavy_bleeding')).toBe(true)
  })

  it('guards against diagnostic phrasing in generated likely-cause text', () => {
    const result = evaluateSymptomPath({
      selectedSymptomIds: ['brain_fog', 'sleep_issues'],
      answersByNodeId: {
        frequency: ['freq_occasional'],
        sleep_quality: ['sleep_poor'],
        stress_level: ['stress_high'],
        red_flags: ['flag_none'],
      },
    })

    const joined = result.rankedLikelyCauses
      .map((cause) => `${cause.summary} ${cause.why} ${cause.whatToTrack} ${cause.seekCareWhen}`)
      .join(' ')

    expect(hasDiagnosticPhrasing(joined)).toBe(false)
  })

  it('provides entry suggestions for empty symptom state', () => {
    const suggested = getSuggestedEntrySymptoms()
    expect(suggested.length).toBeGreaterThan(0)
  })

  it('shows uncertainty when contradictory signals are present', () => {
    const result = evaluateSymptomPath({
      selectedSymptomIds: ['sleep_issues'],
      answersByNodeId: {
        frequency: ['freq_occasional', 'freq_most_days'],
        sleep_quality: ['sleep_good'],
        red_flags: ['flag_none'],
      },
    })

    expect(result.contradictorySignals.length).toBeGreaterThan(0)
    expect(result.confidenceNote.toLowerCase()).toContain('different directions')
  })

  it('flags stale sources beyond freshness threshold', () => {
    const warnings = getSourceFreshnessWarnings(2035)
    expect(warnings.length).toBeGreaterThan(0)
  })
})
