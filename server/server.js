import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { all, get, run, initializeDatabase } from './db.js'

const app = express()
const port = 3001

const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'notes')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const storedName = `${Date.now()}-${randomUUID()}${ext}`
    cb(null, storedName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')))

await initializeDatabase()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Soccer School CRM API online' })
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  const professional = await get(
    'SELECT id, name, email, password, role, specialty, status FROM professionals WHERE email = ?',
    [email],
  )

  if (!professional) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  const isPasswordValid = await bcrypt.compare(password, professional.password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  return res.json({
    id: professional.id,
    name: professional.name,
    email: professional.email,
    role: professional.role,
    specialty: professional.specialty,
    status: professional.status,
  })
})

app.get('/api/professionals', async (_req, res) => {
  const professionals = await all('SELECT id, name, email, password, role, specialty, status FROM professionals ORDER BY name ASC')
  res.json(professionals)
})

app.get('/api/admin-settings', async (_req, res) => {
  const settings = await get('SELECT school_name, cnpj, contact_email, phone, address, active_categories, theme_mode, primary_color FROM admin_settings WHERE id = ?', ['main'])

  if (!settings) {
    return res.status(404).json({ message: 'Configurações não encontradas' })
  }

  return res.json({
    schoolName: settings.school_name,
    cnpj: settings.cnpj,
    contactEmail: settings.contact_email,
    phone: settings.phone,
    address: settings.address,
    activeCategories: JSON.parse(settings.active_categories),
    themeMode: settings.theme_mode,
    primaryColor: settings.primary_color,
  })
})

