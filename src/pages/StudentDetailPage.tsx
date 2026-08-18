import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  Paperclip,
  Pencil,
  Plus,
  Tag,
  Trash2,
  UploadCloud,
  User,
  UserRound,
  X,
} from 'lucide-react'
import type { NoteDocument, NoteHistoryVersion, Role, Student, StudentNote } from '../types'
import { api } from '../lib/api'
import { ConfirmModal } from '../components/ConfirmModal'

interface StudentDetailPageProps {
  student: Student | undefined
  notes: StudentNote[]
  userRole: Role
  currentUserId?: string
  currentUserName?: string
  onAddNote: (payload: {
    studentId: string
    authorId?: string
    authorRole: Role
    authorName: string
    title: string
    category: string
    content: string
    files?: File[]
  }) => Promise<void>
  onUpdateNote: (
    noteId: string,
    payload: { title: string; category?: string; content: string; authorName: string },
  ) => Promise<void>
  onDeleteNote: (noteId: string) => Promise<void>
  onDeleteDocument: (docId: string) => Promise<void>
  onUpdateStudent: (studentId: string, payload: Omit<Student, 'id'>) => Promise<void>
  onDeleteStudent: (studentId: string) => Promise<void>
}

const roleLabel: Record<Role, string> = {
  admin: 'Administrador',
  psychologist: 'Psicólogo',
  nutritionist: 'Nutricionista',
  pedagogue: 'Pedagogo',
  coach: 'Treinador',
  manager: 'Gestor',
}

const NOTE_CATEGORIES = [
  'Geral',
  'Psicológica',
  'Nutricional',
  'Pedagógica',
  'Física/Treino',
  'Médico/Saúde',
]

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (mimeType.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return <ImageIcon className="h-4 w-4 text-emerald-500" />
  }
  if (mimeType.includes('pdf') || ext === 'pdf') {
    return <FileText className="h-4 w-4 text-rose-500" />
  }
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="h-4 w-4 text-cyan-500" />
  }
  return <FileCode className="h-4 w-4 text-slate-500" />
}

