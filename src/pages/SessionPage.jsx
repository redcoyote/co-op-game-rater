import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, ensureSignedIn } from '../firebase'
import {
  sanitizeNickname,
  getOwnedNickname,
  setOwnedNickname,
} from '../lib/ownership'
import games from '../data/games.json'
import GameCard from '../components/GameCard'
import styles from './SessionPage.module.css'

export default function SessionPage() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Явний намір переоцінити, переданий з ResultsPage через navigate({ state }).
  // Якщо true — не відкидаємо назад на results навіть якщо scores вже існують,
  // а навпаки — підтягуємо їх як початкові значення слайдерів.
  const isReRate = location.state?.reRate === true

  const [nickname, setNickname] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  // nicknameSaved = чи підтвердив юзер ім'я в ЦІЙ сесії
  // завжди починаємо з false, щоб екран імені завжди показувався
  const [nicknameSaved, setNicknameSaved] = useState(false)
  // Помилка на екрані вводу імені (порожнє після санітизації / колізія).
  const [nicknameError, setNicknameError] = useState('')
  // Йде Firestore-перевірка колізії — блокуємо кнопку.
  const [checkingNickname, setCheckingNickname] = useState(false)

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
    // Дефолт 5 для всіх ігор — це свідомий продуктовий вибір, не баг.
    // Юзер прокручує грід, міняє тільки ті ігри, які для нього НЕ нейтральні
    // (висока оцінка для улюбленого або низька для нецікавого), і одразу
    // зберігає. Не торкнутий слайдер = "мені байдуже на цю гру = середнє 5".
    // Це різко скорочує час оцінювання 60+ ігор за рахунок мінімального
    // інформаційного шуму в результатах.
    const initial = {}
    games.forEach((g) => { initial[g.id] = 5 })
    setRatings(initial)
  }, [])

  useEffect(() => {
    if (!nickname) return
    const check = async () => {
      const ref = doc(db, 'sessions', sessionId, 'scores', nickname)
      const snap = await getDoc(ref)
      if (!snap.exists()) return

      if (isReRate) {
        // Юзер прийшов сюди свідомо через "Переоцінити" — підтягуємо
        // попередні оцінки як початкові значення, щоб не починати з нуля.
        const prev = snap.data()?.ratings
        if (prev) setRatings((curr) => ({ ...curr, ...prev }))
      } else {
        // Випадково відкрив лінк, а вже оцінював — показуємо результати.
        navigate(`/session/${sessionId}/results`)
      }
    }
    check()
  }, [nickname, sessionId, navigate, isReRate])

  async function handleNicknameSave() {
    const clean = sanitizeNickname(nicknameInput)
    if (!clean) {
      setNicknameError(
        'Ім\u02BCя має містити хоча б одну літеру або цифру'
      )
      return
    }

    setCheckingNickname(true)
    setNicknameError('')
    try {
      await ensureSignedIn()
      // Чи є вже такий запис у сесії?
      const ref = doc(db, 'sessions', sessionId, 'scores', clean)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        // Запис існує. Якщо це МІЙ попередній запис (я вже оцінював у цій
        // сесії з цього браузера) — все ок, проходимо далі. Якщо чужий —
        // показуємо помилку колізії.
        const ownedHere = getOwnedNickname(sessionId)
        if (ownedHere !== clean) {
          setNicknameError(
            'Учасник з таким ім\u02BCям уже є в цій сесії. Додай цифру або вибери інше.'
          )
          return
        }
      }

      localStorage.setItem('gr_nickname', clean)
      setNickname(clean)
      setNicknameInput(clean)
      setNicknameSaved(true)
    } catch (err) {
      console.error('Помилка перевірки імені:', err)
      setNicknameError('Не вдалося перевірити ім\u02BCя. Спробуй ще раз.')
    } finally {
      setCheckingNickname(false)
    }
  }

  // Скидаємо помилку при редагуванні поля.
  function handleNicknameChange(value) {
    setNicknameInput(value)
    if (nicknameError) setNicknameError('')
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
      await ensureSignedIn()
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
      // Позначаємо цей запис як "мій" у цьому браузері — щоб при поверненні
      // сесія не вважала його чужим і не кидала помилку колізії.
      setOwnedNickname(sessionId, nickname)
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
            onChange={(e) => handleNicknameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNicknameSave()}
            className={styles.nicknameInput}
            maxLength={30}
            autoFocus
          />
          {nicknameError && (
            <p className={styles.nicknameErr} role="alert">
              {nicknameError}
            </p>
          )}
          <button
            onClick={handleNicknameSave}
            disabled={!nicknameInput.trim() || checkingNickname}
            className={styles.nicknameBtn}
          >
            {checkingNickname ? 'Перевіряємо...' : 'Продовжити'}
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
