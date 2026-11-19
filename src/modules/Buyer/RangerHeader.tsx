import { Link } from 'react-router-dom'
import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'
import RangerMark from './RangerMark'

export default function RangerHeader({
  count = 0,
  onCars
}: {
  count?: number
  onCars?: () => void
}) {
  const { isDarkMode, toggleTheme } = useTheme()
  return (
    <header className="buyer-header">
      <Link to="/compare" className="buyer-brand" aria-label="EV Ranger home">
        <RangerMark className="buyer-brand-symbol" />
        <span className="buyer-wordmark">
          EV Ranger<small>Know how far you’ll go.</small>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {onCars ? (
          <button onClick={onCars}>
            Cars <span>{count}</span>
          </button>
        ) : (
          <Link className="buyer-back-to-compare" to="/compare">
            Compare cars
          </Link>
        )}
        {onCars && <Link to="/about">How it works</Link>}
        <button
          className="buyer-theme-toggle"
          onClick={toggleTheme}
          aria-label={
            isDarkMode ? 'Switch to day view' : 'Switch to night view'
          }
          title={isDarkMode ? 'Day view' : 'Night view'}
        >
          {isDarkMode ? (
            <FiSun aria-hidden="true" />
          ) : (
            <FiMoon aria-hidden="true" />
          )}
        </button>
      </nav>
    </header>
  )
}
