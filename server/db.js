import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'

const db = new sqlite3.Database('./soccer_school_crm.db')

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error)
        return
      }

      resolve({ id: this.lastID, changes: this.changes })
    })
  })

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error)
        return
      }

      resolve(rows)
    })
  })

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error)
        return
      }

      resolve(row)
    })
  })

const initializeDatabase = async () => {
  await run(`PRAGMA foreign_keys = ON`)

  await run(`
    CREATE TABLE IF NOT EXISTS professionals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      specialty TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  try {
    await run(`ALTER TABLE professionals ADD COLUMN status TEXT NOT NULL DEFAULT 'Ativo'`)
  } catch (error) {
    if (!error?.message?.includes('duplicate column name')) {
      throw error
    }
  }

  await run(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY,
      school_name TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      active_categories TEXT NOT NULL,
      theme_mode TEXT NOT NULL,
      primary_color TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      responsible TEXT NOT NULL,
      contact TEXT NOT NULL,
      team TEXT NOT NULL,
      attendance TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS student_notes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      author_id TEXT,
      author_role TEXT NOT NULL,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Geral',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES professionals(id) ON DELETE SET NULL
    )
  `)

  try {
    await run(`ALTER TABLE student_notes ADD COLUMN author_id TEXT REFERENCES professionals(id) ON DELETE SET NULL`)
  } catch (error) {
    if (!error?.message?.includes('duplicate column name')) {
      throw error
    }
  }

  try {
    await run(`ALTER TABLE student_notes ADD COLUMN category TEXT NOT NULL DEFAULT 'Geral'`)
  } catch (error) {
    if (!error?.message?.includes('duplicate column name')) {
      throw error
    }
  }

  await run(`
    CREATE TABLE IF NOT EXISTS note_documents (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      uploaded_by_id TEXT NOT NULL,
      uploaded_by_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES student_notes(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS note_versions (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES student_notes(id) ON DELETE CASCADE
    )
  `)

  const countProfessionals = await get(`SELECT COUNT(*) AS count FROM professionals`)
  if (countProfessionals.count === 0) {
    await run(
      `INSERT INTO professionals (id, name, email, password, role, specialty, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['p1', 'Maya Costa', 'admin@clinic.com', await bcrypt.hash('admin123', 10), 'admin', 'Administrador', 'Ativo'],
    )
    await run(
      `INSERT INTO professionals (id, name, email, password, role, specialty, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['p2', 'Dr. Lucas Pereira', 'psicologo@clinic.com', await bcrypt.hash('psico123', 10), 'psychologist', 'Psicólogo', 'Ativo'],
    )
    await run(
      `INSERT INTO professionals (id, name, email, password, role, specialty, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['p3', 'Dra. Ana Ribeiro', 'nutri@clinic.com', await bcrypt.hash('nutri123', 10), 'nutritionist', 'Nutricionista', 'Ativo'],
    )
    await run(
      `INSERT INTO professionals (id, name, email, password, role, specialty, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['p4', 'Carla Mendes', 'pedagogo@clinic.com', await bcrypt.hash('peda123', 10), 'pedagogue', 'Pedagoga', 'Ativo'],
    )
  }

  const countAdminSettings = await get(`SELECT COUNT(*) AS count FROM admin_settings`)
  if (countAdminSettings.count === 0) {
    await run(
      `INSERT INTO admin_settings (id, school_name, cnpj, contact_email, phone, address, active_categories, theme_mode, primary_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'main',
        'Soccer School Clinic',
        '12.345.678/0001-90',
        'contato@soccerschoolclinic.com',
        '(11) 4002-8922',
        'Rua dos Campeões, 140, São Paulo - SP',
        JSON.stringify(['U8', 'U10', 'U12', 'U14', 'U16', 'Sub-18']),
        'light',
        '#10b981',
      ],
    )
  }

  const countStudents = await get(`SELECT COUNT(*) AS count FROM students`)
  if (countStudents.count === 0) {
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s1', 'João Silva', 'U8', 'Ativo', 'Marina Silva', '(11) 99111-2222', 'Time Azul', '92%'],
    )
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s2', 'Pedro Santos', 'U10', 'Ativo', 'Rafael Santos', '(11) 98333-4444', 'Time Laranja', '88%'],
    )
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s3', 'Mateus Rocha', 'U12', 'Inativo', 'Fernanda Rocha', '(11) 97777-6666', 'Time Verde', '74%'],
    )
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s4', 'Gabriel Costa', 'U8', 'Ativo', 'Patricia Costa', '(11) 98888-1111', 'Time Amarelo', '95%'],
    )
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s5', 'Daniel Almeida', 'U10', 'Ativo', 'Vera Almeida', '(11) 98444-2222', 'Time Preto', '90%'],
    )
    await run(
      `INSERT INTO students (id, name, category, status, responsible, contact, team, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['s6', 'Eduardo Nunes', 'U12', 'Ativo', 'Clara Nunes', '(11) 98123-4567', 'Time Rosa', '86%'],
    )
  }

  const countNotes = await get(`SELECT COUNT(*) AS count FROM student_notes`)
  if (countNotes.count === 0) {
    await run(
      `INSERT INTO student_notes (id, student_id, author_id, author_role, author_name, title, category, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['n1', 's1', 'p2', 'psychologist', 'Dr. Lucas Pereira', 'Acompanhamento emocional', 'Psicológica', 'Aluno demonstra confiança crescente durante treinos e melhora na interação com o grupo.'],
    )
    await run(
      `INSERT INTO student_notes (id, student_id, author_id, author_role, author_name, title, category, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['n2', 's2', 'p3', 'nutritionist', 'Dra. Ana Ribeiro', 'Hidratação e alimentação', 'Nutricional', 'Orientações reforçadas sobre hidratação antes e após as sessões.'],
    )
    await run(
      `INSERT INTO student_notes (id, student_id, author_id, author_role, author_name, title, category, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['n3', 's4', 'p4', 'pedagogue', 'Carla Mendes', 'Comportamento coletivo', 'Pedagógica', 'Aluno colabora bem com as dinâmicas de liderança e regras do grupo.'],
    )

    await run(`
      INSERT INTO note_versions (id, note_id, title, content, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)
    `, ['v1', 'n1', 'Acompanhamento emocional', 'Aluno demonstra confiança crescente durante treinos e melhora na interação com o grupo.', 'Dr. Lucas Pereira', new Date().toISOString()])
  }

  const existingProfessionals = await all('SELECT id, password FROM professionals')
  for (const prof of existingProfessionals) {
    const isBcrypt =
      typeof prof.password === 'string' &&
      /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(prof.password)

    if (!isBcrypt) {
      const hashedPassword = await bcrypt.hash(prof.password, 10)
      await run('UPDATE professionals SET password = ? WHERE id = ?', [hashedPassword, prof.id])
    }
  }
}

export { db, all, get, run, initializeDatabase }
