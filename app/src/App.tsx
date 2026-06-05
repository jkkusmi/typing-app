import { useState } from 'react'
import BurgerMenu from './components/BurgerMenu'
import Game from './components/game'
import Leaderboard from './components/Leaderboard'
import Gamebar, { loadGameSettings, type GameSettings } from './components/gamebar'

type View = 'game' | 'leaderboard'

export default function App() {
  const [view, setView] = useState<View>('game')
  const [gameSettings, setGameSettings] = useState<GameSettings>(loadGameSettings)

  return (
    <main>
      <BurgerMenu
        activeView={view}
        onNavigate={(v) => setView(v as View)}
      />
      {view === 'game' && (
        <>
          <Gamebar
            settings={gameSettings}
            onSettingsChange={setGameSettings}
          />
          <Game
            key={`${gameSettings.mode}-${gameSettings.durationSeconds}-${gameSettings.wordCount}-${gameSettings.language}`}
            mode={gameSettings.mode}
            durationSeconds={gameSettings.durationSeconds}
            wordCount={gameSettings.wordCount}
            language={gameSettings.language}
          />
        </>
      )}
      {view === 'leaderboard' && <Leaderboard />}
    </main>
  )
}
