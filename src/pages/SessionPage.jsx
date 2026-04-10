import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, signInAnon } from '../firebase'
import games from '../data/games.json'
import GameCard from '../components/GameCard'
import styles from './SessionPage.module.css'

export default function SessionPage() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  // nicknameSaved = чи підтвердив юзер ім'я в ЦІЙ сесії
  // завжди починаємо з false, щоб екран імені завжди показувався
  const [nicknameSaved, setNicknameSaved] = useState(false)

  const [ratings, setRatings] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // 'grid' | 'card'
  const [mode, setMode] = useState('card')
  // поточний індекс у card mode
  const [cardIndex, setCardIndex] = useState(0)
  // true коли пройшли всі картки в card mode
  const [cardsDone, setCardsDone] = useState(false)

  useEffect(() => {
    // Передзаповнюємо поле якщо ім'я вже є, але НЕ пропускаємо екран
    const saved = localStorage.getItem('gr_nickname')
    if (saved) {
      setNicknameInput(saved)
    }
    const initial = {}
    games.forEach((g) => { initial[g.id] = 5 })
    setRatings(initial)
  }, [])

  useEffect(() => {
    if (!nickname) return
    const check = async () => {
      const ref = doc(db, 'sessions', sessionId, 'scores', nickname)
      const snap = await getDoc(ref)
      if (snap.exists()) navigate(`/session/${sessionId}/results`)
    }
    check()
  }, [nickname, sessionId, navigate])

  function handleNicknameSave() {
    const trimmed = nicknameInput.trim()
    if (!trimmed) return
    localStorage.setItem('gr_nickname', trimmed)
    setNickname(trimmed)
    setNicknameSaved(true)
  }

  function handleRate(gameId, value) {
    setRatings((prev) => ({ ...prev, [gameId]: value }))
  }

  // Card mode: наступна картка
  function handleNextCard() {
    if (cardIndex < games.length - 1) {
      setCardIndex((i) => i + 1)
    } else {
      setCardsDone(true)
    }
  }

  // Card mode: попередня картка
  function handlePrevCard() {
    if (cardIndex > 0) setCardIndex((i) => i - 1)
  }

  // Підтвердити в card mode → повернутись у grid
  function handleCardConfirm() {
    setCardsDone(false)
    setCardIndex(0)
    setMode('grid')
  }

  // Перемикач mode
  function toggleMode() {
    if (mode === 'grid') {
      setCardIndex(0)
      setCardsDone(false)
      setMode('card')
    } else {
      setMode('grid')
    }
  }

  async function handleSubmit() {
    if (!nickname) return
    setSaving(true)
    try {
      await signInAnon()
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionSnap = await getDoc(sessionRef)
      if (!sessionSnap.exists()) {
        await setDoc(sessionRef, { createdAt: serverTimestamp(), gameListId: 'default' })
      }
      const scoresRef = doc(db, 'sessions', sessionId, 'scores', nickname)
      await setDoc(scoresRef, {
        displayName: nickname,
        completedAt: serverTimestamp(),
        ratings,
      })
      setDone(true)
      setTimeout(() => navigate(`/session/${sessionId}/results`), 1500)
    } catch (err) {
      console.error('Помилка збереження:', err)
      alert('Щось пішло не так. Перевір консоль.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Нікнейм ────────────────────────────────────────────────────────────────
  if (!nicknameSaved) {
    return (
      <div className={styles.nicknamePage}>
        <div className={styles.nicknameCard}>
          <h2>Як тебе звати?</h2>
          <p>Нікнейм потрібен щоб прив'язати твої оцінки до сесії</p>
          <input
            type="text"
            placeholder="Наприклад: Serhii"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNicknameSave()}
            className={styles.nicknameInput}
            maxLength={30}
            autoFocus
          />
          <button
            onClick={handleNicknameSave}
            disabled={!nicknameInput.trim()}
            className={styles.nicknameBtn}
          >
            Продовжити
          </button>
        </div>
      </div>
    )
  }

  // ─── Збережено ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className={styles.nicknamePage}>
        <div className={styles.nicknameCard}>
          <p style={{ fontSize: '2rem' }}>✓</p>
          <h2>Оцінки збережено!</h2>
          <p>Переходимо до результатів...</p>
        </div>
      </div>
    )
  }

  // ─── Card mode: всі картки пройдено ────────────────────────────────────────
  if (mode === 'card' && cardsDone) {
    return (
      <div className={styles.nicknamePage}>
        <div className={styles.nicknameCard}>
          <p style={{ fontSize: '2rem' }}>🎮</p>
          <h2>Всі ігри оцінено!</h2>
          <p>Перевір оцінки в гріді і підтверди коли будеш готовий</p>
          <button className={styles.nicknameBtn} onClick={handleCardConfirm}>
            Переглянути грід →
          </button>
        </div>
      </div>
    )
  }

  // ─── Card mode ──────────────────────────────────────────────────────────────
  if (mode === 'card') {
    const game = games[cardIndex]
    const progress = Math.round(((cardIndex + 1) / games.length) * 100)

    return (
      <div className={styles.cardModePage}>

        {/* Хедер */}
        <header className={styles.cardModeHeader}>
          <button className={styles.modeToggleBtn} onClick={toggleMode}>
            ☰ Грід
          </button>
          <span className={styles.cardCounter}>
            {cardIndex + 1} / {games.length}
          </span>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Зберігаємо...' : 'Зберегти →'}
          </button>
        </header>

        {/* Прогрес-бар */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Картка */}
        <div className={styles.cardModeContent}>
          <div className={styles.cardModeCard}>
            <GameCard
              game={game}
              rating={ratings[game.id]}
              onRate={handleRate}
            />
          </div>

          {/* Навігація */}
          <div className={styles.cardNav}>
            <button
              className={styles.cardNavBtn}
              onClick={handlePrevCard}
              disabled={cardIndex === 0}
            >
              ← Назад
            </button>
            <button
              className={`${styles.cardNavBtn} ${styles.cardNavNext}`}
              onClick={handleNextCard}
            >
              {cardIndex < games.length - 1 ? 'Далі →' : 'Завершити ✓'}
            </button>
          </div>
        </div>

      </div>
    )
  }

  // ─── Grid mode ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Оціни ігри</h1>
          <p className={styles.subtitle}>
            Привіт, <strong>{nickname}</strong> — постав бал кожній грі від 1 до 10
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.modeToggleBtn} onClick={toggleMode}>
            ◻ По одній
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Зберігаємо...' : 'Готово →'}
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            rating={ratings[game.id]}
            onRate={handleRate}
          />
        ))}
      </div>
    </div>
  )
}
