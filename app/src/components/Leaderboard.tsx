import { useState } from 'react'
import './leaderboard.css'

type FilterMode = 'all' | 'time' | 'words'
type FilterLang = 'all' | 'en' | 'pl'
type FilterLeaderboard = 'global' | 'local'

interface ScoreEntry {
  id: number
  username: string
  wpm: number
  score: number
  game_type: string
  text_type: string
  language: string
  achieved_at: string
}

const MOCK_SCORES: ScoreEntry[] = [
  {
    id: 1,
    username: 'speedmaster',
    wpm: 67,
    score: 98.5,
    game_type: 'time',
    text_type: 'sentences',
    language: 'en',
    achieved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    username: 'quickfingers',
    wpm: 138,
    score: 97.2,
    game_type: 'time',
    text_type: 'sentences',
    language: 'en',
    achieved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    username: 'typeracer',
    wpm: 125,
    score: 96.1,
    game_type: 'words',
    text_type: 'words',
    language: 'en',
    achieved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    username: 'klawiatura',
    wpm: 118,
    score: 99.0,
    game_type: 'time',
    text_type: 'sentences',
    language: 'pl',
    achieved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    username: 'fastpaw',
    wpm: 112,
    score: 94.8,
    game_type: 'words',
    text_type: 'words',
    language: 'en',
    achieved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    username: 'polskityper',
    wpm: 105,
    score: 97.5,
    game_type: 'time',
    text_type: 'sentences',
    language: 'pl',
    achieved_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<ScoreEntry[]>(MOCK_SCORES)
  const [modeFilter, setModeFilter] = useState<FilterMode>('all')
  const [langFilter, setLangFilter] = useState<FilterLang>('all')
  const [leaderboardFilter, setLeaderboardFilter] = useState<FilterLeaderboard>('local')
  // Demo refresh: just reset to mock data
  function refreshScores() {
    setEntries([...MOCK_SCORES])
  }

  // Client-side filtering
  const filtered = entries.filter((e) => {
    if (modeFilter !== 'all' && e.game_type !== modeFilter) return false
    if (langFilter !== 'all' && e.language !== langFilter) return false
    return true
  })

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <button
          type="button"
          className="leaderboard-refresh"
          onClick={refreshScores}
          aria-label="Refresh leaderboard"
        >
          ↺ Refresh
        </button>
      </div>

      <div className="leaderboard-filters" role="group" aria-label="Filter scores">
        <div className="lb-filter-group">
          {(['all', 'time', 'words'] as FilterMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className="lb-filter-btn"
              data-active={modeFilter === m}
              onClick={() => setModeFilter(m)}
            >
              {m === 'all' ? 'All modes' : m === 'time' ? 'Timed' : 'Words'}
            </button>
          ))}
        </div>
        <div className="lb-filter-group">
          {(['all', 'en', 'pl'] as FilterLang[]).map((l) => (
            <button
              key={l}
              type="button"
              className="lb-filter-btn"
              data-active={langFilter === l}
              onClick={() => setLangFilter(l)}
            >
              {l === 'all' ? 'All languages' : l === 'en' ? 'English' : 'Polish'}
            </button>
          ))}
        </div>
        <div className="lb-filter-group">
          {(['global', 'local'] as FilterLeaderboard[]).map((lb) => (
            <button
              key={lb}
              type="button"
              className="lb-filter-btn"
              data-active={leaderboardFilter === lb}
              onClick={() => setLeaderboardFilter(lb)}
            >
              {lb === 'global' ? 'Global' : 'Local'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <table className="leaderboard-table" aria-label="Top scores">
        <thead>
          <tr>
            <th className="col-rank" scope="col">#</th>
            <th scope="col">Player</th>
            <th className="col-wpm" scope="col">WPM</th>
            <th className="col-acc" scope="col">Acc</th>
            <th className="col-date" scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="leaderboard-state">
                {entries.length === 0
                  ? 'No scores yet — be the first!'
                  : 'No results match these filters'}
              </td>
            </tr>
          )}

          {filtered.map((entry, i) => (
            <tr key={entry.id}>
              <td className="col-rank">
                <span>{i + 1}</span>
              </td>
              <td className="lb-username">{entry.username}</td>
              <td className="col-wpm">{Math.round(entry.wpm)}</td>
              <td className="col-acc">
                {entry.score != null ? `${entry.score.toFixed(1)}%` : '—'}
              </td>
              <td className="col-date">{formatDate(entry.achieved_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="leaderboard-note">
        Demo mode — static sample data shown
      </p>
    </div>
  )
}
