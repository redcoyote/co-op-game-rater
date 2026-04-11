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
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-label="Xbox">
      <path d="M4.102 4.102C6.035 2.169 8.442 1 12 1s5.965 1.169 7.898 3.102C21.831 6.035 23 8.442 23 12s-1.169 5.965-3.102 7.898C17.965 21.831 15.558 23 12 23s-5.965-1.169-7.898-3.102C2.169 17.965 1 15.558 1 12S2.169 6.035 4.102 4.102zM12 3c-1.79 0-3.337.596-4.896 1.69C8.516 6.197 10.197 7.98 12 10.12c1.803-2.14 3.484-3.923 4.896-5.43C15.337 3.596 13.79 3 12 3zm7.416 3.416C18.322 7.824 16.646 9.74 14.82 12c1.826 2.26 3.502 4.176 4.596 5.584C20.404 16.176 21 14.629 21 12c0-2.01-.584-3.684-1.584-5.584zM4.584 6.416C3.584 8.316 3 9.99 3 12c0 2.629.596 4.176 1.584 5.584C5.678 16.176 7.354 14.26 9.18 12 7.354 9.74 5.678 7.824 4.584 6.416zM12 13.88c-1.803 2.14-3.484 3.923-4.896 5.43C8.663 20.404 10.21 21 12 21s3.337-.596 4.896-1.69C15.484 17.803 13.803 16.02 12 13.88z"/>
    </svg>
  ),
}

// ── Extract YouTube embed URL starting from ~middle ───────────────────────────
function getEmbedUrl(ytId) {
  if (!ytId) return null
  // Start at 60s — reasonable midpoint for most gameplay trailers
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&start=60&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`
}

// ── GameCard ──────────────────────────────────────────────────────────────────
export default function GameCard({ game, rating, onRate }) {
  const [hovered, setHovered] = useState(false)
  const embedUrl = getEmbedUrl(game.gameplayYtId)

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
            allowFullScreen
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

        {/* Tags row: genre + wayToPlay + gamePass */}
        <div className={styles.tags}>
          {game.genre.map((g) => (
            <span key={g} className={styles.tagGenre}>{g}</span>
          ))}
          {game.wayToPlay && (
            <span className={styles.tagCross}>{game.wayToPlay}</span>
          )}
          {game.gamePass && (
            <span className={styles.tagGamePass}>GP: {game.gamePass}</span>
          )}
        </div>

        {/* Platform icons */}
        {game.platform?.length > 0 && (
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
        )}

        {/* Description */}
        <p className={styles.description}>{game.description}</p>

        {/* Scores */}
        <div className={styles.scores}>
          {game.metacritic != null && (
            <span className={`${styles.score} ${styles.metacritic}`} title="Metacritic">
              MC {game.metacritic}
            </span>
          )}
          {game.steamScore != null && (
            <span className={`${styles.score} ${styles.steam}`} title="Steam score">
              Steam {game.steamScore}%
            </span>
          )}
        </div>

        {/* Store links + Price */}
        <div className={styles.storeRow}>
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
          {game.price && (
            <span className={styles.price}>{game.price}</span>
          )}
        </div>

        {/* Rating slider — тільки на сторінці оцінювання */}
        {onRate && (
          <div className={styles.ratingRow}>
            <input
              type="range"
              min={1}
              max={10}
              value={rating ?? 5}
              onChange={(e) => onRate(game.id, Number(e.target.value))}
              className={styles.slider}
              aria-label={`Оцінка для ${game.title}`}
              aria-valuetext={rating != null ? `${rating} з 10` : 'не оцінено'}
            />
            <span className={styles.ratingValue}>
              {rating != null ? rating : '—'}
            </span>
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
