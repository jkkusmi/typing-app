import {
  apiSubmitScore,
  decodeToken,
  isAuthenticated,
  isTokenAlive,
  loadToken,
  type ScoreEntry,
} from '../api/api'

export const LOCAL_SCORES_KEY = 'typing-app-local-scores'

export type SaveLocalScoreInput = {
  wpm: number
  score: number
  game_type: string
  text_type: string
  language: string
}

export function getLocalUsername(): string {
  const token = loadToken()
  if (token && isTokenAlive(token)) {
    const payload = decodeToken(token)
    if (payload?.username) return payload.username
  }
  return 'Guest'
}

export function loadLocalScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScoreEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalScore(input: SaveLocalScoreInput): ScoreEntry {
  const entry: ScoreEntry = {
    id: Date.now(),
    username: getLocalUsername(),
    achieved_at: new Date().toISOString(),
    ...input,
  }

  const scores = loadLocalScores()
  scores.unshift(entry)
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores))
  window.dispatchEvent(new CustomEvent('local-scores-updated'))

  return entry
}

export async function recordScore(input: SaveLocalScoreInput): Promise<ScoreEntry> {
  const entry = saveLocalScore(input)

  if (isAuthenticated()) {
    try {
      await apiSubmitScore(input)
    } catch {
      // Local score is already saved; server sync failure should not block the game.
    }
  }

  return entry
}
