export type Alphabet = 'hiragana' | 'katakana'
export type StudySource = Alphabet | 'both' | 'starred' | 'recent-mistakes' | 'slowest' | 'session-mistakes'
export type SessionType = 'study' | 'review'

export interface Kana { id: string; character: string; romaji: string; alphabet: Alphabet; group: string; soundKey: string; order: number }
export interface KanaProgress { kanaId: string; starred: boolean; bestRecognitionMs: number | null; totalCorrect: number; totalWrong: number; lastStudiedAt: number | null }
export interface StudyPreferences { characterSet: 'hiragana' | 'katakana' | 'both'; reviewMode: 'none' | 'starred' | 'recent-mistakes' | 'slowest'; slowReviewMode: 'top-30' | 'over-threshold'; slowTopCount: number; slowThresholdMs: number; reviewMistakesAtEnd: boolean; shuffled: boolean; lockNavigation: boolean; timerMs: number | null; recordSession: boolean; readyFirstCard: boolean; showKeyboardHints: boolean; reducedMotion: boolean }
export interface SessionKanaResult { kanaId: string; correctCount: number; wrongCount: number; recognitionTimes: number[] }
export interface StudySession { id: string; type: SessionType; source: StudySource; startedAt: number; finishedAt: number; shuffled: boolean; timerMs: number | null; reviewMistakesAtEnd: boolean; deckOrder?: string[]; results: SessionKanaResult[] }
export interface DeckEntry { kanaId: string; graded: boolean; grade: 'correct' | 'wrong' | null; recognitionMs: number | null }
export interface ActiveStudySession { id: string; type: SessionType; source: StudySource; startedAt: number; deck: DeckEntry[]; currentIndex: number; flipped: boolean; reviewQueue: string[]; reviewIndex: number; reviewPhase: boolean; reviewTimings: Record<string, number>; timerRemainingMs: number | null; timerStartedAt: number | null; shuffled: boolean; reviewMistakesAtEnd: boolean; sessionTimerMs: number | null; recordSession: boolean; waitingToStart: boolean; completed: boolean }
