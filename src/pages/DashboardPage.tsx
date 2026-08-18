import { useState } from 'react'
import { Activity, BookOpenText, ClipboardList, PlusCircle, Users } from 'lucide-react'
import type { Student, StudentNote } from '../types'
import { MetricCard } from '../components/MetricCard'
import { StudentTable } from '../components/StudentTable'

interface DashboardPageProps {
  students: Student[]
  notes: StudentNote[]
  onSelectStudent: (studentId: string, section?: 'profile' | 'notes') => void
  onAddStudent: (payload: Omit<Student, 'id'>) => Promise<void>
}

const emptyStudentForm: Omit<Student, 'id'> = {
  name: '',
  category: 'U8',
  status: 'Ativo',
  responsible: '',
  contact: '',
  team: '',
  attendance: '0%',
}

export function DashboardPage({ students, notes, onSelectStudent, onAddStudent }: DashboardPageProps) {
  const [form, setForm] = useState(emptyStudentForm)
  const [isSaving, setIsSaving] = useState(false)
  const activeStudents = students.filter((student) => student.status === 'Ativo').length
  const inactiveStudents = students.length - activeStudents

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await onAddStudent(form)
      setForm(emptyStudentForm)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total de alunos" value={String(students.length)} icon={Users} accent="bg-emerald-100" />
        <MetricCard title="Ativos" value={String(activeStudents)} icon={Activity} accent="bg-cyan-100" />
        <MetricCard title="Inativos" value={String(inactiveStudents)} icon={ClipboardList} accent="bg-rose-100" />
        <MetricCard title="Notas registradas" value={String(notes.length)} icon={BookOpenText} accent="bg-amber-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Cadastrar novo aluno</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do aluno" className="rounded-2xl border border-slate-200 px-3 py-2" />
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Categoria do aluno" className="rounded-2xl border border-slate-200 px-3 py-2" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Student['status'] })} className="rounded-2xl border border-slate-200 px-3 py-2">
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
            <input value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} placeholder="Responsável" className="rounded-2xl border border-slate-200 px-3 py-2" />
            <input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="Contato" className="rounded-2xl border border-slate-200 px-3 py-2" />
            <input value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} placeholder="Time" className="rounded-2xl border border-slate-200 px-3 py-2" />
            <input value={form.attendance} onChange={(event) => setForm({ ...form, attendance: event.target.value })} placeholder="Presença" className="rounded-2xl border border-slate-200 px-3 py-2" />

            <button type="submit" disabled={isSaving} className="rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-70">
              {isSaving ? 'Salvando...' : 'Salvar aluno'}
            </button>
          </form>
        </section>

        <StudentTable students={students} onSelect={onSelectStudent} />
      </div>
    </div>
  )
}
