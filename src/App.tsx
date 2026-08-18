import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProfessionalsPage } from './pages/ProfessionalsPage'
import { StudentsPage } from './pages/StudentsPage'
import { AdminConsolePage } from './pages/AdminConsolePage'
import { StudentDetailPage } from './pages/StudentDetailPage'
import { canAccessRoute } from './lib/rbac'
import { api } from './lib/api'
import { useAuth } from './context/AuthContext'
import type { AdminSettings, AuthUser, Professional, Role, Student, StudentNote as StudentNoteType } from './types'

const DEFAULT_SETTINGS: AdminSettings = {
  schoolName: 'Soccer School Clinic',
  cnpj: '12.345.678/0001-90',
  contactEmail: 'contato@soccerschoolclinic.com',
  phone: '(11) 4002-8922',
  address: 'Rua dos Campeões, 140, São Paulo - SP',
  activeCategories: ['U8', 'U10', 'U12', 'U14', 'U16', 'Sub-18'],
  themeMode: 'light',
  primaryColor: '#10b981',
}

function App() {
  const { user, setUser, updateUser, logout } = useAuth()
  const [professionalsState, setProfessionalsState] = useState<Professional[]>([])
  const [studentsState, setStudentsState] = useState<Student[]>([])
  const [settingsState, setSettingsState] = useState<AdminSettings>(DEFAULT_SETTINGS)
  const [notes, setNotes] = useState<StudentNoteType[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const loadData = async () => {
      const [professionals, students, settings] = await Promise.all([
        api.getProfessionals(),
        api.getStudents(),
        api.getAdminSettings().catch(() => DEFAULT_SETTINGS),
      ])

      setProfessionalsState(professionals)
      setStudentsState(students)
      setSettingsState(settings)
    }

    loadData().catch(() => {
      setProfessionalsState([])
      setStudentsState([])
      setSettingsState(DEFAULT_SETTINGS)
    })
  }, [])

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('soccer-school-user', JSON.stringify(user))
      return
    }

    window.localStorage.removeItem('soccer-school-user')
  }, [user])

  const handleLogin = async (email: string, password: string) => {
    const userData = await api.login(email, password)
    const nextUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    }

    setUser(nextUser)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    logout()
  }

  const handleAddProfessional = async (payload: Omit<Professional, 'id'>) => {
    const professional = await api.createProfessional(payload)
    setProfessionalsState((current) => [...current, professional])
  }

  const handleUpdateProfessional = async (professionalId: string, payload: Omit<Professional, 'id'>) => {
    const professional = await api.updateProfessional(professionalId, payload)
    setProfessionalsState((current) =>
      current.map((item) =>
        item.id === professionalId
          ? professional ?? { ...item, ...payload, id: professionalId }
          : item,
      ),
    )
  }

  const handleDeleteProfessional = async (professionalId: string) => {
    await api.deleteProfessional(professionalId)
    setProfessionalsState((current) => current.filter((item) => item.id !== professionalId))
  }

  const handleUpdateCurrentUser = async (payload: Pick<AuthUser, 'name' | 'email'>) => {
    if (!user) {
      return
    }

    const currentProfessional = professionalsState.find((professional) => professional.id === user.id)

    let professional = currentProfessional ? {
      ...currentProfessional,
      name: payload.name,
      email: payload.email,
    } : null

    if (currentProfessional) {
      professional = await api.updateProfessional(user.id, {
        name: payload.name,
        email: payload.email,
        password: currentProfessional.password,
        role: currentProfessional.role,
        specialty: currentProfessional.specialty,
        status: currentProfessional.status ?? 'Ativo',
      })
    }

    if (professional) {
      setProfessionalsState((current) =>
        current.map((item) => (item.id === user.id ? professional : item)),
      )
    }

    updateUser(payload)
  }

  const handleSaveSettings = async (payload: AdminSettings) => {
    const updatedSettings = await api.updateAdminSettings(payload)
    setSettingsState(updatedSettings)
  }

  const handleAddStudent = async (payload: Omit<Student, 'id'>) => {
    const student = await api.createStudent(payload)
    setStudentsState((current) => [...current, student])
  }

  const handleUpdateStudent = async (studentId: string, payload: Omit<Student, 'id'>) => {
    const student = await api.updateStudent(studentId, payload)
    setStudentsState((current) =>
      current.map((item) =>
        item.id === studentId
          ? student ?? { ...item, ...payload, id: studentId }
          : item,
      ),
    )
  }

  const handleDeleteStudent = async (studentId: string) => {
    await api.deleteStudent(studentId)
    setStudentsState((current) => current.filter((item) => item.id !== studentId))
  }

  const handleAddNote = async (payload: {
    studentId: string
    authorId?: string
    authorRole: Role
    authorName: string
    title: string
    category: string
    content: string
    files?: File[]
  }) => {
    const note = await api.createNote(payload.studentId, {
      authorId: payload.authorId,
      authorRole: payload.authorRole,
      authorName: payload.authorName,
      title: payload.title,
      category: payload.category,
      content: payload.content,
      files: payload.files,
    })

    setNotes((current) => [note, ...current])
  }

  const handleUpdateNote = async (
    noteId: string,
    payload: { title: string; category?: string; content: string; authorName: string },
  ) => {
    const updatedNote = await api.updateNote(noteId, payload)
    setNotes((current) =>
      current.map((item) => (item.id === noteId ? { ...item, ...updatedNote } : item)),
    )
  }

  const handleDeleteNote = async (noteId: string) => {
    await api.deleteNote(noteId)
    setNotes((current) => current.filter((item) => item.id !== noteId))
  }

  const handleDeleteDocument = async (docId: string) => {
    await api.deleteDocument(docId)
    setNotes((current) =>
      current.map((note) => ({
        ...note,
        documents: note.documents?.filter((doc) => doc.id !== docId),
      })),
    )
  }

  const handleSelectStudent = (studentId: string, section?: 'profile' | 'notes') => {
    const targetUrl = `/students/${studentId}${section === 'notes' ? '?tab=notes#notes' : ''}`
    navigate(targetUrl)
  }

  const studentById = (studentId: string) => studentsState.find((student) => student.id === studentId)

  useEffect(() => {
    const loadNotes = async () => {
      const studentIds = studentsState.map((student) => student.id)
      const noteCollections = await Promise.all(studentIds.map((id) => api.getNotes(id)))
      const levelledNotes = noteCollections.flat().map((note) => ({
        ...note,
        date: note.createdAt ?? note.date,
        studentId: note.studentId,
      }))
      setNotes(levelledNotes)
    }

    if (studentsState.length > 0) {
      loadNotes().catch(() => setNotes([]))
    }
  }, [studentsState])

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  const canAccess = canAccessRoute(user.role, location.pathname)

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout user={user} professionals={professionalsState} settings={settingsState} onLogout={handleLogout}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              students={studentsState}
              notes={notes}
              onSelectStudent={handleSelectStudent}
              onAddStudent={handleAddStudent}
            />
          }
        />
        <Route
          path="/students"
          element={
            <StudentsPage
              students={studentsState}
              onSelectStudent={handleSelectStudent}
            />
          }
        />
        <Route
          path="/students/:id"
          element={
            <StudentDetailPage
              student={studentById(location.pathname.split('/').at(-1) ?? '')}
              notes={notes}
              userRole={user.role}
              currentUserId={user.id}
              currentUserName={user.name}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onDeleteDocument={handleDeleteDocument}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          }
        />
        <Route
          path="/professionals"
          element={
            <ProfessionalsPage
              professionals={professionalsState}
              onAddProfessional={handleAddProfessional}
              onUpdateProfessional={handleUpdateProfessional}
              onDeleteProfessional={handleDeleteProfessional}
            />
          }
        />
        <Route
          path="/admin-console"
          element={
            <AdminConsolePage
              currentUser={user}
              professionals={professionalsState}
              students={studentsState}
              settings={settingsState}
              onAddProfessional={handleAddProfessional}
              onUpdateProfessional={handleUpdateProfessional}
              onDeleteProfessional={handleDeleteProfessional}
              onUpdateCurrentUser={handleUpdateCurrentUser}
              onSaveSettings={handleSaveSettings}
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
