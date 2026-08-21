import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

import {
  all,
  get,
  run,
  initializeDatabase,
} from './db.js'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado')
}

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || '8h'

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173'

const NODE_ENV =
  process.env.NODE_ENV || 'development'

const PORT = Number(process.env.PORT || 3001)

if (
  !Number.isInteger(PORT) ||
  PORT <= 0 ||
  PORT > 65535
) {
  throw new Error('PORT inválida')
}

const COOKIE_NAME = 'soccer_school_token'

// Cookie configurado para 8 horas.
// Se JWT_EXPIRES_IN mudar, mantenha este valor compatível.
const COOKIE_MAX_AGE =
  8 * 60 * 60 * 1000

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production',
  path: '/',
}

const app = express()

// =====================================================
// UPLOADS
// =====================================================

const uploadDir = path.join(
  process.cwd(),
  'server',
  'uploads',
  'notes',
)

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(
      file.originalname,
    )

    const storedName =
      `${Date.now()}-${randomUUID()}${ext}`

    cb(null, storedName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
)

app.use(cookieParser())
app.use(express.json())

// Ainda público nesta fase.
// Depois vamos proteger downloads/uploads separadamente.
app.use(
  '/uploads',
  express.static(
    path.join(
      process.cwd(),
      'server',
      'uploads',
    ),
  ),
)

// =====================================================
// AUTENTICAÇÃO
// =====================================================

const requireAuth = (req, res, next) => {
  const token =
    req.cookies?.[COOKIE_NAME]

  if (!token) {
    return res.status(401).json({
      message:
        'Acesso não autorizado: token ausente',
    })
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET,
    )

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.id !== 'string'
    ) {
      return res.status(401).json({
        message:
          'Acesso não autorizado: token inválido',
      })
    }

    req.user = decoded

    return next()
  } catch {
    return res.status(401).json({
      message:
        'Acesso não autorizado: token inválido ou expirado',
    })
  }
}

// =====================================================
// BANCO
// =====================================================

await initializeDatabase()

// =====================================================
// ROTAS PÚBLICAS
// =====================================================

app.get('/api/health', (_req, res) => {
  return res.json({
    ok: true,
    message:
      'Soccer School CRM API online',
  })
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(401).json({
      message: 'Credenciais inválidas',
    })
  }

  const professional = await get(
    `
      SELECT
        id,
        name,
        email,
        password,
        role,
        specialty,
        status
      FROM professionals
      WHERE email = ?
    `,
    [email.trim()],
  )

  if (!professional) {
    return res.status(401).json({
      message: 'Credenciais inválidas',
    })
  }

  const isPasswordValid =
    await bcrypt.compare(
      password,
      professional.password,
    )

  if (!isPasswordValid) {
    return res.status(401).json({
      message: 'Credenciais inválidas',
    })
  }

  if (professional.status === 'Inativo') {
    return res.status(401).json({
      message: 'Credenciais inválidas',
    })
  }

  const token = jwt.sign(
    {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      role: professional.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  )

  res.cookie(
    COOKIE_NAME,
    token,
    {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    },
  )

  return res.json({
    id: professional.id,
    name: professional.name,
    email: professional.email,
    role: professional.role,
    specialty: professional.specialty,
    status: professional.status,
  })
})

app.get(
  '/api/me',
  requireAuth,
  async (req, res) => {
    const professional = await get(
      `
        SELECT
          id,
          name,
          email,
          role,
          specialty,
          status
        FROM professionals
        WHERE id = ?
      `,
      [req.user.id],
    )

    if (!professional) {
      res.clearCookie(
        COOKIE_NAME,
        COOKIE_OPTIONS,
      )

      return res.status(401).json({
        message:
          'Usuário não encontrado',
      })
    }

    if (
      professional.status === 'Inativo'
    ) {
      res.clearCookie(
        COOKIE_NAME,
        COOKIE_OPTIONS,
      )

      return res.status(401).json({
        message: 'Usuário inativo',
      })
    }

    return res.json({
      id: professional.id,
      name: professional.name,
      email: professional.email,
      role: professional.role,
      specialty:
        professional.specialty,
      status: professional.status,
    })
  },
)

