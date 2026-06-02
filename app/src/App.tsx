import Game from './components/game.tsx'

export default function App() {
  return (
    <main>
      <Game mode="time" durationSeconds={15} language="en" />
    </main>
  )
}
