import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import games from '../data/games.json'
import GameCard from '../components/GameCard'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()

  function handleStart() {
    // Генеруємо унікальний ID для нової сесії і переходимо до неї
    const sessionId = uuidv4()
    navigate(`/session/${sessionId}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Game Rater</h1>
          <p className={styles.subtitle}>
            Оціни ігри разом з другом — знайдіть спільний вибір
          </p>
        </div>
        <button className={styles.startBtn} onClick={handleStart}>
          Почати оцінювання →
        </button>
      </header>

      <div className={styles.grid}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}
