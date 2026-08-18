import { useState } from 'react'
import { Apple, Brain, Briefcase, GraduationCap, Pencil, PlusCircle, ShieldCheck, Trash2, Trophy } from 'lucide-react'

import type { Professional, Role } from '../types'
import { roleLabels } from '../lib/rbac'
import { useAuth } from '../context/AuthContext'

interface ProfessionalsPageProps {
  professionals: Professional[]
  onAddProfessional: (professional: Omit<Professional, 'id'>) => Promise<void>
  onUpdateProfessional: (professionalId: string, payload: Omit<Professional, 'id'>) => Promise<void>
  onDeleteProfessional: (professionalId: string) => Promise<void>
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  specialty: '',
  role: 'psychologist' as Role,
}

const roleConfig: Record<
  Role,
  {
    label: string
    badgeClass: string
    avatarBg: string
    icon: typeof ShieldCheck
  }
> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm ring-2 ring-emerald-500/20',
    icon: ShieldCheck,
  },
  psychologist: {
    label: 'Psicólogo(a)',
    badgeClass: 'bg-violet-100 text-violet-800 border border-violet-300',
    avatarBg: 'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-sm ring-2 ring-violet-500/20',
    icon: Brain,
  },
  nutritionist: {
    label: 'Nutricionista',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm ring-2 ring-amber-500/20',
    icon: Apple,
  },
  pedagogue: {
    label: 'Pedagogo(a)',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-300',
    avatarBg: 'bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-sm ring-2 ring-sky-500/20',
    icon: GraduationCap,
  },
  coach: {
    label: 'Treinador',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300',
    avatarBg: 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm ring-2 ring-orange-500/20',
    icon: Trophy,
  },
  manager: {
    label: 'Gestor',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    avatarBg: 'bg-gradient-to-br from-indigo-500 to-blue-800 text-white shadow-sm ring-2 ring-indigo-500/20',
    icon: Briefcase,
  },
}


const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SC'

export function ProfessionalsPage({ professionals, onAddProfessional, onUpdateProfessional, onDeleteProfessional }: ProfessionalsPageProps) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (editingId) {
      await onUpdateProfessional(editingId, form)
      setEditingId(null)
    } else {
      await onAddProfessional(form)
    }

    setForm(emptyForm)
  }

  const handleEdit = (professional: Professional) => {
    setEditingId(professional.id)
    setForm({
      name: professional.name,
      email: professional.email,
      password: professional.password,
      specialty: professional.specialty,
      role: professional.role,
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar profissional' : 'Cadastrar novo profissional'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome" className="w-full rounded-2xl border border-slate-200 px-3 py-2" />
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="E-mail" className="w-full rounded-2xl border border-slate-200 px-3 py-2" />
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Senha" className="w-full rounded-2xl border border-slate-200 px-3 py-2" />
          <input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} placeholder="Especialidade / Cargo" className="w-full rounded-2xl border border-slate-200 px-3 py-2" />
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="w-full rounded-2xl border border-slate-200 px-3 py-2">
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white">{editingId ? 'Salvar alterações' : 'Salvar profissional'}</button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Lista de profissionais</h2>
        <div className="space-y-3">
          {professionals.map((professional) => {
            const isCurrentUser = user?.id === professional.id
            const config = roleConfig[professional.role] || roleConfig.psychologist
            const RoleIcon = config.icon

            return (
              <div key={professional.id} className={`flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 transition ${isCurrentUser ? 'bg-emerald-50/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${config.avatarBg}`}>
                    {getInitials(professional.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{professional.name}</p>
                      {isCurrentUser && (
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{professional.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}>
                    <RoleIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                  <button type="button" onClick={() => handleEdit(professional)} className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={isCurrentUser ? 'Você não pode excluir sua própria conta de Administrador' : 'Excluir acesso'}
                    onClick={() => onDeleteProfessional(professional.id)}
                    disabled={isCurrentUser}
                    className="rounded-xl bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
