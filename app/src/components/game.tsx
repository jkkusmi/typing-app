import { useCallback, useEffect, useRef, useState } from 'react'
import enRaw from '../assets/words/en.txt?raw'
import plRaw from '../assets/words/pl.txt?raw'
import { recordScore } from '../scores/localScores'
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

type WpmSample = {
  second: number
  wpm: number
}

const WPM_SAMPLE_INTERVAL_MS = 1000

type ParsedBuffer = {
  completed: string[]
  current: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  pl: 'Polish',
}

const TIME_BUFFER_SIZE = 30
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

function parseBuffer(buffer: string): ParsedBuffer {
  if (buffer === '') return { completed: [], current: '' }

  if (buffer.endsWith(' ')) {
    const parts = buffer.split(' ')
    parts.pop()
    return { completed: parts, current: '' }
  }

  const parts = buffer.split(' ')
  const current = parts.pop() ?? ''
  return { completed: parts, current }
}

function bufferToSegments(buffer: string): string[] {
  const { completed, current } = parseBuffer(buffer)
  if (current.length > 0) return [...completed, current]
  return completed
}

function getActiveWordForTarget(
  buffer: string,
  wordIndex: number,
  activeTargetIndex: number,
): string {
  const segments = bufferToSegments(buffer)
  const offset = wordIndex - activeTargetIndex
  if (offset < 0) return ''
  return segments[offset] ?? ''
}

function canCommitBuffer(
  completed: string[],
  activeTargetIndex: number,
  targetWords: string[],
): boolean {
  if (completed.length === 0) return false

  const lastCompleted = completed[completed.length - 1]
  const lastTargetIndex = activeTargetIndex + completed.length - 1

  // Last segment matches its slot (e.g. "prange tree " → "tree" matches target[1])
  if (
    lastTargetIndex < targetWords.length &&
    lastCompleted === targetWords[lastTargetIndex]
  ) {
    return true
  }

  // Retries at the current target (e.g. "helol hello " → "hello" matches target[0])
  return lastCompleted === targetWords[activeTargetIndex]
}

function getCursorPosition(
  buffer: string,
  activeTargetIndex: number,
): { wordIndex: number; charIndex: number } {
  const { completed, current } = parseBuffer(buffer)

  if (completed.length === 0 && current.length === 0) {
    return { wordIndex: activeTargetIndex, charIndex: 0 }
  }

  if (current.length > 0) {
    return {
      wordIndex: activeTargetIndex + completed.length,
      charIndex: current.length,
    }
  }

  return {
    wordIndex: activeTargetIndex + completed.length,
    charIndex: 0,
  }
}

function isWordCorrect(expected: string, typed: string): boolean {
  return typed === expected
}

function getCharClass(
  expectedWord: string,
  charIndex: number,
  wordIndex: number,
  activeTargetIndex: number,
  typedWords: string[],
  buffer: string,
): string {
  if (wordIndex < activeTargetIndex) {
    const typed = typedWords[wordIndex] ?? ''
    return isWordCorrect(expectedWord, typed)
      ? 'game-char game-char--correct'
      : 'game-char game-char--word-wrong'
  }

  const activeWord = getActiveWordForTarget(buffer, wordIndex, activeTargetIndex)
  if (activeWord.length === 0) return 'game-char'

  if (charIndex >= activeWord.length) return 'game-char'
  return activeWord[charIndex] === expectedWord[charIndex]
    ? 'game-char game-char--correct'
    : 'game-char game-char--incorrect'
}

