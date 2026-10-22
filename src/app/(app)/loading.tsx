export default function Loading() {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-busy>
      {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/60" />)}
    </div>
  )
}
