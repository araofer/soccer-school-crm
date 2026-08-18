import { type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  icon: LucideIcon
  accent: string
}

export function MetricCard({ title, value, icon: Icon, accent }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5 text-slate-900" />
        </div>
      </div>
    </div>
  )
}
