import { useState } from 'react'
import BurgerMenu from './components/BurgerMenu'
import Game from './components/game'
import Leaderboard from './components/Leaderboard'

type View = 'game' | 'leaderboard'

export default function App() {
  const [view, setView] = useState<View>('game')

  return (
    <main>
      <BurgerMenu
        activeView={view}
        onNavigate={(v) => setView(v as View)}
      />
      {view === 'game' && (
        <Game mode="time" durationSeconds={15} language="en" />
      )}
      {view === 'leaderboard' && (
        <Leaderboard />
      )}
    </main>
  )
}
