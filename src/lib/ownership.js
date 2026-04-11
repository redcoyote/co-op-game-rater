// Трекаємо, якими score-документами володіє юзер у цьому браузері.
// Формат у localStorage: { [sessionId]: "nickname", ... }
//
// Навіщо: у Firestore немає "власника" документа (ми свідомо не робимо
// auth.uid-based прив'язку — це інструмент для друзів, не SaaS).
// Але нам треба знати, чи запис {nickname} у сесії {id} — це мій попередній
// запис (тоді re-entry ок) чи чийсь (тоді колізія імен, треба попередити).

const KEY = 'gr_owned_scores'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function write(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // localStorage може бути недоступний (приват, квота) — не валимо аппку.
  }
}

export function getOwnedNickname(sessionId) {
  return read()[sessionId] ?? null
}

export function setOwnedNickname(sessionId, nickname) {
  const map = read()
  map[sessionId] = nickname
  write(map)
}

export function clearOwnedNickname(sessionId) {
  const map = read()
  delete map[sessionId]
  write(map)
}

// Санітизація нікнейму для використання як Firestore document ID.
// Дозволяємо: букви (включно з кирилицею), цифри, пробіл, _, -
// Все інше викидаємо. Схлопуємо множинні пробіли. Обрізаємо з країв.
// Обмежуємо 30 символами.
export function sanitizeNickname(raw) {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30)
}
