import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import enRaw from '../assets/words/en.txt?raw'
import plRaw from '../assets/words/pl.txt?raw'
import './game.css'

type GameMode = 'time' | 'words'
type GameLanguage = 'en' | 'pl' | string
type GamePhase = 'idle' | 'playing' | 'finished'

type GameProps = {
  mode?: GameMode
  durationSeconds?: number
  wordCount?: number
  language?: GameLanguage
}

type GameResults = {
  accuracy: number
  wpm: number
  elapsedSeconds: number
  correctChars: number
  totalChars: number
}

type WordBoundary = { start: number; end: number }

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  pl: 'Polish',
}

const TIME_BUFFER_SIZE = 4
const TIME_REFILL_THRESHOLD = 1

function parseWordList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const WORD_LISTS: Record<string, string[]> = {
  en: parseWordList(enRaw),
  pl: parseWordList(plRaw),
}

function pickRandomWords(pool: string[], count: number): string[] {
  if (pool.length === 0) return []
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const result: string[] = []
  for (let i = 0; i < count; i += 1) {
    result.push(shuffled[i % shuffled.length])
  }
  return result
}

function wordsToTarget(words: string[]): string {
  return words.join(' ')
}

function getWordBoundaries(target: string): WordBoundary[] {
  const boundaries: WordBoundary[] = []
  let start = 0
  for (let i = 0; i < target.length; i += 1) {
    if (target[i] === ' ') {
      boundaries.push({ start, end: i })
      start = i + 1
    }
  }
  if (start < target.length) {
    boundaries.push({ start, end: target.length })
  }
  return boundaries
}

function isWordCompleted(
  inputLength: number,
  boundary: WordBoundary,
  isLastWord: boolean,
): boolean {
  return isLastWord
    ? inputLength >= boundary.end
    : inputLength > boundary.end
}

function wordHasErrors(
  target: string,
  input: string,
  boundary: WordBoundary,
): boolean {
  const typedLength = Math.min(input.length, boundary.end)
  for (let i = boundary.start; i < typedLength; i += 1) {
    if (input[i] !== target[i]) return true
  }
  return false
}

function countCompletedWords(
  input: string,
  boundaries: WordBoundary[],
): number {
  let count = 0
  for (let w = 0; w < boundaries.length; w += 1) {
    const boundary = boundaries[w]
    const isLast = w === boundaries.length - 1
    if (
      isWordCompleted(input.length, boundary, isLast) &&
      (isLast || input[boundary.end] === ' ')
    ) {
      count += 1
    } else {
      break
    }
  }
  return count
}

function getCharClass(
  target: string,
  input: string,
  index: number,
  boundaries: WordBoundary[],
): string {
  let wordIdx = -1
  let isSpaceChar = false

  for (let w = 0; w < boundaries.length; w += 1) {
    const boundary = boundaries[w]
    if (index >= boundary.start && index < boundary.end) {
      wordIdx = w
      break
    }
    if (index === boundary.end && target[index] === ' ') {
      wordIdx = w
      isSpaceChar = true
      break
    }
  }

  if (wordIdx === -1) return 'game-char'

  const boundary = boundaries[wordIdx]
  const isLastWord = wordIdx === boundaries.length - 1
  const completed = isWordCompleted(input.length, boundary, isLastWord)
  const hasErrors = wordHasErrors(target, input, boundary)

  if (completed && (isSpaceChar || index < boundary.end)) {
    return hasErrors
      ? 'game-char game-char--word-wrong'
      : 'game-char game-char--correct'
  }

  if (isSpaceChar) {
    if (index < input.length) {
      return input[index] === target[index]
        ? 'game-char game-char--correct'
        : 'game-char game-char--incorrect'
    }
    return 'game-char'
  }

  if (index < input.length) {
    return input[index] === target[index]
      ? 'game-char game-char--correct'
      : 'game-char game-char--incorrect'
  }

  return 'game-char'
}

