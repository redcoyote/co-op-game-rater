import { useState } from 'react'
import styles from './GameCard.module.css'

// ── Platform SVG icons ────────────────────────────────────────────────────────
const PlatformIcons = {
  Windows: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-label="Windows">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
    </svg>
  ),
  Mac: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-label="Mac">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  ),
  Xbox: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-label="Xbox">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 13.8c-.5.36-1.9-.9-4.5-3.8-2.6 2.9-4 4.16-4.5 3.8-.6-.48-.3-3.5 2.2-6.6C8.2 7.6 6.9 6.5 6.2 6.4c1.1-1.4 3.8-.7 5.8 2.1 2-2.8 4.7-3.5 5.8-2.1-.7.1-2 1.2-3.5 2.8 2.5 3.1 2.8 6.12 2.2 6.6z"/>
    </svg>
  ),
}

// ── Extract YouTube embed URL starting from ~middle ───────────────────────────
function getEmbedUrl(ytId, startAt = 600) {
  if (!ytId) return null
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&start=${startAt}&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`
}

// ── GameCard ──────────────────────────────────────────────────────────────────
export default function GameCard({ game, rating, onRate }) {
  const [hovered, setHovered] = useState(false)
  const embedUrl = getEmbedUrl(game.gameplayYtId, game.startAt)


  return (
    <div
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover / Video */}
      <div className={styles.cover}>
        {hovered && embedUrl ? (
          <iframe
            src={embedUrl}
            className={styles.videoFrame}
            allow="autoplay; encrypted-media"
            title={game.title}
          />
        ) : (
          <img
            src={game.coverUrl}
            alt={game.title}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://placehold.co/460x215/1a1a24/888899?text=No+Cover'
            }}
          />
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* Title + Year */}
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{game.title}</h3>
          {game.releaseYear && (
            <span className={styles.year}>{game.releaseYear}</span>
          )}
        </div>

        {/* Scores */}
        <div className={styles.scores}>
          {game.metacritic != null && (
            <span className={`${styles.score} ${styles.metacritic}`} title="Metacritic">
              Metacritic {game.metacritic}
            </span>
          )}
          {game.steamScore != null && (
            <span className={`${styles.score} ${styles.steam}`} title="Steam score">
              Steam {game.steamScore}%
            </span>
          )}
        </div>

        {/* Genre */}
        <div className={styles.tags}>
          {game.genre.map((g) => (
            <span key={g} className={styles.tagGenre}>{g}</span>
          ))}
        </div>

        {/* Description */}
        <p className={styles.description}>{game.description}</p>

        {/* Footer — притиснутий до низу адаптивно */}
        <div className={styles.footer}>

          {/* Platform icons */}
          {game.platform?.length > 0 && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Девайси:</span>
              <div className={styles.platforms}>
                {game.platform.map((p) =>
                  PlatformIcons[p] ? (
                    <span key={p} className={styles.platformIcon} title={p}>
                      {PlatformIcons[p]}
                    </span>
                  ) : (
                    <span key={p} className={styles.platformText}>{p}</span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Way to play (crossplay type) */}
          {game.wayToPlay && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Як грати разом:</span>
              <span className={styles.tagCross}>{game.wayToPlay}</span>
            </div>
          )}

          {/* Store links */}
          <div className={styles.row}>
            <span className={styles.rowLabel}>Магазин:</span>
            <div className={styles.storeLinks}>
              {game.steamUrl && (
                <a href={game.steamUrl} target="_blank" rel="noreferrer" className={styles.storeLink}>
                  Steam
                </a>
              )}
              {game.xboxConsoleUrl && (
                <a href={game.xboxConsoleUrl} target="_blank" rel="noreferrer" className={styles.storeLink}>
                  Xbox
                </a>
              )}
              {game.xboxPcUrl && (
                <a href={game.xboxPcUrl} target="_blank" rel="noreferrer" className={styles.storeLink}>
                  Xbox PC
                </a>
              )}
              {game.otherUrl && (
                <a href={game.otherUrl} target="_blank" rel="noreferrer" className={styles.storeLink}>
                  Store
                </a>
              )}
            </div>
          </div>

          {/* Price + Game Pass */}
          {game.price && (
            <div className={styles.priceBlock}>
              <span className={styles.price}>{game.price}</span>
              {game.gamePass && (
                <span className={styles.gamePassNote}>(є в Game Pass: {game.gamePass})</span>
              )}
            </div>
          )}
          {game.price && (
            <span className={styles.priceNote}>*Орієнтовна ціна без знижок. Перевіряйте знижки та наявність у підписці</span>
          )}

        </div>

        {/* Rating buttons — тільки на сторінці оцінювання */}
        {onRate && (
          <div className={styles.ratingRow}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button
                key={n}
                className={`${styles.ratingBtn} ${(rating ?? 5) === n ? styles.ratingBtnActive : ''}`}
                onClick={() => onRate(game.id, n)}
                aria-label={`Оцінка ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Середній бал — тільки на сторінці результатів */}
        {rating != null && !onRate && (
          <div className={styles.avgScore}>
            <span className={styles.avgLabel}>Середній бал</span>
            <span className={styles.avgValue}>{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
