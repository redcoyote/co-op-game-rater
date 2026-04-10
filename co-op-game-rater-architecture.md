# Co-op Game Rater — Architecture & Logic

> Документ описує як влаштований проект зсередини. Достатньо щоб зрозуміти логіку або відтворити проект з нуля.

---

## Що це і навіщо

Веб-застосунок для асинхронного спільного оцінювання ігор. Двоє або більше людей незалежно ставлять бали кожній грі зі спільного списку — система усереднює і видає рейтинг. Вирішує проблему "яку гру проходимо разом?" без переписки і скрінів зі Steam.

---

## Стек

| Шар | Рішення | Чому |
|---|---|---|
| UI | React 18 + Vite | SPA, швидкий dev-сервер |
| Роутинг | React Router v6, **HashRouter** | GitHub Pages не підтримує server-side routing; `#/session/id` обробляється на клієнті |
| База даних | Firebase Firestore | Realtime, безсерверна, безкоштовний Spark план |
| Авторизація | Firebase Anonymous Auth | Не треба реєстрації — отримуємо токен автоматично |
| Ідентифікація | Нікнейм у `localStorage` | Простота; ключ `gr_nickname` |
| Дані ігор | Статичний `games.json` | Список не змінюється динамічно; імпортується як модуль |
| Стилі | CSS Modules | Скоупований CSS без конфліктів, без зайвих залежностей |
| Деплой | GitHub Pages + `gh-pages` | Безкоштовний хостинг статики |

---

## Структура файлів

```
src/
├── main.jsx              # Точка входу, монтує <App />
├── App.jsx               # HashRouter + маршрути
├── index.css             # Глобальні CSS-змінні і reset
├── firebase.js           # Ініціалізація Firebase, signInAnon()
├── data/
│   └── games.json        # Масив об'єктів ігор (62 штуки)
├── components/
│   ├── GameCard.jsx       # Картка гри — обкладинка, теги, слайдер, бали
│   └── GameCard.module.css
└── pages/
    ├── HomePage.jsx       # Грід всіх ігор + кнопка "Почати"
    ├── HomePage.module.css
    ├── SessionPage.jsx    # Оцінювання (card mode / grid mode)
    ├── SessionPage.module.css
    ├── ResultsPage.jsx    # Результати сесії з медалями
    └── ResultsPage.module.css
```

---

## Маршрути

```
/                        → HomePage
/session/:id             → SessionPage
/session/:id/results     → ResultsPage
*                        → redirect /
```

`HashRouter` генерує URL вигляду `https://redcoyote.github.io/co-op-game-rater/#/session/abc-123`. Хеш (`#`) дозволяє GitHub Pages завжди віддавати `index.html`, а React Router обробляє маршрут на клієнті.

---

## Модель даних

### games.json

```json
{
  "id": "game_001",
  "title": "Hades",
  "description": "...",
  "genre": ["Action", "Roguelike"],
  "platform": ["Windows", "Mac"],
  "wayToPlay": "Online co-op",
  "coverUrl": "https://...",
  "steamUrl": "https://store.steampowered.com/...",
  "xboxConsoleUrl": null,
  "xboxPcUrl": null,
  "gamePass": null,
  "price": "$24.99",
  "gameplayYtId": "abc123",
  "releaseYear": 2020,
  "metacritic": 93,
  "steamScore": 97
}
```

### Firestore

```
sessions/
  {sessionId}/                      ← doc, createdAt + gameListId
    scores/
      {nickname}/                   ← doc на кожного учасника
        displayName: "Serhii"
        completedAt: timestamp
        ratings: {
          "game_001": 8,
          "game_002": 6,
          ...
        }
```

`sessionId` — `uuidv4()`, генерується на клієнті при натисканні "Почати оцінювання". Сесія в Firestore створюється тільки коли перший учасник зберігає оцінки.

---

## Логіка по сторінках

### HomePage

1. Відображає грід всіх ігор з `games.json` (тільки для перегляду, без слайдера).
2. Кнопка "Почати оцінювання" — генерує `uuidv4()` і робить `navigate('/session/{id}')`.
3. У Firestore нічого не пишеться — сесія існує тільки як URL.

```js
function handleStart() {
  const sessionId = uuidv4()
  navigate(`/session/${sessionId}`)
}
```

---

### SessionPage

