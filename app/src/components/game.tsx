import { useCallback, useEffect, useRef, useState } from 'react'
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

  wordsRef.current = words

  const activeTargetIndex = typedWords.length
  const languageLabel = LANGUAGE_LABELS[language] ?? language

  const resetGame = useCallback(() => {
    finishRef.current = false
    startTimeRef.current = null
    typedWordsRef.current = []
    bufferRef.current = ''
    setPhase('idle')
    setTypedWords([])
    setBuffer('')
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
    (finalTypedWords: string[], finalBuffer: string, elapsed: number) => {
      if (finishRef.current) return
      finishRef.current = true
      setPhase('finished')
      setResults(
        computeResults(
          wordsRef.current,
          finalTypedWords,
          finalBuffer,
          elapsed,
          finalBuffer.length > 0,
        ),
      )
    },
    [],
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

      <div className="game-words" aria-hidden="true">
        {words.map((word, wIdx) => (
          <span key={`${wIdx}-${word}`}>
            {word.split('').map((char, cIdx) => (
              <span
                key={cIdx}
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
            ))}
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
