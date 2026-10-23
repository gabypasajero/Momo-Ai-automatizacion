export default function Loading() {
  return (
    <div className="space-y-4" aria-busy aria-label="Cargando">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-line/70" />
      <div className="h-32 animate-pulse rounded-3xl bg-line/60" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-3xl bg-line/50" />
        <div className="h-56 animate-pulse rounded-3xl bg-line/50" />
      </div>
    </div>
  )
}