export function StudentDetailPage({
  student,
  notes,
  userRole,
  currentUserId,
  currentUserName,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onDeleteDocument,
  onUpdateStudent,
  onDeleteStudent,
}: StudentDetailPageProps) {
  const location = useLocation()
  const notesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'notes'>('profile')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas')

  // New note form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Geral')
  const [content, setContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  // Edit note state
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('Geral')
  const [editContent, setEditContent] = useState('')

  // History & Student form state
  const [history, setHistory] = useState<NoteHistoryVersion[]>([])
  const [draftStudent, setDraftStudent] = useState<Student | undefined>(student)

  // Deletion modals state
  const [docToDelete, setDocToDelete] = useState<NoteDocument | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<StudentNote | null>(null)
  const [isDeletingStudent, setIsDeletingStudent] = useState(false)
  const [isDeletingLoading, setIsDeletingLoading] = useState(false)

  useEffect(() => {
    setDraftStudent(student)
  }, [student])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const sectionParam = searchParams.get('section') || searchParams.get('tab')
    if (sectionParam === 'notes' || location.hash === '#notes') {
      setActiveTab('notes')
      setTimeout(() => {
        notesRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location])

  const studentNotes = useMemo(
    () => notes.filter((note) => note.studentId === student?.id),
    [notes, student],
  )

  const filteredNotes = useMemo(() => {
    if (selectedCategoryFilter === 'Todas') {
      return studentNotes
    }
    return studentNotes.filter((note) => note.category === selectedCategoryFilter)
  }, [selectedCategoryFilter, studentNotes])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!student || !title || !content) return

    setIsSubmittingNote(true)
    try {
      await onAddNote({
        studentId: student.id,
        authorId: currentUserId,
        authorRole: userRole,
        authorName: currentUserName || roleLabel[userRole],
        title,
        category,
        content,
        files: selectedFiles,
      })

      setTitle('')
      setCategory('Geral')
      setContent('')
      setSelectedFiles([])
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleSaveStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!student || !draftStudent) return
    await onUpdateStudent(student.id, draftStudent)
  }

  const handleConfirmDeleteStudent = async () => {
    if (!student) return
    setIsDeletingLoading(true)
    try {
      await onDeleteStudent(student.id)
    } finally {
      setIsDeletingLoading(false)
      setIsDeletingStudent(false)
    }
  }

  const handleEditNote = (note: StudentNote) => {
    setEditNoteId(note.id)
    setEditTitle(note.title)
    setEditCategory(note.category || 'Geral')
    setEditContent(note.content)
  }

  const handleSaveEditedNote = async () => {
    if (!editNoteId) return
    await onUpdateNote(editNoteId, {
      title: editTitle,
      category: editCategory,
      content: editContent,
      authorName: currentUserName || roleLabel[userRole],
    })
    setEditNoteId(null)
  }

  const handleConfirmDeleteNote = async () => {
    if (!noteToDelete) return
    setIsDeletingLoading(true)
    try {
      await onDeleteNote(noteToDelete.id)
    } finally {
      setIsDeletingLoading(false)
      setNoteToDelete(null)
    }
  }

  const handleConfirmDeleteDocument = async () => {
    if (!docToDelete) return
    setIsDeletingLoading(true)
    try {
      await onDeleteDocument(docToDelete.id)
    } finally {
      setIsDeletingLoading(false)
      setDocToDelete(null)
    }
  }

  const loadHistory = async (studentId: string) => {
    try {
      const historyData = await api.getNoteHistory(studentId)
      setHistory(historyData)
    } catch {
      setHistory([])
    }
  }

  if (!student) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">Aluno não encontrado.</div>
  }

  const setStudentField = <K extends keyof Student>(field: K, value: Student[K]) => {
    setDraftStudent((current) => (current ? { ...current, [field]: value } : current))
  }

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserRound className="h-4 w-4" />
            Dados do Aluno
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'notes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Anotações & Documentos
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'notes' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {studentNotes.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 pr-3 text-xs text-slate-500">
          <span>Aluno: <strong className="font-semibold text-slate-900">{student.name}</strong></span>
          <span>·</span>
          <span>Categoria: <strong className="font-semibold text-slate-900">{student.category}</strong></span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* STUDENT PROFILE SECTION */}
        <section
          className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition ${
            activeTab === 'profile' ? 'ring-2 ring-emerald-500/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <UserRound className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ficha do Aluno</p>
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                student.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {student.status}
            </span>
          </div>

          <form onSubmit={handleSaveStudent} className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Categoria</label>
              <input
                value={draftStudent?.category ?? student.category}
                onChange={(event) => setStudentField('category', event.target.value)}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
              <select
                value={draftStudent?.status ?? student.status}
                onChange={(event) => setStudentField('status', event.target.value as Student['status'])}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Responsável</label>
              <input
                value={draftStudent?.responsible ?? student.responsible}
                onChange={(event) => setStudentField('responsible', event.target.value)}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Contato</label>
              <input
                value={draftStudent?.contact ?? student.contact}
                onChange={(event) => setStudentField('contact', event.target.value)}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Time / Turma</label>
              <input
                value={draftStudent?.team ?? student.team}
                onChange={(event) => setStudentField('team', event.target.value)}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Frequência / Presença</label>
              <input
                value={draftStudent?.attendance ?? student.attendance}
                onChange={(event) => setStudentField('attendance', event.target.value)}
                className="w-full rounded-2xl bg-slate-50 p-3 outline-none border border-slate-200 focus:border-emerald-500 transition"
              />
            </div>

            <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                Salvar alterações
              </button>
              <button
                type="button"
                onClick={() => setIsDeletingStudent(true)}
                className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Excluir aluno
              </button>
            </div>
          </form>
        </section>

        {/* NOTES & DOCUMENTS SECTION */}
        <section
          ref={notesRef}
          id="notes"
          className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition ${
            activeTab === 'notes' ? 'ring-2 ring-emerald-500/20' : ''
          }`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Anotações do Aluno</h2>
                <p className="text-xs text-slate-500">Evoluções clínicas, acompanhamentos e documentos anexos</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['Todas', ...NOTE_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                    selectedCategoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Form to Register Note */}
          <form onSubmit={handleSubmitNote} className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Nova Anotação ou Relatório</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da anotação (ex: Avaliação inicial)"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-emerald-500 transition"
              />
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <Tag className="h-4 w-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full bg-transparent outline-none text-slate-700 text-sm font-medium"
                >
                  {NOTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      Categoria: {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva detalhadamente o registro do atendimento, observações, testes ou plano de ação..."
              rows={4}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-emerald-500 transition"
            />

            {/* File Upload Zone */}
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Anexar documentos e laudos</p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG, DOCX, XLSX (máx. 10MB)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Selecionar arquivos
                </button>
              </div>

              {/* Selected files preview list */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 border border-emerald-200"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <span className="text-[10px] text-emerald-600">({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(idx)}
                        className="rounded-full p-0.5 hover:bg-emerald-200 transition text-emerald-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingNote}
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
            >
              {isSubmittingNote ? 'Registrando...' : 'Registrar anotação'}
            </button>
          </form>

          {/* Notes List */}
          <div className="mt-6 space-y-4">
            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                Nenhuma anotação registrada nesta categoria.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{note.title}</h4>
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {note.category || 'Geral'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{note.date || note.createdAt}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>

                  {/* Author Badge */}
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <User className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      Registrado por:{' '}
                      <strong className="text-slate-800">
                        {note.authorName} ({roleLabel[note.authorRole] || note.authorRole})
                      </strong>
                    </span>
                  </div>

                  {/* Attached Documents */}
                  {note.documents && note.documents.length > 0 && (
                    <div className="mt-4 border-t border-slate-200/80 pt-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        Documentos Anexados ({note.documents.length}):
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {note.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getFileIcon(doc.mimeType, doc.originalName)}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate" title={doc.originalName}>
                                  {doc.originalName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(doc.fileSize)} · Por {doc.uploadedByName || note.authorName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={api.getDownloadDocumentUrl(doc.id)}
                                download={doc.originalName}
                                title="Baixar documento"
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => setDocToDelete(doc)}
                                title="Excluir documento"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions bar */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditNote(note)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => loadHistory(student.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        Histórico
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNoteToDelete(note)}
                      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir anotação
                    </button>
                  </div>

                  {/* Inline edit note form */}
                  {editNoteId === note.id && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Editar Anotação</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                        <select
                          value={editCategory}
                          onChange={(event) => setEditCategory(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        >
                          {NOTE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEditedNote}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Salvar edição
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditNoteId(null)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* History modal/drawer */}
          {history.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-600" />
                  Histórico temporal de alterações
                </h3>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Fechar
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-white p-3 text-xs text-slate-600 border border-slate-200/60">
                    <p className="font-bold text-slate-900">{entry.title}</p>
                    <p className="mt-1 text-slate-700">{entry.content}</p>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Editado por {entry.author_name} em {entry.created_at}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* CONFIRMATION MODALS */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Excluir documento anexado?"
        message={`Tem certeza que deseja excluir o documento "${docToDelete?.originalName}"? Esta ação removerá o arquivo permanentemente do servidor e não pode ser desfeita.`}
        confirmText="Sim, excluir documento"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingLoading}
        onConfirm={handleConfirmDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Excluir anotação?"
        message={`Tem certeza que deseja excluir a anotação "${noteToDelete?.title}"? Todos os documentos anexados a esta anotação também serão excluídos permanentemente.`}
        confirmText="Sim, excluir anotação"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingLoading}
        onConfirm={handleConfirmDeleteNote}
        onCancel={() => setNoteToDelete(null)}
      />

      <ConfirmModal
        isOpen={isDeletingStudent}
        title="Excluir cadastro do aluno?"
        message={`Tem certeza que deseja excluir o aluno ${student.name}? Todas as anotações e documentos vinculados serão permanentemente removidos do banco de dados.`}
        confirmText="Sim, excluir aluno"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingLoading}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setIsDeletingStudent(false)}
      />
    </div>
  )
}