function computeResults(
  targetWords: string[],
  typedWords: string[],
  buffer: string,
  elapsedSeconds: number,
  includeBuffer: boolean,
): GameResults {
  const uncommitted = includeBuffer ? bufferToSegments(buffer) : []
  const allTyped = [...typedWords, ...uncommitted]

  let totalChars = 0
  let correctChars = 0

  for (let i = 0; i < allTyped.length; i += 1) {
    const typed = allTyped[i]
    const expected = targetWords[i] ?? ''
    totalChars += typed.length
    for (let j = 0; j < typed.length; j += 1) {
      if (j < expected.length && typed[j] === expected[j]) {
        correctChars += 1
      }
    }
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

function computeWpmAtTime(
  targetWords: string[],
  typedWords: string[],
  buffer: string,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) return 0
  const { correctChars } = computeResults(
    targetWords,
    typedWords,
    buffer,
    elapsedSeconds,
    true,
  )
  return correctChars / 5 / (elapsedSeconds / 60)
}

function WpmChart({ samples }: { samples: WpmSample[] }) {
  if (samples.length === 0) return null

  const width = 640
  const height = 200
  const pad = { top: 16, right: 16, bottom: 32, left: 44 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const maxSecond = Math.max(samples[samples.length - 1].second, 1)
  const maxWpm = Math.max(...samples.map((s) => s.wpm), 10)

  const toX = (second: number) => pad.left + (second / maxSecond) * chartW
  const toY = (wpm: number) => pad.top + chartH - (wpm / maxWpm) * chartH

  const linePath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(s.second).toFixed(1)} ${toY(s.wpm).toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${toX(samples[samples.length - 1].second).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(samples[0].second).toFixed(1)} ${toY(0).toFixed(1)} Z`

  const yTicks = 4
  const xTicks = Math.min(maxSecond, 6)

  return (
    <div className="game-wpm-chart">
      <h3 className="game-wpm-chart-title">WPM over time</h3>
      <svg
        className="game-wpm-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="WPM over time chart"
      >
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const wpm = (maxWpm / yTicks) * i
          const y = toY(wpm)
          return (
            <g key={`y-${i}`}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                className="game-wpm-chart-grid"
              />
              <text x={pad.left - 8} y={y + 4} className="game-wpm-chart-axis">
                {Math.round(wpm)}
              </text>
            </g>
          )
        })}

        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const second = Math.round((maxSecond / xTicks) * i)
          const x = toX(second)
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={height - 8}
              className="game-wpm-chart-axis game-wpm-chart-axis--x"
            >
              {second}s
            </text>
          )
        })}

        <path d={areaPath} className="game-wpm-chart-area" />
        <path d={linePath} className="game-wpm-chart-line" />

        {samples.map((s) => (
          <circle
            key={s.second}
            cx={toX(s.second)}
            cy={toY(s.wpm)}
            r={3}
            className="game-wpm-chart-dot"
          />
        ))}
      </svg>
    </div>
  )
}

export default function Game({
  mode = 'time',
  durationSeconds = 60,
  wordCount = 25,
  language = 'en',
}: GameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const typedWordsRef = useRef<string[]>([])
  const bufferRef = useRef('')
  const wordsRef = useRef<string[]>([])
  const finishRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)
  const wpmHistoryRef = useRef<WpmSample[]>([])

  const wordPool = WORD_LISTS[language]

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [words, setWords] = useState<string[]>(() =>
    pickRandomWords(
      wordPool ?? [],
      mode === 'words' ? wordCount : TIME_BUFFER_SIZE,
    ),
  )
  const [typedWords, setTypedWords] = useState<string[]>([])
  const [buffer, setBuffer] = useState('')
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [results, setResults] = useState<GameResults | null>(null)
  const [wpmHistory, setWpmHistory] = useState<WpmSample[]>([])

  wordsRef.current = words

  const activeTargetIndex = typedWords.length
  const languageLabel = LANGUAGE_LABELS[language] ?? language
  const cursorPosition = getCursorPosition(buffer, activeTargetIndex)

  const resetGame = useCallback(() => {
    finishRef.current = false
    startTimeRef.current = null
    typedWordsRef.current = []
    bufferRef.current = ''
    wpmHistoryRef.current = []
    setPhase('idle')
    setTypedWords([])
    setBuffer('')
    setTimeLeft(durationSeconds)
    setElapsedSeconds(0)
    setResults(null)
    setWpmHistory([])
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
    (finalTypedWords: string[], finalBuffer: string, elapsed: number) => {
      if (finishRef.current) return
      finishRef.current = true
      setPhase('finished')
      const gameResults = computeResults(
        wordsRef.current,
        finalTypedWords,
        finalBuffer,
        elapsed,
        finalBuffer.length > 0,
      )
      setResults(gameResults)

      const history = [...wpmHistoryRef.current]
      const finalSample = { second: elapsed, wpm: gameResults.wpm }
      if (history.length === 0 || history[history.length - 1].second !== elapsed) {
        history.push(finalSample)
      } else {
        history[history.length - 1] = finalSample
      }
      setWpmHistory(history)
      wpmHistoryRef.current = []

      void recordScore({
        wpm: gameResults.wpm,
        score: gameResults.accuracy,
        game_type: mode,
        text_type: 'words',
        language,
      })
    },
    [mode, language],
  )

  const commitBufferWords = useCallback(
    (completed: string[]) => {
      const nextTypedWords = [...typedWordsRef.current, ...completed]
      typedWordsRef.current = nextTypedWords
      setTypedWords(nextTypedWords)

      bufferRef.current = ''
      setBuffer('')

      if (mode === 'words' && nextTypedWords.length >= wordCount) {
        const elapsed = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : elapsedSeconds
        finishGame(nextTypedWords, '', elapsed)
      }
    },
    [mode, wordCount, elapsedSeconds, finishGame],
  )

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'time') return

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          finishGame(
            typedWordsRef.current,
            bufferRef.current,
            durationSeconds,
          )
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

    const sampleWpm = () => {
      if (startTimeRef.current === null) return
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      if (elapsed <= 0) return

      const wpm = computeWpmAtTime(
        wordsRef.current,
        typedWordsRef.current,
        bufferRef.current,
        elapsed,
      )

      const history = wpmHistoryRef.current
      const last = history[history.length - 1]
      if (last?.second === elapsed) {
        history[history.length - 1] = { second: elapsed, wpm }
      } else {
        history.push({ second: elapsed, wpm })
      }
    }

    sampleWpm()
    const interval = window.setInterval(sampleWpm, WPM_SAMPLE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [phase])

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
    if (phase !== 'playing' || mode !== 'time') return
    const remainingWords = words.length - typedWords.length
    if (remainingWords <= TIME_REFILL_THRESHOLD && wordPool) {
      setWords((prev) => [
        ...prev,
        ...pickRandomWords(wordPool, TIME_BUFFER_SIZE),
      ])
    }
  }, [typedWords.length, words.length, phase, mode, wordPool])

  const handleInputChange = (value: string) => {
    if (phase === 'finished') return

    if (phase === 'idle' && value.length > 0) {
      startTimeRef.current = Date.now()
      setPhase('playing')
    }

    bufferRef.current = value
    setBuffer(value)

    if (!value.endsWith(' ')) return

    const { completed } = parseBuffer(value)
    if (completed.length === 0) return

    if (
      canCommitBuffer(
        completed,
        typedWordsRef.current.length,
        wordsRef.current,
      )
    ) {
      commitBufferWords(completed)
    }
  }

  const focusInput = () => {
    inputRef.current?.focus()
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
          <WpmChart samples={wpmHistory} />
          <button type="button" className="game-button" onClick={resetGame}>
            Play again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="game game--play"
      onMouseDown={(e) => {
        e.preventDefault()
        focusInput()
      }}
    >
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
              {typedWords.length} / {wordCount}
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

      <div className="game-words">
        {words.map((word, wIdx) => (
          <span key={`${wIdx}-${word}`}>
            {word.split('').map((char, cIdx) => (
              <span key={cIdx}>
                {cursorPosition.wordIndex === wIdx &&
                  cursorPosition.charIndex === cIdx && (
                    <span className="game-cursor" aria-hidden="true" />
                  )}
                <span
                  className={getCharClass(
                    word,
                    cIdx,
                    wIdx,
                    activeTargetIndex,
                    typedWords,
                    buffer,
                  )}
                >
                  {char}
                </span>
              </span>
            ))}
            {cursorPosition.wordIndex === wIdx &&
              cursorPosition.charIndex === word.length && (
                <span className="game-cursor" aria-hidden="true" />
              )}
            {wIdx < words.length - 1 && ' '}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        className="game-input"
        value={buffer}
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
