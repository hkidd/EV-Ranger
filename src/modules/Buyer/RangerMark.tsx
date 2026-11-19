export default function RangerMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path d="M24 3 13 23h7v7h8v-7h7L24 3Z" fill="currentColor" />
      <path
        d="m9 17-8 15h5v6h6v-6h5L9 17Zm30 0-8 15h5v6h6v-6h5L39 17Z"
        fill="currentColor"
      />
      <path
        d="M23 34c-9 2-9 6-1 7 8 1 9 3 1 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
