import { useState, useSyncExternalStore, type ReactNode } from 'react'
const query = '(max-width: 760px)'
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const compactSnapshot = () => window.matchMedia(query).matches
export default function ResponsiveDisclosure({
  title,
  children,
  className = '',
  initialOpen = false
}: {
  title: ReactNode
  children: ReactNode
  className?: string
  initialOpen?: boolean
}) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, () => false)
  const [expanded, setExpanded] = useState(initialOpen)
  return (
    <details
      className={`buyer-responsive-disclosure ${className}`}
      open={!compact || expanded}
      onToggle={(event) => {
        if (compact) setExpanded(event.currentTarget.open)
      }}
    >
      <summary>{title}</summary>
      {children}
    </details>
  )
}
