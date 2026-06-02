import Game from './components/game.tsx'

export default function App() {
  return (
    <main>
      <Game mode="time" durationSeconds={60} language="en" />
    </main>
  )
}
