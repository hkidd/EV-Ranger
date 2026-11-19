import { FiSearch, FiX } from 'react-icons/fi'
import { useEffect, useId, useRef, useState } from 'react'
import { findPlaces } from './buyerApi'
import type { Place, Coordinate } from './types'
interface Props {
  label: string
  placeholder: string
  value: Place | null
  onChange: (place: Place | null) => void
  proximity?: Coordinate
}
export default function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  proximity
}: Props) {
  const id = useId(),
    [text, setText] = useState(value?.label ?? ''),
    [results, setResults] = useState<Place[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [active, setActive] = useState(-1),
    [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const displayedText = value?.label ?? text
  useEffect(() => {
    if (displayedText.trim().length < 2 || value) return
    const controller = new AbortController()
    let deadline: ReturnType<typeof setTimeout>
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      deadline = setTimeout(() => {
        controller.abort()
        setLoading(false)
        setError(
          'Location search timed out. Check that the API is running, then try again.'
        )
      }, 20000)
      findPlaces(displayedText.trim(), controller.signal, proximity)
        .then((places) => {
          if (controller.signal.aborted) return
          setResults(places)
          setActive(-1)
          setOpen(true)
          if (!places.length)
            setError(
              'No locations found. Try a town, ZIP code, or street address.'
            )
        })
        .catch((reason) => {
          if (!controller.signal.aborted)
            setError(
              reason instanceof Error
                ? reason.message
                : 'Location search failed.'
            )
        })
        .finally(() => {
          clearTimeout(deadline)
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 500)
    return () => {
      clearTimeout(timer)
      clearTimeout(deadline)
      controller.abort()
    }
  }, [displayedText, value, proximity])
  const choose = (place: Place) => {
    onChange(place)
    setText(place.label)
    setResults([])
    setOpen(false)
    setError('')
  }
  return (
    <div
      className="buyer-place"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="buyer-place-field">
        <FiSearch className="buyer-search-icon" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!value && open && results.length > 0}
          aria-controls={`${id}-results`}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          placeholder={placeholder}
          value={displayedText}
          onChange={(event) => {
            setLoading(false)
            setText(event.target.value)
            setResults([])
            setActive(-1)
            setError('')
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (!open || !results.length) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((previous) => (previous + 1) % results.length)
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive(
                (previous) => (previous - 1 + results.length) % results.length
              )
            }
            if (event.key === 'Enter' && active >= 0) {
              event.preventDefault()
              choose(results[active])
            }
          }}
        />
        {loading && !value ? (
          <span className="buyer-spinner" aria-label="Searching" />
        ) : value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange(null)
              setText('')
              setResults([])
            }}
          >
            <FiX aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {!value && open && results.length > 0 && (
        <ul id={`${id}-results`} role="listbox">
          {results.map((place, index) => (
            <li
              key={place.id}
              id={`${id}-${index}`}
              role="option"
              aria-selected={active === index}
            >
              <button
                type="button"
                className={active === index ? 'active' : ''}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(place)}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && !value && (
        <p className="buyer-inline-error" role="status">
          {error}
        </p>
      )}
    </div>
  )
}