app.post('/api/logout', (_req, res) => {
  res.clearCookie(
    COOKIE_NAME,
    COOKIE_OPTIONS,
  )

  return res.json({
    ok: true,
    message:
      'Logout realizado com sucesso',
  })
})

// =====================================================
// A PARTIR DAQUI TODA /api PRECISA DE LOGIN
// =====================================================

app.use('/api', requireAuth)

// =====================================================
// PROFISSIONAIS
// =====================================================

app.get(
  '/api/professionals',
  async (_req, res) => {
    const professionals = await all(
      `
        SELECT
          id,
          name,
          email,
          role,
          specialty,
          status
        FROM professionals
        ORDER BY name ASC
      `,
    )

    return res.json(professionals)
  },
)

app.post(
  '/api/professionals',
  async (req, res) => {
    const {
      name,
      email,
      password,
      role,
      specialty,
      status = 'Ativo',
    } = req.body

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !role.trim()
    ) {
      return res.status(400).json({
        message:
          'Nome, e-mail, senha e função são obrigatórios',
      })
    }

    const existingProfessional =
      await get(
        `
          SELECT id
          FROM professionals
          WHERE email = ?
        `,
        [email.trim()],
      )

    if (existingProfessional) {
      return res.status(409).json({
        message:
          'Já existe um profissional com este e-mail',
      })
    }

    const id = randomUUID()

    const passwordHash =
      await bcrypt.hash(
        password,
        10,
      )

    await run(
      `
        INSERT INTO professionals (
          id,
          name,
          email,
          password,
          role,
          specialty,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        name.trim(),
        email.trim(),
        passwordHash,
        role,
        specialty || '',
        status,
      ],
    )

    return res.status(201).json({
      id,
      name: name.trim(),
      email: email.trim(),
      role,
      specialty: specialty || '',
      status,
    })
  },
)

app.put(
  '/api/professionals/:id',
  async (req, res) => {
    const { id } = req.params

    const {
      name,
      email,
      password,
      role,
      specialty,
      status,
    } = req.body

    const existingProfessional =
      await get(
        `
          SELECT
            id,
            status
          FROM professionals
          WHERE id = ?
        `,
        [id],
      )

    if (!existingProfessional) {
      return res.status(404).json({
        message:
          'Profissional não encontrado',
      })
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof role !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !role.trim()
    ) {
      return res.status(400).json({
        message:
          'Nome, e-mail e função são obrigatórios',
      })
    }

    const emailOwner = await get(
      `
        SELECT id
        FROM professionals
        WHERE email = ?
          AND id <> ?
      `,
      [
        email.trim(),
        id,
      ],
    )

    if (emailOwner) {
      return res.status(409).json({
        message:
          'Já existe outro profissional com este e-mail',
      })
    }

    const nextStatus =
      status ??
      existingProfessional.status ??
      'Ativo'

    const hasNewPassword =
      typeof password === 'string' &&
      password.trim().length > 0

    if (hasNewPassword) {
      const passwordHash =
        await bcrypt.hash(
          password,
          10,
        )

      await run(
        `
          UPDATE professionals
          SET
            name = ?,
            email = ?,
            password = ?,
            role = ?,
            specialty = ?,
            status = ?
          WHERE id = ?
        `,
        [
          name.trim(),
          email.trim(),
          passwordHash,
          role,
          specialty || '',
          nextStatus,
          id,
        ],
      )
    } else {
      await run(
        `
          UPDATE professionals
          SET
            name = ?,
            email = ?,
            role = ?,
            specialty = ?,
            status = ?
          WHERE id = ?
        `,
        [
          name.trim(),
          email.trim(),
          role,
          specialty || '',
          nextStatus,
          id,
        ],
      )
    }

    const professional = await get(
      `
        SELECT
          id,
          name,
          email,
          role,
          specialty,
          status
        FROM professionals
        WHERE id = ?
      `,
      [id],
    )

    return res.json(professional)
  },
)

app.delete(
  '/api/professionals/:id',
  async (req, res) => {
    const { id } = req.params

    const professional = await get(
      `
        SELECT id
        FROM professionals
        WHERE id = ?
      `,
      [id],
    )

    if (!professional) {
      return res.status(404).json({
        message:
          'Profissional não encontrado',
      })
    }

    await run(
      'DELETE FROM professionals WHERE id = ?',
      [id],
    )

    return res.json({
      ok: true,
      id,
    })
  },
)

// =====================================================
// ALUNOS
// =====================================================

app.get(
  '/api/students',
  async (_req, res) => {
    const students = await all(
      `
        SELECT
          id,
          name,
          category,
          status,
          responsible,
          contact,
          team,
          attendance
        FROM students
        ORDER BY name ASC
      `,
    )

    return res.json(students)
  },
)

app.post(
  '/api/students',
  async (req, res) => {
    const {
      name,
      category,
      status,
      responsible,
      contact,
      team,
      attendance,
    } = req.body

    const id = randomUUID()

    await run(
      `
        INSERT INTO students (
          id,
          name,
          category,
          status,
          responsible,
          contact,
          team,
          attendance
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        name,
        category,
        status,
        responsible,
        contact,
        team,
        attendance,
      ],
    )

    return res.status(201).json({
      id,
      name,
      category,
      status,
      responsible,
      contact,
      team,
      attendance,
    })
  },
)

