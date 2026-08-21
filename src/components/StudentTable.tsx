import { useMemo, useState } from 'react'
import { FileText, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import type { Student } from '../types'

interface StudentTableProps {
  students: Student[]
  onSelect: (studentId: string, section?: 'profile' | 'notes') => void
}

export function StudentTable({ students, onSelect }: StudentTableProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [status, setStatus] = useState('Todos')
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name')
  const categories = useMemo(() => ['Todos', ...new Set(students.map((student) => student.category))], [students])

  const filteredStudents = useMemo(() => {
    const nextStudents = students.filter((student) => {
      const matchesQuery = [student.name, student.responsible, student.team]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())

      const matchesCategory = category === 'Todos' || student.category === category
      const matchesStatus = status === 'Todos' || student.status === status

      return matchesQuery && matchesCategory && matchesStatus
    })

    return nextStudents.sort((a, b) => {
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      }

      return a.name.localeCompare(b.name)
    })
  }, [category, query, sortBy, status, students])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Alunos</h2>
          <p className="text-sm text-slate-500">Busca, ordenação e acesso rápido a perfis e anotações.</p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar aluno..."
              className="w-full bg-transparent outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="bg-transparent outline-none">
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none">
            <option>Todos</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>

          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'name' | 'category')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none">
            <option value="name">Ordenar por nome</option>
            <option value="category">Ordenar por categoria</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-50/80"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{student.category}</p>
                  <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    student.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {student.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                <p>
                  <strong className="font-semibold text-slate-700">Responsável:</strong> {student.responsible}
                </p>
                <p>
                  <strong className="font-semibold text-slate-700">Contato:</strong> {student.contact}
                </p>
                <p>
                  <strong className="font-semibold text-slate-700">Time:</strong> {student.team}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-slate-200/70 pt-3">
  <button
    type="button"
    onClick={() => onSelect(student.id, 'profile')}
    className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-emerald-700"
  >
    <UserRound className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
    Ver perfil
  </button>

  <button
    type="button"
    onClick={() => onSelect(student.id, 'notes')}
    className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
  >
    <FileText className="h-3.5 w-3.5 shrink-0" />
    Anotações
  </button>
</div>
          </div>
        ))}
      </div>
    </div>
  )
}
