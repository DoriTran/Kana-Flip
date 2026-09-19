export type Alphabet = 'hiragana' | 'katakana'
export type StudySource = Alphabet | 'both' | 'addons' | 'starred' | 'recent-mistakes' | 'slowest' | 'session-mistakes'
export type SessionType = 'study' | 'review'

export type KanaVariant = 'basic' | 'voiced' | 'yoon' | 'voiced-yoon'
export interface Kana { id: string; character: string; romaji: string; alphabet: Alphabet; group: string; soundKey: string; order: number; variant: KanaVariant }
export interface KanaProgress { kanaId: string; starred: boolean; bestRecognitionMs: number | null; totalCorrect: number; totalWrong: number; lastStudiedAt: number | null }
export interface StudyPreferences { characterSet: 'hiragana' | 'katakana' | 'both' | 'addons'; includeVoiced: boolean; includeYoon: boolean; reviewMode: 'none' | 'starred' | 'recent-mistakes' | 'slowest'; slowReviewMode: 'top-30' | 'over-threshold'; slowTopCount: number; slowThresholdMs: number; reviewMistakesAtEnd: boolean; shuffled: boolean; lockNavigation: boolean; allowRegrading: boolean; timerMs: number | null; recordSession: boolean; readyFirstCard: boolean; showKeyboardHints: boolean; reducedMotion: boolean; confirmDiscard: boolean }
export interface SessionKanaResult { kanaId: string; correctCount: number; wrongCount: number; recognitionTimes: number[] }
export interface StudySession { id: string; type: SessionType; source: StudySource; startedAt: number; finishedAt: number; shuffled: boolean; timerMs: number | null; reviewMistakesAtEnd: boolean; includeVoiced?: boolean; includeYoon?: boolean; deckOrder?: string[]; results: SessionKanaResult[] }
export interface DeckEntry { kanaId: string; graded: boolean; grade: 'correct' | 'wrong' | null; recognitionMs: number | null }
export interface ActiveStudySession { id: string; type: SessionType; source: StudySource; startedAt: number; deck: DeckEntry[]; currentIndex: number; flipped: boolean; reviewQueue: string[]; reviewIndex: number; reviewPhase: boolean; reviewTimings: Record<string, number>; timerRemainingMs: number | null; timerStartedAt: number | null; shuffled: boolean; reviewMistakesAtEnd: boolean; includeVoiced: boolean; includeYoon: boolean; sessionTimerMs: number | null; recordSession: boolean; waitingToStart: boolean; completed: boolean }
