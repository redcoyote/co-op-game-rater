import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import ResultsPage from './pages/ResultsPage'

// HashRouter використовується замість BrowserRouter тому що
// GitHub Pages не підтримує server-side routing.
// HashRouter генерує URL виду: /#/session/abc123
// і всі маршрути обробляються на стороні клієнта.

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Головна — список ігор */}
        <Route path="/" element={<HomePage />} />

        {/* Сторінка оцінювання конкретної сесії */}
        <Route path="/session/:id" element={<SessionPage />} />

        {/* Результати сесії */}
        <Route path="/session/:id/results" element={<ResultsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