function computeResults(
  target: string,
  input: string,
  elapsedSeconds: number,
): GameResults {
  const totalChars = input.length
  let correctChars = 0
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === target[i]) correctChars += 1
  }
  const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0
  const wpm =
    elapsedSeconds > 0 ? correctChars / 5 / (elapsedSeconds / 60) : 0
  return { accuracy, wpm, elapsedSeconds, correctChars, totalChars }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function Game({
  mode = 'time',
  durationSeconds = 60,
  wordCount = 25,
  language = 'en',
}: GameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputValueRef = useRef('')
  const finishRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)

  const wordPool = WORD_LISTS[language]

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [words, setWords] = useState<string[]>(() =>
    pickRandomWords(
      wordPool ?? [],
      mode === 'words' ? wordCount : TIME_BUFFER_SIZE,
    ),
  )
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [results, setResults] = useState<GameResults | null>(null)

  const target = useMemo(() => wordsToTarget(words), [words])
  const boundaries = useMemo(() => getWordBoundaries(target), [target])
  const languageLabel = LANGUAGE_LABELS[language] ?? language

  const resetGame = useCallback(() => {
    finishRef.current = false
    startTimeRef.current = null
    inputValueRef.current = ''
    setPhase('idle')
    setInput('')
    setTimeLeft(durationSeconds)
    setElapsedSeconds(0)
    setResults(null)
    setWords(
      pickRandomWords(
        wordPool ?? [],
        mode === 'words' ? wordCount : TIME_BUFFER_SIZE,
      ),
    )
  }, [durationSeconds, mode, wordCount, wordPool])

  useEffect(() => {
    resetGame()
  }, [language, mode, durationSeconds, wordCount, resetGame])

  useEffect(() => {
    if (phase !== 'finished') {
      inputRef.current?.focus()
    }
  }, [phase])

  const finishGame = useCallback(
    (finalInput: string, elapsed: number) => {
      if (finishRef.current) return
      finishRef.current = true
      setPhase('finished')
      setResults(computeResults(target, finalInput, elapsed))
    },
    [target],
  )

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'time') return

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          finishGame(inputValueRef.current, durationSeconds)
          return 0
        }
        return prev - 1
      })
      setElapsedSeconds((prev) => Math.min(prev + 1, durationSeconds))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [phase, mode, durationSeconds, finishGame])

  useEffect(() => {
    if (phase !== 'playing') return

    const interval = window.setInterval(() => {
      if (startTimeRef.current === null) return
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsedSeconds(elapsed)
    }, 250)

    return () => window.clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'words') return
    if (input.length >= target.length && input === target) {
      const elapsed = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : elapsedSeconds
      finishGame(input, elapsed)
    }
  }, [input, target, phase, mode, elapsedSeconds, finishGame])

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'time') return
    const typedWords = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
    const remainingWords = words.length - typedWords
    if (remainingWords <= TIME_REFILL_THRESHOLD && wordPool) {
      setWords((prev) => [
        ...prev,
        ...pickRandomWords(wordPool, TIME_BUFFER_SIZE),
      ])
    }
  }, [input, words.length, phase, mode, wordPool])

  const handleInputChange = (value: string) => {
    if (phase === 'finished') return

    if (phase === 'idle' && value.length > 0) {
      startTimeRef.current = Date.now()
      setPhase('playing')
    }

    inputValueRef.current = value
    setInput(value)
  }

  if (!wordPool || wordPool.length === 0) {
    return (
      <div className="game">
        <p className="game-error">
          No word list found for language &quot;{language}&quot;. Add a .txt file
          and register it in WORD_LISTS.
        </p>
      </div>
    )
  }

  if (phase === 'finished' && results) {
    return (
      <div className="game">
        <div className="game-results">
          <h2 className="game-results-title">Results</h2>
          <p className="game-results-summary">
            {mode === 'time' ? `${durationSeconds}s` : `${wordCount} words`} ·{' '}
            {languageLabel}
          </p>
          <div className="game-results-grid">
            <div className="game-result-card">
              <span className="game-result-label">Accuracy</span>
              <span className="game-result-value game-result-value--accent">
                {results.accuracy.toFixed(1)}%
              </span>
            </div>
            <div className="game-result-card">
              <span className="game-result-label">WPM</span>
              <span className="game-result-value">
                {Math.round(results.wpm)}
              </span>
            </div>
            <div className="game-result-card">
              <span className="game-result-label">Time</span>
              <span className="game-result-value">
                {formatTime(results.elapsedSeconds)}
              </span>
            </div>
          </div>
          <button type="button" className="game-button" onClick={resetGame}>
            Play again
          </button>
        </div>
      </div>
    )
  }

  const completedWords =
    mode === 'words'
      ? countCompletedWords(input, boundaries)
      : input.trim() === ''
        ? 0
        : input.trim().split(/\s+/).length

  return (
    <div className="game">
      <div className="game-header">
        {mode === 'time' ? (
          <div className="game-stat">
            <span>Time</span>
            <span
              className={`game-stat-value${phase === 'playing' && timeLeft <= 10 ? ' game-stat-value--accent' : ''}`}
            >
              {phase === 'idle'
                ? formatTime(durationSeconds)
                : formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <div className="game-stat">
            <span>Words</span>
            <span className="game-stat-value">
              {completedWords} / {wordCount}
            </span>
          </div>
        )}
        <div className="game-stat">
          <span>Language</span>
          <span className="game-stat-value">{languageLabel}</span>
        </div>
      </div>

      {phase === 'idle' && (
        <p className="game-prompt">Start typing to begin…</p>
      )}

      <div className="game-words" aria-hidden="true">
        {target.split('').map((char, index) => (
          <span
            key={`${index}-${char}`}
            className={getCharClass(target, input, index, boundaries)}
          >
            {char}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        className="game-input"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
      />
    </div>
  )
}
