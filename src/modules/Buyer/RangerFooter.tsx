import { Link } from 'react-router-dom'
export default function RangerFooter({ onGuide }: { onGuide?: () => void }) {
  return (
    <footer className="buyer-footer">
      <span>© {new Date().getFullYear()} EV Ranger</span>
      <Link to="/about">How EV Ranger works</Link>
      {onGuide && (
        <button className="buyer-text-button" onClick={onGuide}>
          Replay guide
        </button>
      )}
    </footer>
  )
}
