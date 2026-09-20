import type { ActiveStudySession } from '../types/kana'

export const pendingDeckIndices = (active: ActiveStudySession) =>
  active.deck.flatMap((entry, index) => entry.graded ? [] : [index])

export const currentAnswered = (active: ActiveStudySession) =>
  active.phase === 'mistakes'
    ? active.reviewCompleted.includes(active.reviewQueue[active.reviewIndex])
    : !!active.deck[active.currentIndex]?.graded

export const currentElapsed = (active: ActiveStudySession) =>
  active.phase === 'mistakes'
    ? active.reviewElapsedMs[active.reviewQueue[active.reviewIndex]] ?? 0
    : active.deck[active.currentIndex]?.elapsedMs ?? 0

export const settleTimer = (active: ActiveStudySession, now: number): ActiveStudySession => {
  const limit = active.sessionTimerMs
  if (limit == null || active.timerStartedAt == null || currentAnswered(active)) return active
  const elapsed = Math.min(limit, currentElapsed(active) + Math.max(0, now - active.timerStartedAt))
  if (active.phase === 'mistakes') {
    const id = active.reviewQueue[active.reviewIndex]
    return { ...active, reviewElapsedMs: { ...active.reviewElapsedMs, [id]: elapsed }, timerRemainingMs: limit - elapsed, timerStartedAt: null }
  }
  const deck = [...active.deck]
  deck[active.currentIndex] = { ...deck[active.currentIndex], elapsedMs: elapsed }
  return { ...active, deck, timerRemainingMs: limit - elapsed, timerStartedAt: null }
}

export const activateTimer = (active: ActiveStudySession, now: number): ActiveStudySession => {
  const limit = active.sessionTimerMs
  if (limit == null) return { ...active, timerRemainingMs: null, timerStartedAt: null }
  const elapsed = currentAnswered(active)
    ? active.phase === 'mistakes'
      ? active.reviewTimings[active.reviewQueue[active.reviewIndex]] ?? currentElapsed(active)
      : active.deck[active.currentIndex]?.recognitionMs ?? currentElapsed(active)
    : currentElapsed(active)
  const remaining = Math.max(0, limit - elapsed)
  return {
    ...active,
    timerRemainingMs: remaining,
    timerStartedAt: active.timerPaused || active.waitingToStart || active.completed || currentAnswered(active) || remaining === 0 ? null : now,
  }
}

export const pendingReviewIndices = (active: ActiveStudySession) =>
  active.reviewQueue.flatMap((id, index) => active.reviewCompleted.includes(id) ? [] : [index])

export const skipCount = (active: ActiveStudySession) =>
  active.phase === 'mistakes'
    ? active.reviewSkipped.filter(index => !active.reviewCompleted.includes(active.reviewQueue[index])).length
    : active.lessonSkipped.filter(index => !active.deck[index]?.graded).length

export const afterLesson = (active: ActiveStudySession): ActiveStudySession =>
  active.reviewQueue.length
    ? { ...active, phase: 'mistakes', reviewPhase: true, reviewIndex: 0, reviewHistory: [0], reviewCursor: 0, reviewFrontier: 0, reviewSkipped: [], flipped: false }
    : { ...active, completed: true, timerStartedAt: null }

/** History preserves Previous, while frontier tracks the first pass through the deck. */
export const moveInPhase = (active: ActiveStudySession, delta: number): ActiveStudySession => {
  const review = active.phase === 'mistakes'
  const current = review ? active.reviewIndex : active.currentIndex
  const history = review ? active.reviewHistory : active.lessonHistory
  const cursor = review ? active.reviewCursor : active.lessonCursor
  const frontier = review ? active.reviewFrontier : active.lessonFrontier
  const skipped = review ? active.reviewSkipped : active.lessonSkipped
  const pending = review ? pendingReviewIndices(active) : pendingDeckIndices(active)
  const answered = review ? active.reviewCompleted.includes(active.reviewQueue[current]) : !!active.deck[current]?.graded
  if (delta < 0) {
    if (cursor <= 0) return active
    const next = history[cursor - 1]
    return review
      ? { ...active, reviewIndex: next, reviewCursor: cursor - 1, flipped: false }
      : { ...active, currentIndex: next, lessonCursor: cursor - 1, flipped: false }
  }
  if (!answered && pending.length === 1) return active
  const updatedSkipped = !answered && !skipped.includes(current) ? [...skipped, current] : skipped
  if (cursor < history.length - 1) {
    const next = history[cursor + 1]
    return review
      ? { ...active, reviewIndex: next, reviewCursor: cursor + 1, reviewSkipped: updatedSkipped, flipped: false }
      : { ...active, currentIndex: next, lessonCursor: cursor + 1, lessonSkipped: updatedSkipped, flipped: false }
  }
  const total = review ? active.reviewQueue.length : active.deck.length
  const next = frontier + 1 < total
    ? frontier + 1
    : updatedSkipped.find(index => index !== current && pending.includes(index))
      ?? pending.find(index => index !== current)
  if (next == null) return active
  const nextHistory = [...history.slice(0, cursor + 1), next]
  if (review) return { ...active, reviewIndex: next, reviewHistory: nextHistory, reviewCursor: nextHistory.length - 1, reviewFrontier: Math.max(frontier, next), reviewSkipped: updatedSkipped.filter(index => index !== current || answered).concat(!answered && updatedSkipped.includes(current) ? [current] : []), flipped: false }
  return { ...active, currentIndex: next, lessonHistory: nextHistory, lessonCursor: nextHistory.length - 1, lessonFrontier: Math.max(frontier, next), lessonSkipped: updatedSkipped.filter(index => index !== current || answered).concat(!answered && updatedSkipped.includes(current) ? [current] : []), flipped: false }
}

export const afterAnswer = (active: ActiveStudySession): ActiveStudySession => {
  const review = active.phase === 'mistakes'
  const pending = review ? pendingReviewIndices(active) : pendingDeckIndices(active)
  if (!pending.length) return review ? { ...active, completed: true, timerStartedAt: null } : afterLesson(active)
  const current = review ? active.reviewIndex : active.currentIndex
  const history = review ? active.reviewHistory : active.lessonHistory
  const cursor = review ? active.reviewCursor : active.lessonCursor
  const frontier = review ? active.reviewFrontier : active.lessonFrontier
  const skipped = review ? active.reviewSkipped : active.lessonSkipped
  const next = history.slice(cursor + 1).find(index => pending.includes(index))
    ?? (frontier + 1 < (review ? active.reviewQueue.length : active.deck.length) ? frontier + 1 : undefined)
    ?? skipped.find(index => pending.includes(index) && index !== current)
    ?? pending[0]
  const nextHistory = [...history.slice(0, cursor + 1), next]
  return review
    ? { ...active, reviewIndex: next, reviewHistory: nextHistory, reviewCursor: nextHistory.length - 1, reviewFrontier: Math.max(frontier, next), reviewSkipped: skipped.filter(index => index !== current), flipped: false }
    : { ...active, currentIndex: next, lessonHistory: nextHistory, lessonCursor: nextHistory.length - 1, lessonFrontier: Math.max(frontier, next), lessonSkipped: skipped.filter(index => index !== current), flipped: false }
}