app.put(
  '/api/students/:id',
  async (req, res) => {
    const { id } = req.params

    const {
      name,
      category,
      status,
      responsible,
      contact,
      team,
      attendance,
    } = req.body

    const existingStudent = await get(
      `
        SELECT id
        FROM students
        WHERE id = ?
      `,
      [id],
    )

    if (!existingStudent) {
      return res.status(404).json({
        message:
          'Aluno não encontrado',
      })
    }

    await run(
      `
        UPDATE students
        SET
          name = ?,
          category = ?,
          status = ?,
          responsible = ?,
          contact = ?,
          team = ?,
          attendance = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        name,
        category,
        status,
        responsible,
        contact,
        team,
        attendance,
        id,
      ],
    )

    const student = await get(
      `
        SELECT
          id,
          name,
          category,
          status,
          responsible,
          contact,
          team,
          attendance
        FROM students
        WHERE id = ?
      `,
      [id],
    )

    return res.json(student)
  },
)

app.delete(
  '/api/students/:id',
  async (req, res) => {
    const { id } = req.params

    const existingStudent = await get(
      `
        SELECT id
        FROM students
        WHERE id = ?
      `,
      [id],
    )

    if (!existingStudent) {
      return res.status(404).json({
        message:
          'Aluno não encontrado',
      })
    }

    await run(
      'DELETE FROM students WHERE id = ?',
      [id],
    )

    return res.json({
      ok: true,
      id,
    })
  },
)

// =====================================================
// NOTES & DOCUMENTS ENDPOINTS
// =====================================================

app.get('/api/students/:id/notes', async (req, res) => {
  const { id } = req.params

  const student = await get(
    'SELECT id FROM students WHERE id = ?',
    [id],
  )

  if (!student) {
    return res.status(404).json({
      message: 'Aluno não encontrado',
    })
  }

  const notes = await all(
    `
      SELECT
        id,
        student_id,
        author_id,
        author_role,
        author_name,
        title,
        category,
        content,
        created_at,
        updated_at
      FROM student_notes
      WHERE student_id = ?
      ORDER BY created_at DESC
    `,
    [id],
  )

  const allDocuments = await all(
    `
      SELECT
        id,
        note_id,
        student_id,
        uploaded_by_id,
        uploaded_by_name,
        original_name,
        stored_name,
        file_path,
        file_size,
        mime_type,
        created_at
      FROM note_documents
      WHERE student_id = ?
      ORDER BY created_at DESC
    `,
    [id],
  )

  const notesWithDocs = notes.map((note) => {
    const documents = allDocuments
      .filter((doc) => doc.note_id === note.id)
      .map((doc) => ({
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
      documents,
    }
  })

  return res.json(notesWithDocs)
})

app.post(
  '/api/students/:id/notes',
  upload.array('files'),
  async (req, res) => {
    const { id } = req.params

    const {
      title,
      category = 'Geral',
      content,
    } = req.body

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof content !== 'string'
    ) {
      return res.status(400).json({
        message: 'Título e conteúdo são obrigatórios',
      })
    }

    const student = await get(
      'SELECT id FROM students WHERE id = ?',
      [id],
    )

    if (!student) {
      return res.status(404).json({
        message: 'Aluno não encontrado',
      })
    }

    const noteId = randomUUID()

    // A identidade do autor vem da sessão autenticada,
    // não dos dados enviados pelo frontend.
    const authorId = req.user.id
    const authorRole = req.user.role
    const authorName = req.user.name

    await run(
      `
        INSERT INTO student_notes (
          id,
          student_id,
          author_id,
          author_role,
          author_name,
          title,
          category,
          content
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        noteId,
        id,
        authorId,
        authorRole,
        authorName,
        title.trim(),
        category || 'Geral',
        content,
      ],
    )

    await run(
      `
        INSERT INTO note_versions (
          id,
          note_id,
          title,
          content,
          author_name,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        randomUUID(),
        noteId,
        title.trim(),
        content,
        authorName,
        new Date().toISOString(),
      ],
    )

    const documents = []

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const docId = randomUUID()

        const relativePath = path.relative(
          process.cwd(),
          file.path,
        )

        await run(
          `
            INSERT INTO note_documents (
              id,
              note_id,
              student_id,
              uploaded_by_id,
              uploaded_by_name,
              original_name,
              stored_name,
              file_path,
              file_size,
              mime_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            docId,
            noteId,
            id,
            authorId,
            authorName,
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
          uploadedById: authorId,
          uploadedByName: authorName,
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
      `
        SELECT
          id,
          student_id,
          author_id,
          author_role,
          author_name,
          title,
          category,
          content,
          created_at,
          updated_at
        FROM student_notes
        WHERE id = ?
      `,
      [noteId],
    )

    return res.status(201).json({
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
  },
)

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params

  const {
    title,
    content,
    category,
  } = req.body

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    typeof content !== 'string'
  ) {
    return res.status(400).json({
      message: 'Título e conteúdo são obrigatórios',
    })
  }

  const note = await get(
    `
      SELECT
        id,
        student_id,
        author_id,
        author_role,
        author_name,
        title,
        category,
        content
      FROM student_notes
      WHERE id = ?
    `,
    [id],
  )

  if (!note) {
    return res.status(404).json({
      message: 'Nota não encontrada',
    })
  }

  const newCategory =
    category ||
    note.category ||
    'Geral'

  const authorName = req.user.name

  await run(
    `
      UPDATE student_notes
      SET
        title = ?,
        content = ?,
        category = ?,
        author_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      title.trim(),
      content,
      newCategory,
      authorName,
      id,
    ],
  )

  await run(
    `
      INSERT INTO note_versions (
        id,
        note_id,
        title,
        content,
        author_name,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      randomUUID(),
      id,
      title.trim(),
      content,
      authorName,
      new Date().toISOString(),
    ],
  )

  const updatedNote = await get(
    `
      SELECT
        id,
        student_id,
        author_id,
        author_role,
        author_name,
        title,
        category,
        content,
        created_at,
        updated_at
      FROM student_notes
      WHERE id = ?
    `,
    [id],
  )

  const docs = await all(
    `
      SELECT
        id,
        note_id,
        student_id,
        uploaded_by_id,
        uploaded_by_name,
        original_name,
        stored_name,
        file_path,
        file_size,
        mime_type,
        created_at
      FROM note_documents
      WHERE note_id = ?
    `,
    [id],
  )

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

    documents: docs.map((doc) => ({
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
    })),
  })
})

