import { notFound } from 'next/navigation'
import { ComingSoon } from '@/components/layout/ComingSoon'
import { MODULES } from '@/config/navigation'

/** Módulos del roadmap (Servicio, Ecommerce, Workflows, Agenda, Más). */
const ROADMAP = MODULES.filter((m) => m.ready === false)

export function generateStaticParams() {
  return ROADMAP.map((m) => ({ module: m.href.slice(1) }))
}

export const dynamicParams = false

export default async function RoadmapModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params
  const nav = ROADMAP.find((m) => m.href === `/${slug}`)
  if (!nav) notFound()
  return <ComingSoon icon={nav.icon} title={nav.label} description={`Aquí vivirán las funciones de ${nav.label.toLowerCase()} conectadas al backend.`} />
}
