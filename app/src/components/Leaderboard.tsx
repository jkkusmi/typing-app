import { useCallback, useEffect, useState } from 'react'
import { apiGetGlobalScores, type ScoreEntry } from '../api/api'
import { loadLocalScores } from '../scores/localScores'
import './leaderboard.css'

type FilterMode = 'all' | 'time' | 'words'
type FilterLang = 'all' | 'en' | 'pl'
type FilterLeaderboard = 'global' | 'local'

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
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modeFilter, setModeFilter] = useState<FilterMode>('all')
  const [langFilter, setLangFilter] = useState<FilterLang>('all')
  const [leaderboardFilter, setLeaderboardFilter] =
    useState<FilterLeaderboard>('local')

  const loadScores = useCallback(async () => {
    if (leaderboardFilter === 'local') {
      setError(null)
      setEntries(loadLocalScores())
      return
    }

    setLoading(true)
    setError(null)
    try {
      const scores = await apiGetGlobalScores()
      setEntries(scores)
    } catch (err) {
      setEntries([])
      setError(
        err instanceof Error ? err.message : 'Failed to load global scores',
      )
    } finally {
      setLoading(false)
    }
  }, [leaderboardFilter])

  useEffect(() => {
    loadScores()
  }, [loadScores])

  useEffect(() => {
    const handleLocalUpdate = () => {
      if (leaderboardFilter === 'local') {
        setEntries(loadLocalScores())
      }
    }

    window.addEventListener('local-scores-updated', handleLocalUpdate)
    return () =>
      window.removeEventListener('local-scores-updated', handleLocalUpdate)
  }, [leaderboardFilter])

  const filtered = entries
    .filter((e) => {
      if (modeFilter !== 'all' && e.game_type !== modeFilter) return false
      if (langFilter !== 'all' && e.language !== langFilter) return false
      return true
    })
    .sort((a, b) => b.wpm - a.wpm)

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <button
          type="button"
          className="leaderboard-refresh"
          onClick={loadScores}
          aria-label="Refresh leaderboard"
          disabled={loading}
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
          {loading && (
            <tr>
              <td colSpan={5} className="leaderboard-state">
                Loading scores…
              </td>
            </tr>
          )}

          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="leaderboard-state">
                {error ??
                  (entries.length === 0
                    ? leaderboardFilter === 'local'
                      ? 'No local scores yet, play a game to get started!'
                      : 'No global scores yet'
                    : 'No results match these filters')}
              </td>
            </tr>
          )}

          {!loading &&
            filtered.map((entry, i) => (
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
        {leaderboardFilter === 'local'
          ? 'Showing scores saved in this browser'
          : 'Showing global scores from the server'}
      </p>
    </div>
  )
}
