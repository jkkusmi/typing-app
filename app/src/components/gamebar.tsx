import './gamebar.css'

export type GameMode = 'time' | 'words'
export type GameTime = 15 | 30 | 60 | 120
export type GameLanguage = 'en' | 'pl'
export type WordCount = 10 | 25 | 50 | 100

export type GameSettings = {
  mode: GameMode
  durationSeconds: GameTime
  wordCount: WordCount
  language: GameLanguage
}

export const STORAGE_KEY = 'typing-app-game-settings'

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'time',
  durationSeconds: 30,
  wordCount: 25,
  language: 'en',
}

const TIME_OPTIONS: GameTime[] = [15, 30, 60, 120]
const LANGUAGE_OPTIONS: GameLanguage[] = ['en', 'pl']
const MODE_OPTIONS: GameMode[] = ['time', 'words']
const WORD_COUNT_OPTIONS: WordCount[] = [10, 25, 50, 100]

const LANGUAGE_LABELS: Record<GameLanguage, string> = {
  en: 'English',
  pl: 'Polish',
}

function cycleOption<T>(current: T, options: readonly T[]): T {
  const index = options.indexOf(current)
  const nextIndex = index === -1 ? 0 : (index + 1) % options.length
  return options[nextIndex]
}

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_GAME_SETTINGS

    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return {
      mode: MODE_OPTIONS.includes(parsed.mode as GameMode)
        ? (parsed.mode as GameMode)
        : DEFAULT_GAME_SETTINGS.mode,
      durationSeconds: TIME_OPTIONS.includes(parsed.durationSeconds as GameTime)
        ? (parsed.durationSeconds as GameTime)
        : DEFAULT_GAME_SETTINGS.durationSeconds,
      wordCount: WORD_COUNT_OPTIONS.includes(parsed.wordCount as WordCount)
        ? (parsed.wordCount as WordCount)
        : DEFAULT_GAME_SETTINGS.wordCount,
      language: LANGUAGE_OPTIONS.includes(parsed.language as GameLanguage)
        ? (parsed.language as GameLanguage)
        : DEFAULT_GAME_SETTINGS.language,
    }
  } catch {
    return DEFAULT_GAME_SETTINGS
  }
}

export function saveGameSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

type GamebarProps = {
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function Gamebar({ settings, onSettingsChange }: GamebarProps) {
  const updateSettings = (partial: Partial<GameSettings>) => {
    const next = { ...settings, ...partial }
    saveGameSettings(next)
    onSettingsChange(next)
  }

  const limitLabel =
    settings.mode === 'time'
      ? `${settings.durationSeconds}s`
      : `${settings.wordCount} words`

  const cycleLimit = () => {
    if (settings.mode === 'time') {
      updateSettings({
        durationSeconds: cycleOption(settings.durationSeconds, TIME_OPTIONS),
      })
      return
    }
    updateSettings({
      wordCount: cycleOption(settings.wordCount, WORD_COUNT_OPTIONS),
    })
  }

  return (
    <div className="gamebar">
      <button
        type="button"
        className="gamebar-item"
        onClick={cycleLimit}
        aria-label={
          settings.mode === 'time' ? 'Cycle time limit' : 'Cycle word count'
        }
      >
        <span className="gamebar-item-label">{limitLabel}</span>
      </button>
      <button
        type="button"
        className="gamebar-item"
        onClick={() =>
          updateSettings({
            language: cycleOption(settings.language, LANGUAGE_OPTIONS),
          })
        }
        aria-label="Cycle language"
      >
        <span className="gamebar-item-label">
          {LANGUAGE_LABELS[settings.language]}
        </span>
      </button>
      <button
        type="button"
        className="gamebar-item"
        onClick={() =>
          updateSettings({
            mode: cycleOption(settings.mode, MODE_OPTIONS),
          })
        }
        aria-label="Cycle game mode"
      >
        <span className="gamebar-item-label">
          {settings.mode === 'time' ? 'Time' : 'Words'}
        </span>
      </button>
    </div>
  )
}
