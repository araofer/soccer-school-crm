import type { Role } from '../types'

export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  psychologist: 'Psicólogo',
  nutritionist: 'Nutricionista',
  pedagogue: 'Pedagogo',
  coach: 'Treinador',
  manager: 'Gestor',
}

export const routeAccess: Record<Role, string[]> = {
  admin: ['/dashboard', '/students', '/students/:id', '/professionals', '/admin-console'],
  psychologist: ['/dashboard', '/students', '/students/:id'],
  nutritionist: ['/dashboard', '/students', '/students/:id'],
  pedagogue: ['/dashboard', '/students', '/students/:id'],
  coach: ['/dashboard', '/students', '/students/:id'],
  manager: ['/dashboard', '/students', '/students/:id', '/professionals'],
}

export const navigationByRole: Record<Role, Array<{ label: string; href: string }>> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
    { label: 'Profissionais', href: '/professionals' },
    { label: 'Configurações', href: '/admin-console' },
  ],
  psychologist: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
  ],
  nutritionist: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
  ],
  pedagogue: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
  ],
  coach: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
  ],
  manager: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Alunos', href: '/students' },
    { label: 'Profissionais', href: '/professionals' },
  ],
}


export const canAccessRoute = (role: Role, path: string) => {
  const allowed = routeAccess[role]

  return allowed.some((route) => {
    if (route === path) return true
    if (route.includes(':id') && path.startsWith(route.replace(':id', ''))) return true
    return false
  })
}