app.put('/api/admin-settings', async (req, res) => {
  const { schoolName, cnpj, contactEmail, phone, address, activeCategories, themeMode, primaryColor } = req.body

  await run(
    `UPDATE admin_settings
     SET school_name = ?, cnpj = ?, contact_email = ?, phone = ?, address = ?, active_categories = ?, theme_mode = ?, primary_color = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [schoolName, cnpj, contactEmail, phone, address, JSON.stringify(activeCategories), themeMode, primaryColor, 'main'],
  )

  return res.json({
    schoolName,
    cnpj,
    contactEmail,
    phone,
    address,
    activeCategories,
    themeMode,
    primaryColor,
  })
})

app.post('/api/professionals', async (req, res) => {
  const { name, email, password, role, specialty, status = 'Ativo' } = req.body
  const id = randomUUID()

  await run(
    'INSERT INTO professionals (id, name, email, password, role, specialty, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, email, password, role, specialty, status],
  )

  res.status(201).json({ id, name, email, password, role, specialty, status })
})

app.put('/api/professionals/:id', async (req, res) => {
  const { id } = req.params
  const { name, email, password, role, specialty, status = 'Ativo' } = req.body

  await run(
    'UPDATE professionals SET name = ?, email = ?, password = ?, role = ?, specialty = ?, status = ? WHERE id = ?',
    [name, email, password, role, specialty, status, id],
  )

  const professional = await get('SELECT id, name, email, password, role, specialty, status FROM professionals WHERE id = ?', [id])
  res.json(professional)
})

app.delete('/api/professionals/:id', async (req, res) => {
  const { id } = req.params
  await run('DELETE FROM professionals WHERE id = ?', [id])
  res.json({ ok: true, id })
})

app.get('/api/students', async (_req, res) => {
  const students = await all('SELECT id, name, category, status, responsible, contact, team, attendance FROM students ORDER BY name ASC')
  res.json(students)
})

app.post('/api/students', async (req, res) => {
  const { name, category, status, responsible, contact, team, attendance } = req.body
  const id = randomUUID()

  await run(
    'INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, category, status, responsible, contact, team, attendance],
  )

  res.status(201).json({ id, name, category, status, responsible, contact, team, attendance })
})

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params
  const { name, category, status, responsible, contact, team, attendance } = req.body

  await run(
    'UPDATE students SET name = ?, category = ?, status = ?, responsible = ?, contact = ?, team = ?, attendance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, category, status, responsible, contact, team, attendance, id],
  )

  const student = await get('SELECT id, name, category, status, responsible, contact, team, attendance FROM students WHERE id = ?', [id])
  res.json(student)
})

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params
  await run('DELETE FROM students WHERE id = ?', [id])
  res.json({ ok: true, id })
})

// NOTES & DOCUMENTS ENDPOINTS

app.get('/api/students/:id/notes', async (req, res) => {
  const { id } = req.params
  const notes = await all(
    'SELECT id, student_id, author_id, author_role, author_name, title, category, content, created_at, updated_at FROM student_notes WHERE student_id = ? ORDER BY created_at DESC',
    [id],
  )

  const allDocuments = await all(
    'SELECT id, note_id, student_id, uploaded_by_id, uploaded_by_name, original_name, stored_name, file_path, file_size, mime_type, created_at FROM note_documents WHERE student_id = ? ORDER BY created_at DESC',
    [id],
  )

  const notesWithDocs = notes.map((note) => {
    const docs = allDocuments.filter((doc) => doc.note_id === note.id).map((doc) => ({
      id: doc.id,
      noteId: doc.note_id,
      studentId: doc.student_id,
      uploadedById: doc.uploaded_by_id,
      uploadedByName: doc.uploaded_by_name,
      originalName: doc.original_name,
      storedName: doc.stored_name,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      createdAt: doc.created_at,
    }))

    return {
      id: note.id,
      studentId: note.student_id,
      authorId: note.author_id,
      authorRole: note.author_role,
      authorName: note.author_name,
      title: note.title,
      category: note.category || 'Geral',
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      date: note.created_at,
      documents: docs,
    }
  })

  res.json(notesWithDocs)
})

app.post('/api/students/:id/notes', upload.array('files'), async (req, res) => {
  const { id } = req.params
  const { authorId, authorRole, authorName, title, category = 'Geral', content } = req.body
  const noteId = randomUUID()

  await run(
    'INSERT INTO student_notes (id, student_id, author_id, author_role, author_name, title, category, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [noteId, id, authorId || null, authorRole, authorName, title, category, content],
  )

  await run(
    'INSERT INTO note_versions (id, note_id, title, content, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), noteId, title, content, authorName, new Date().toISOString()],
  )

  const documents = []
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const docId = randomUUID()
      const relativePath = path.relative(process.cwd(), file.path)
      await run(
        `INSERT INTO note_documents (id, note_id, student_id, uploaded_by_id, uploaded_by_name, original_name, stored_name, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          noteId,
          id,
          authorId || '',
          authorName || '',
          file.originalname,
          file.filename,
          relativePath,
          file.size,
          file.mimetype,
        ],
      )
      documents.push({
        id: docId,
        noteId,
        studentId: id,
        uploadedById: authorId || '',
        uploadedByName: authorName || '',
        originalName: file.originalname,
        storedName: file.filename,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const createdNote = await get(
    'SELECT id, student_id, author_id, author_role, author_name, title, category, content, created_at, updated_at FROM student_notes WHERE id = ?',
    [noteId],
  )

  res.status(201).json({
    id: createdNote.id,
    studentId: createdNote.student_id,
    authorId: createdNote.author_id,
    authorRole: createdNote.author_role,
    authorName: createdNote.author_name,
    title: createdNote.title,
    category: createdNote.category,
    content: createdNote.content,
    createdAt: createdNote.created_at,
    updatedAt: createdNote.updated_at,
    date: createdNote.created_at,
    documents,
  })
})

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params
  const { title, content, category, authorName } = req.body

  const note = await get('SELECT id, student_id, author_role, author_name, title, category, content FROM student_notes WHERE id = ?', [id])
  if (!note) {
    return res.status(404).json({ message: 'Nota não encontrada' })
  }

  const newCategory = category || note.category || 'Geral'

  await run(
    'UPDATE student_notes SET title = ?, content = ?, category = ?, author_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, content, newCategory, authorName, id],
  )

  await run(
    'INSERT INTO note_versions (id, note_id, title, content, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), id, title, content, authorName, new Date().toISOString()],
  )

  const updatedNote = await get('SELECT id, student_id, author_id, author_role, author_name, title, category, content, created_at, updated_at FROM student_notes WHERE id = ?', [id])

  const docs = await all('SELECT id, note_id, student_id, uploaded_by_id, uploaded_by_name, original_name, stored_name, file_path, file_size, mime_type, created_at FROM note_documents WHERE note_id = ?', [id])

  return res.json({
    id: updatedNote.id,
    studentId: updatedNote.student_id,
    authorId: updatedNote.author_id,
    authorRole: updatedNote.author_role,
    authorName: updatedNote.author_name,
    title: updatedNote.title,
    category: updatedNote.category,
    content: updatedNote.content,
    createdAt: updatedNote.created_at,
    updatedAt: updatedNote.updated_at,
    date: updatedNote.created_at,
    documents: docs.map((d) => ({
      id: d.id,
      noteId: d.note_id,
      studentId: d.student_id,
      uploadedById: d.uploaded_by_id,
      uploadedByName: d.uploaded_by_name,
      originalName: d.original_name,
      storedName: d.stored_name,
      filePath: d.file_path,
      fileSize: d.file_size,
      mimeType: d.mime_type,
      createdAt: d.created_at,
    })),
  })
})

