/**
 * Pure scoring utility functions.
 * Implements score analysis and validation without side effects.
 */

/** Extract rated (non-null) scores from a score map */
export const getRatedScores = (
  criteriaIds: string[],
  scores: Record<string, number | null>
): number[] =>
  criteriaIds
    .map(id => scores[id])
    .filter((s): s is number => s !== null && s !== undefined)

/** Analyze score distribution for consistency warnings */
export const analyzeScoreRange = (ratedScores: number[]) => {
  if (ratedScores.length < 2) return { min: 0, max: 0, range: 0, hasHighVariance: false }

  const min = Math.min(...ratedScores)
  const max = Math.max(...ratedScores)
  const range = max - min

  return { min, max, range, hasHighVariance: range >= 3 }
}

/** Count rated criteria from a scores map */
export const countRatedCriteria = (scores: Record<string, number | null>): number =>
  Object.values(scores).filter((s): s is number => s !== null && s !== undefined).length
