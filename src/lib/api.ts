import type { AdminSettings, NoteDocument, NoteHistoryVersion, Professional, Student, StudentNote } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string>),
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || 'Erro na requisição')
  }

  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export const api = {
  login: (email: string, password: string) =>
    request<{ id: string; name: string; email: string; role: Professional['role'] }>(`/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfessionals: () => request<Professional[]>('/professionals'),

  getAdminSettings: () => request<AdminSettings>('/admin-settings'),

  updateAdminSettings: (payload: AdminSettings) =>
    request<AdminSettings>('/admin-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createProfessional: (payload: Omit<Professional, 'id'>) =>
    request<Professional>('/professionals', {
      method: 'POST',
      body: JSON.stringify({ ...payload, status: payload.status ?? 'Ativo' }),
    }),

  updateProfessional: (id: string, payload: Omit<Professional, 'id'>) =>
    request<Professional>(`/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, status: payload.status ?? 'Ativo' }),
    }),

  deleteProfessional: (id: string) =>
    request<{ ok: true; id: string }>(`/professionals/${id}`, {
      method: 'DELETE',
    }),

  getStudents: () => request<Student[]>('/students'),

  createStudent: (payload: Omit<Student, 'id'>) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStudent: (id: string, payload: Omit<Student, 'id'>) =>
    request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteStudent: (id: string) =>
    request<{ ok: true; id: string }>(`/students/${id}`, {
      method: 'DELETE',
    }),

  getNotes: (studentId: string) => request<StudentNote[]>(`/students/${studentId}/notes`),

  createNote: (
    studentId: string,
    payload: {
      authorId?: string
      authorRole: Professional['role']
      authorName: string
      title: string
      category: string
      content: string
      files?: File[]
    },
  ) => {
    const formData = new FormData()
    if (payload.authorId) formData.append('authorId', payload.authorId)
    formData.append('authorRole', payload.authorRole)
    formData.append('authorName', payload.authorName)
    formData.append('title', payload.title)
    formData.append('category', payload.category)
    formData.append('content', payload.content)

    if (payload.files && payload.files.length > 0) {
      for (const file of payload.files) {
        formData.append('files', file)
      }
    }

    return request<StudentNote>(`/students/${studentId}/notes`, {
      method: 'POST',
      body: formData,
    })
  },

  updateNote: (
    noteId: string,
    payload: { title: string; category?: string; content: string; authorName: string },
  ) =>
    request<StudentNote>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteNote: (noteId: string) =>
    request<{ ok: true; id: string }>(`/notes/${noteId}`, {
      method: 'DELETE',
    }),

  uploadNoteDocuments: (
    noteId: string,
    files: File[],
    uploadedById: string,
    uploadedByName: string,
  ) => {
    const formData = new FormData()
    formData.append('uploadedById', uploadedById)
    formData.append('uploadedByName', uploadedByName)
    for (const file of files) {
      formData.append('files', file)
    }

    return request<NoteDocument[]>(`/notes/${noteId}/documents`, {
      method: 'POST',
      body: formData,
    })
  },

  deleteDocument: (documentId: string) =>
    request<{ ok: true; id: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    }),

  getDownloadDocumentUrl: (documentId: string) => `${API_BASE}/documents/${documentId}/download`,

  getNoteHistory: (studentId: string) =>
    request<NoteHistoryVersion[]>(`/students/${studentId}/notes/history`),
}