app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params

  const note = await get(
    'SELECT id FROM student_notes WHERE id = ?',
    [id],
  )

  if (!note) {
    return res.status(404).json({
      message: 'Nota não encontrada',
    })
  }

  const docs = await all(
    `
      SELECT file_path
      FROM note_documents
      WHERE note_id = ?
    `,
    [id],
  )

  for (const doc of docs) {
    const fullPath = path.isAbsolute(
      doc.file_path,
    )
      ? doc.file_path
      : path.join(
          process.cwd(),
          doc.file_path,
        )

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch (err) {
        console.error(
          'Erro ao excluir arquivo:',
          err,
        )
      }
    }
  }

  await run(
    'DELETE FROM note_documents WHERE note_id = ?',
    [id],
  )

  await run(
    'DELETE FROM note_versions WHERE note_id = ?',
    [id],
  )

  await run(
    'DELETE FROM student_notes WHERE id = ?',
    [id],
  )

  return res.json({
    ok: true,
    id,
  })
})

app.post(
  '/api/notes/:id/documents',
  upload.array('files'),
  async (req, res) => {
    const { id } = req.params

    const note = await get(
      `
        SELECT
          id,
          student_id
        FROM student_notes
        WHERE id = ?
      `,
      [id],
    )

    if (!note) {
      return res.status(404).json({
        message: 'Nota não encontrada',
      })
    }

    const uploadedById = req.user.id
    const uploadedByName = req.user.name

    const documents = []

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const docId = randomUUID()

        const relativePath = path.relative(
          process.cwd(),
          file.path,
        )

        await run(
          `
            INSERT INTO note_documents (
              id,
              note_id,
              student_id,
              uploaded_by_id,
              uploaded_by_name,
              original_name,
              stored_name,
              file_path,
              file_size,
              mime_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            docId,
            id,
            note.student_id,
            uploadedById,
            uploadedByName,
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
          uploadedById,
          uploadedByName,
          originalName: file.originalname,
          storedName: file.filename,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return res
      .status(201)
      .json(documents)
  },
)

app.get(
  '/api/documents/:id/download',
  async (req, res) => {
    const { id } = req.params

    const doc = await get(
      `
        SELECT
          file_path,
          original_name
        FROM note_documents
        WHERE id = ?
      `,
      [id],
    )

    if (!doc) {
      return res.status(404).json({
        message:
          'Documento não encontrado',
      })
    }

    const fullPath = path.isAbsolute(
      doc.file_path,
    )
      ? doc.file_path
      : path.join(
          process.cwd(),
          doc.file_path,
        )

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        message:
          'Arquivo não encontrado no servidor',
      })
    }

    return res.download(
      fullPath,
      doc.original_name,
    )
  },
)

app.delete(
  '/api/documents/:id',
  async (req, res) => {
    const { id } = req.params

    const doc = await get(
      `
        SELECT
          id,
          file_path
        FROM note_documents
        WHERE id = ?
      `,
      [id],
    )

    if (!doc) {
      return res.status(404).json({
        message:
          'Documento não encontrado',
      })
    }

    const fullPath = path.isAbsolute(
      doc.file_path,
    )
      ? doc.file_path
      : path.join(
          process.cwd(),
          doc.file_path,
        )

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch (err) {
        console.error(
          'Erro ao excluir arquivo do documento:',
          err,
        )
      }
    }

    await run(
      'DELETE FROM note_documents WHERE id = ?',
      [id],
    )

    return res.json({
      ok: true,
      id,
    })
  },
)

app.get(
  '/api/students/:id/notes/history',
  async (req, res) => {
    const { id } = req.params

    const student = await get(
      'SELECT id FROM students WHERE id = ?',
      [id],
    )

    if (!student) {
      return res.status(404).json({
        message: 'Aluno não encontrado',
      })
    }

    const history = await all(
      `
        SELECT
          nv.id,
          nv.note_id,
          nv.title,
          nv.content,
          nv.author_name,
          nv.created_at
        FROM note_versions nv
        JOIN student_notes sn
          ON sn.id = nv.note_id
        WHERE sn.student_id = ?
        ORDER BY nv.created_at DESC
      `,
      [id],
    )

    return res.json(history)
  },
)

// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(
    `CRM API listening on http://localhost:${PORT}`,
  )
})