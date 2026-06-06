import { useCallback, useEffect, useState } from 'react'
import { apiGetTopScores, type ScoreEntry } from '../api/api'
import './leaderboard.css'

type FilterMode = 'all' | 'time' | 'words'
type FilterLang = 'all' | 'en' | 'pl'

const MOCK_SCORES: ScoreEntry[] = [
  { 
    id: -1, 
    username: 'speedmaster',  
    wpm: 142, 
    score: 98.5, 
    game_type: 'time',  
    text_type: 'words', 
    language: 'en', 
    achieved_at: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { 
    id: -2, 
    username: 'quickfingers', 
    wpm: 138, 
    score: 97.2, 
    game_type: 'time', 
    text_type: 'words', 
    language: 'en', 
    achieved_at: new Date(Date.now() - 5 * 86_400_000).toISOString() },
  { 
    id: -3, 
    username: 'klawiatura',   
    wpm: 125, 
    score: 99.0, game_type: 'words', 
    text_type: 'words', 
    language: 'pl', 
    achieved_at: new Date(Date.now() - 1 * 86_400_000).toISOString() },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

function applyFilters(entries: ScoreEntry[], mode: FilterMode, lang: FilterLang): ScoreEntry[] {
  return entries.filter((e) => {
    if (mode !== 'all' && e.game_type !== mode) return false
    if (lang !== 'all' && e.language !== lang) return false
    return true
  })
}

function FilterGroup<T extends string>({
  options,
  active,
  label,
  onSelect,
}: {
  options: { value: T; label: string }[]
  active: T
  label: string
  onSelect: (v: T) => void
}) {
  return (
    <div className="lb-filter-group" role="group" aria-label={label}>
      {options.map(({ value, label: text }) => (
        <button
          key={value}
          type="button"
          className="lb-filter-btn"
          data-active={active === value}
          onClick={() => onSelect(value)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export default function Leaderboard() {
  const [liveEntries, setLiveEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modeFilter, setModeFilter] = useState<FilterMode>('all')
  const [langFilter, setLangFilter] = useState<FilterLang>('all')

  const fetchScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLiveEntries(await apiGetTopScores(50))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load scores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScores() }, [fetchScores])

  const filteredMock = applyFilters(MOCK_SCORES, modeFilter, langFilter)
  const filteredLive = applyFilters(liveEntries, modeFilter, langFilter)
  const hasRows = filteredMock.length > 0 || filteredLive.length > 0

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <button 
        type="button" 
        className="leaderboard-refresh" 
        onClick={fetchScores} 
        disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="leaderboard-filters">
        <FilterGroup
          label="Mode filter"
          active={modeFilter}
          options={[
            { value: 'all',   label: 'All modes' },
            { value: 'time',  label: 'Timed' },
            { value: 'words', label: 'Words' },
          ]}
          onSelect={setModeFilter}
        />
        <FilterGroup
          label="Language filter"
          active={langFilter}
          options={[
            { value: 'all', label: 'All languages' },
            { value: 'en', label: 'English' },
            { value: 'pl', label: 'Polish' },
          ]}
          onSelect={setLangFilter}
        />
      </div>

      <table className="leaderboard-table" aria-label="Top scores">
        <thead>
          <tr>
            <th className="col-rank" scope="col">#</th>
            <th scope="col">Player</th>
            <th className="col-right" scope="col">WPM</th>
            <th className="col-right" scope="col">Accuracy</th>
            <th className="col-right" scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {!loading && error && (
            <tr>
              <td colSpan={5} className="leaderboard-state leaderboard-state--error">{error}</td>
            </tr>
          )}

          {!loading && !error && !hasRows && (
            <tr>
              <td colSpan={5} className="leaderboard-state">No results match these filters.</td>
            </tr>
          )}

          {!loading && filteredMock.map((entry, i) => (
            <tr key={entry.id} className="lb-row-mock">
              <td className="col-rank">{i + 1}</td>
              <td className="lb-username">{entry.username}</td>
              <td className="col-right col-wpm">{Math.round(entry.wpm)}</td>
              <td className="col-right">{entry.score != null ? `${entry.score.toFixed(1)}%` : '—'}</td>
              <td className="col-right">{formatDate(entry.achieved_at)}</td>
            </tr>
          ))}

          {!loading && filteredMock.length > 0 && filteredLive.length > 0 && (
            <tr className="lb-divider-row" aria-hidden="true">
              <td colSpan={5}><div className="lb-divider"><span className="lb-divider-label">live data</span></div></td>
            </tr>
          )}

          {!loading && filteredLive.map((entry, i) => (
            <tr key={entry.id}>
              <td className="col-rank">{filteredMock.length + i + 1}</td>
              <td className="lb-username">{entry.username}</td>
              <td className="col-right col-wpm">{Math.round(entry.wpm)}</td>
              <td className="col-right">{entry.score != null ? `${entry.score.toFixed(1)}%` : '—'}</td>
              <td className="col-right">{formatDate(entry.achieved_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && liveEntries.length === 0 && (
        <p className="leaderboard-note">Live scores will appear once the backend endpoint is connected.</p>
      )}
    </div>
  )
}