**Стейт:**
```
nickname        — підтверджений нікнейм (після екрану введення)
nicknameInput   — що юзер вводить у полі
nicknameSaved   — чи пройшов екран нікнейму в цій сесії
ratings         — { game_id: number } поточні оцінки
mode            — 'card' | 'grid'
cardIndex       — поточна картка в card mode
saving / done   — стан збереження
```

**Флоу:**

```
Відкриття /session/:id
  ↓
useEffect: підставити збережений нікнейм у поле input
useEffect: ініціалізувати ratings (всі = 5)
  ↓
Екран нікнейму (nicknameSaved = false)
  ↓ handleNicknameSave()
  ├─ зберегти в localStorage('gr_nickname')
  ├─ setNickname(trimmed)
  └─ setNicknameSaved(true)
  ↓
useEffect [nickname]: перевірити чи вже є scores/{nickname} в Firestore
  ├─ є → navigate('/session/:id/results')   ← повернення після оцінювання
  └─ нема → показати режим оцінювання
  ↓
Card mode (по одній) або Grid mode (всі одразу)
  ↓ handleSubmit()
  ├─ signInAnon()                           ← анонімний Firebase токен
  ├─ getDoc(sessions/:id) → якщо нема, setDoc (createdAt, gameListId)
  ├─ setDoc(sessions/:id/scores/:nickname, { displayName, completedAt, ratings })
  ├─ setDone(true)
  └─ setTimeout → navigate('/session/:id/results')
```

**Card mode vs Grid mode:**
- Card mode — одна картка зі слайдером, кнопки ← / →, прогрес-бар зверху.
- Grid mode — всі картки одразу, слайдер на кожній.
- Перемикач у хедері. Після завершення card mode — екран підтвердження → grid для фінального огляду.

---

### ResultsPage

**Флоу:**

```
useEffect: getDocs(sessions/:id/scores/*)
  ↓
allScores = [{ nickname, ratings: {...} }, ...]
  ↓
averaged = games.map(game => {
  vals = allScores.map(s => s.ratings[game.id]).filter(not null)
  avg  = sum(vals) / vals.length
  return { game, avg, ratingsMap }
})
  ↓
averaged.sort(b.avg - a.avg)   ← desc, null в кінець
  ↓
Рендер: грід карток з медалями (🥇🥈🥉 для top-3)
Під кожною карткою — пілюлі з оцінками учасників
Своя оцінка підсвічена (порівняння з localStorage('gr_nickname'))
```

**Середній бал рахується на фронті** — Firestore зберігає тільки сирі об'єкти `ratings`.

---

### GameCard

Компонент отримує три пропи:
- `game` — об'єкт гри
- `rating` — число або null
- `onRate` — функція або undefined

Поведінка залежить від пропів:
```
onRate передано   → показати слайдер (режим оцінювання)
rating без onRate → показати "Середній бал X.X" (режим результатів)
нічого            → тільки інформація про гру (HomePage)
```

При hover — обкладинка замінюється на YouTube iframe з геймплеєм (`gameplayYtId`), старт з 60 секунди, muted autoplay.

---

## Firebase: що і коли

| Операція | Де | Коли |
|---|---|---|
| `signInAnonymously` | `SessionPage.handleSubmit` | Перед першим записом |
| `getDoc(sessions/:id)` | `SessionPage.handleSubmit` | Перевірити чи сесія існує |
| `setDoc(sessions/:id)` | `SessionPage.handleSubmit` | Якщо сесія нова |
| `setDoc(sessions/:id/scores/:nick)` | `SessionPage.handleSubmit` | Зберегти оцінки |
| `getDoc(sessions/:id/scores/:nick)` | `SessionPage useEffect` | Перевірити чи вже оцінював |
| `getDocs(sessions/:id/scores/*)` | `ResultsPage useEffect` | Завантажити всі оцінки |

---

## Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
      match /scores/{nickname} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}
```

Anonymous Auth дає токен → `request.auth != null` = true. Без цього — відмова у доступі після закінчення test mode (30 днів).

---

## Деплой

```
npm run deploy
  = vite build && gh-pages -d dist
```

1. Vite збирає `dist/` з `base: '/co-op-game-rater/'`
2. `gh-pages` пушить `dist/` у гілку `gh-pages`
3. GitHub Pages роздає з цієї гілки

При кожному оновленні — просто `npm run deploy`.

---

## Відомі обмеження (задокументовано в PRD)

- Два учасники з однаковим нікнеймом перезапишуть оцінки один одного
- Список ігор змінюється тільки через редагування `games.json` — UI для цього немає
- Немає нотифікацій коли всі учасники завершили оцінювання
