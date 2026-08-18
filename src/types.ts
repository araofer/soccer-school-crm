export type Role = 'admin' | 'psychologist' | 'nutritionist' | 'pedagogue' | 'coach' | 'manager'

export type NoteCategory = 'Psicológica' | 'Nutricional' | 'Pedagógica' | 'Física/Treino' | 'Médico/Saúde' | 'Geral'

export interface Professional {
  id: string
  name: string
  email: string
  password: string
  role: Role
  specialty: string
  status?: 'Ativo' | 'Inativo'
}

export interface Student {
  id: string
  name: string
  category: string
  status: 'Ativo' | 'Inativo'
  responsible: string
  contact: string
  team: string
  attendance: string
}

export interface NoteDocument {
  id: string
  noteId: string
  studentId: string
  uploadedById: string
  uploadedByName: string
  originalName: string
  storedName: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
}

export interface StudentNote {
  id: string
  studentId: string
  authorId?: string
  authorRole: Role
  authorName: string
  title: string
  category: NoteCategory | string
  content: string
  date: string
  createdAt?: string
  updatedAt?: string
  documents?: NoteDocument[]
}

export interface NoteHistoryVersion {
  id: string
  note_id: string
  title: string
  content: string
  author_name: string
  created_at: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface AdminSettings {
  schoolName: string
  cnpj: string
  contactEmail: string
  phone: string
  address: string
  activeCategories: string[]
  themeMode: 'light' | 'dark'
  primaryColor: string
}
