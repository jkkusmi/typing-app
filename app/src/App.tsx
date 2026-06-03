<<<<<<< HEAD
import { useState } from 'react'
import BurgerMenu from './components/BurgerMenu'
import Game from './components/game'
import Leaderboard from './components/Leaderboard'

type View = 'game' | 'leaderboard'

export default function App() {
  const [view, setView] = useState<View>('game')
=======
import Game from './components/game.tsx'
>>>>>>> feature/game-logic

export default function App() {
  return (
    <main>
<<<<<<< HEAD
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
=======
      <Game mode="time" durationSeconds={15} language="en" />
>>>>>>> feature/game-logic
    </main>
  )
}