app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params

  const docs = await all('SELECT file_path FROM note_documents WHERE note_id = ?', [id])
  for (const doc of docs) {
    const fullPath = path.isAbsolute(doc.file_path)
      ? doc.file_path
      : path.join(process.cwd(), doc.file_path)
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch (err) {
        console.error('Error deleting file:', err)
      }
    }
  }

  await run('DELETE FROM student_notes WHERE id = ?', [id])
  res.json({ ok: true, id })
})

app.post('/api/notes/:id/documents', upload.array('files'), async (req, res) => {
  const { id } = req.params
  const { uploadedById, uploadedByName } = req.body

  const note = await get('SELECT id, student_id FROM student_notes WHERE id = ?', [id])
  if (!note) {
    return res.status(404).json({ message: 'Nota não encontrada' })
  }

  const documents = []
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const docId = randomUUID()
      const relativePath = path.relative(process.cwd(), file.path)
      await run(
        `INSERT INTO note_documents (id, note_id, student_id, uploaded_by_id, uploaded_by_name, original_name, stored_name, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          id,
          note.student_id,
          uploadedById || '',
          uploadedByName || '',
          file.originalname,
          file.filename,
          relativePath,
          file.size,
          file.mimetype,
        ],
      )

      documents.push({
        id: docId,
        noteId: id,
        studentId: note.student_id,
        uploadedById: uploadedById || '',
        uploadedByName: uploadedByName || '',
        originalName: file.originalname,
        storedName: file.filename,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        createdAt: new Date().toISOString(),
      })
    }
  }

  res.status(201).json(documents)
})

app.get('/api/documents/:id/download', async (req, res) => {
  const { id } = req.params
  const doc = await get('SELECT file_path, original_name, mime_type FROM note_documents WHERE id = ?', [id])

  if (!doc) {
    return res.status(404).json({ message: 'Documento não encontrado' })
  }

  const fullPath = path.isAbsolute(doc.file_path)
    ? doc.file_path
    : path.join(process.cwd(), doc.file_path)

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: 'Arquivo não encontrado no servidor' })
  }

  res.download(fullPath, doc.original_name)
})

app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params
  const doc = await get('SELECT file_path FROM note_documents WHERE id = ?', [id])

  if (!doc) {
    return res.status(404).json({ message: 'Documento não encontrado' })
  }

  const fullPath = path.isAbsolute(doc.file_path)
    ? doc.file_path
    : path.join(process.cwd(), doc.file_path)

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath)
    } catch (err) {
      console.error('Error deleting document file:', err)
    }
  }

  await run('DELETE FROM note_documents WHERE id = ?', [id])
  res.json({ ok: true, id })
})

app.get('/api/students/:id/notes/history', async (req, res) => {
  const { id } = req.params
  const history = await all(
    `SELECT nv.id, nv.note_id, nv.title, nv.content, nv.author_name, nv.created_at
     FROM note_versions nv
     JOIN student_notes sn ON sn.id = nv.note_id
     WHERE sn.student_id = ?
     ORDER BY nv.created_at DESC`,
    [id],
  )

  res.json(history)
})

app.listen(port, () => {
  console.log(`CRM API listening on http://localhost:${port}`)
})
