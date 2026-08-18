import { Activity, ClipboardList, Users } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { StudentTable } from '../components/StudentTable'
import type { Student } from '../types'

interface StudentsPageProps {
  students: Student[]
  onSelectStudent: (studentId: string, section?: 'profile' | 'notes') => void
}

export function StudentsPage({ students, onSelectStudent }: StudentsPageProps) {
  const activeStudents = students.filter((student) => student.status === 'Ativo').length
  const inactiveStudents = students.length - activeStudents

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total de alunos" value={String(students.length)} icon={Users} accent="bg-emerald-100" />
        <MetricCard title="Ativos" value={String(activeStudents)} icon={Activity} accent="bg-cyan-100" />
        <MetricCard title="Inativos" value={String(inactiveStudents)} icon={ClipboardList} accent="bg-rose-100" />
      </div>

      <StudentTable students={students} onSelect={onSelectStudent} />
    </div>
  )
}
