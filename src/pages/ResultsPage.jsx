import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, doc, deleteDoc, getDocs } from 'firebase/firestore'
import { db, ensureSignedIn } from '../firebase'
import { clearOwnedNickname } from '../lib/ownership'
import games from '../data/games.json'
import GameCard from '../components/GameCard'
import styles from './ResultsPage.module.css'

export default function ResultsPage() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()

  const [scores, setScores] = useState([])    // [{ gameId, avg, ratings: {nick: val} }]
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')

  const myNickname = localStorage.getItem('gr_nickname')

  useEffect(() => {
    async function fetchResults() {
      try {
        const scoresSnap = await getDocs(
          collection(db, 'sessions', sessionId, 'scores')
        )

        const allScores = []
        scoresSnap.forEach((doc) => {
          allScores.push({ nickname: doc.id, ...doc.data() })
        })

        setParticipants(allScores.map((s) => s.nickname))

        // Рахуємо середній бал по кожній грі
        const averaged = games.map((game) => {
          const vals = allScores
            .map((s) => s.ratings?.[game.id])
            .filter((v) => v != null)

          const avg = vals.length
            ? vals.reduce((a, b) => a + b, 0) / vals.length
            : null

          const ratingsMap = {}
          allScores.forEach((s) => {
            if (s.ratings?.[game.id] != null) {
              ratingsMap[s.nickname] = s.ratings[game.id]
            }
          })

          return { game, avg, ratings: ratingsMap }
        })

        // Сортуємо за середнім балом (desc), ігри без оцінок — в кінець
        averaged.sort((a, b) => {
          if (a.avg == null) return 1
          if (b.avg == null) return -1
          return b.avg - a.avg
        })

        setScores(averaged)
      } catch (err) {
        console.error('Помилка завантаження результатів:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId])

  // Видаляємо свій запис з Firestore і повертаємось на екран введення імені.
  // Використовується кнопкою "Скинути мої оцінки".
  async function handleReset() {
    if (!myNickname) return
    const ok = window.confirm(
      'Видалити твої оцінки з цієї сесії? Це незворотно.'
    )
    if (!ok) return
    try {
      await ensureSignedIn()
      await deleteDoc(doc(db, 'sessions', sessionId, 'scores', myNickname))
      clearOwnedNickname(sessionId)
      navigate(`/session/${sessionId}`)
    } catch (err) {
      console.error('Помилка скидання:', err)
      alert('Не вдалося скинути оцінки. Перевір консоль.')
    }
  }

  // Копіюємо посилання на сесію
  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#/session/${sessionId}`
    navigator.clipboard.writeText(url)
      .then(() => alert('Посилання скопійовано!'))
      .catch(() => alert(url))
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <p>Завантажуємо результати...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Результати</h1>
          <p className={styles.subtitle}>
            {participants.length === 0
              ? 'Ще ніхто не оцінив'
              : `Учасники: ${participants.join(', ')}`}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.toggleBtn}
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? '☰ Список' : '⊞ Грід'}
          </button>
          <button className={styles.copyBtn} onClick={copyLink}>
            Поділитись посиланням
          </button>
          <button
            className={styles.rateBtn}
            onClick={() =>
              navigate(`/session/${sessionId}`, {
                state: { reRate: Boolean(myNickname) },
              })
            }
          >
            {myNickname ? 'Переоцінити' : 'Оцінити'}
          </button>
          {myNickname && participants.includes(myNickname) && (
            <button className={styles.resetBtn} onClick={handleReset}>
              Скинути мої оцінки
            </button>
          )}
        </div>
      </header>

      {participants.length === 0 ? (
        <div className={styles.empty}>
          <p>Поділись посиланням з другом — хай оцінить ігри</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {scores.map(({ game, avg, ratings }, index) => (
            <div key={game.id} className={styles.cardWrapper}>
              {index < 3 && avg != null && (
                <div className={styles.medal}>
                  {['🥇', '🥈', '🥉'][index]}
                </div>
              )}
              <GameCard game={game} rating={avg} />
              {Object.keys(ratings).length > 0 && (
                <div className={styles.breakdown}>
                  {Object.entries(ratings).map(([nick, val]) => (
                    <span
                      key={nick}
                      className={`${styles.pill} ${nick === myNickname ? styles.mine : ''}`}
                    >
                      {nick}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ol className={styles.list}>
          {scores.map(({ game, avg }, index) => (
            <li key={game.id} className={styles.listItem}>
              <span className={styles.listRank}>{index + 1}</span>
              <span className={styles.listTitle}>{game.title}</span>
              {avg != null && (
                <span className={styles.listAvg}>{avg.toFixed(1)}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
