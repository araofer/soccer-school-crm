import { useEffect, useMemo, useState } from 'react'
import {
  Apple,
  Ban,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleUserRound,
  GraduationCap,
  ImagePlus,
  Mail,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react'

import type {
  AdminSettings,
  AuthUser,
  CreateProfessionalInput,
  Professional,
  Role,
  Student,
  UpdateProfessionalInput,
} from '../types'

import { roleLabels } from '../lib/rbac'

interface AdminConsolePageProps {
  currentUser: AuthUser
  professionals: Professional[]
  students: Student[]
  settings: AdminSettings
  onAddProfessional: (payload: CreateProfessionalInput) => Promise<void>
onUpdateProfessional: (
  professionalId: string,
  payload: UpdateProfessionalInput,
) => Promise<void>
  onDeleteProfessional: (professionalId: string) => Promise<void>
  onUpdateCurrentUser: (payload: Pick<AuthUser, 'name' | 'email'>) => Promise<void>
  onSaveSettings: (payload: AdminSettings) => Promise<void>
}

type ActiveTab = 'profile' | 'users' | 'branding' | 'preferences'

type ProfileDraft = Pick<AuthUser, 'name' | 'email'>

type ProfessionalDraft = {
  name: string
  email: string
  password: string
  role: Role
  specialty: string
  status: 'Ativo' | 'Inativo'
}

const initialCategoryOptions = ['U8', 'U10', 'U12', 'U14', 'U16', 'Sub-18']

const createEmptyProfessionalDraft = (): ProfessionalDraft => ({
  name: '',
  email: '',
  password: '',
  role: 'psychologist',
  specialty: '',
  status: 'Ativo',
})

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SC'

const roleConfig: Record<
  Role,
  {
    label: string
    badgeClass: string
    avatarBg: string
    icon: typeof ShieldCheck
  }
> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm ring-2 ring-emerald-500/20',
    icon: ShieldCheck,
  },
  psychologist: {
    label: 'Psicólogo(a)',
    badgeClass: 'bg-violet-100 text-violet-800 border border-violet-300',
    avatarBg: 'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-sm ring-2 ring-violet-500/20',
    icon: Brain,
  },
  nutritionist: {
    label: 'Nutricionista',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm ring-2 ring-amber-500/20',
    icon: Apple,
  },
  pedagogue: {
    label: 'Pedagogo(a)',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-300',
    avatarBg: 'bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-sm ring-2 ring-sky-500/20',
    icon: GraduationCap,
  },
  coach: {
    label: 'Treinador',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300',
    avatarBg: 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm ring-2 ring-orange-500/20',
    icon: Trophy,
  },
  manager: {
    label: 'Gestor',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    avatarBg: 'bg-gradient-to-br from-indigo-500 to-blue-800 text-white shadow-sm ring-2 ring-indigo-500/20',
    icon: Briefcase,
  },
}

export function AdminConsolePage({
  currentUser,
  professionals,

  students,
  settings,
  onAddProfessional,
  onUpdateProfessional,
  onDeleteProfessional,
  onUpdateCurrentUser,
  onSaveSettings,
}: AdminConsolePageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftUser, setDraftUser] = useState<ProfessionalDraft>(
  createEmptyProfessionalDraft(),
)
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: currentUser.name,
    email: currentUser.email,
  })
  const [branding, setBranding] = useState<AdminSettings>(settings)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [activeCategories, setActiveCategories] = useState<string[]>(settings.activeCategories.length > 0 ? settings.activeCategories : initialCategoryOptions)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(settings.themeMode)
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor)

  useEffect(() => {
    setProfileDraft({ name: currentUser.name, email: currentUser.email })
  }, [currentUser])

  useEffect(() => {
    setBranding(settings)
    setActiveCategories(settings.activeCategories.length > 0 ? settings.activeCategories : initialCategoryOptions)
    setThemeMode(settings.themeMode)
    setPrimaryColor(settings.primaryColor)
  }, [settings])

  const totalActiveAthletes = useMemo(
    () => students.filter((student) => student.status === 'Ativo').length,
    [students],
  )

  const totalActiveUsers = useMemo(
    () => professionals.filter((user) => (user.status ?? 'Ativo') === 'Ativo').length,
    [professionals],
  )

  const openCreateModal = () => {
    setEditingId(null)
    setDraftUser(createEmptyProfessionalDraft())
    setIsModalOpen(true)
  }

  const openEditModal = (row: Professional) => {
  setEditingId(row.id)

  setDraftUser({
    name: row.name,
    email: row.email,
    password: '',
    role: row.role,
    specialty: row.specialty,
    status: row.status ?? 'Ativo',
  })

  setIsModalOpen(true)
}

  const handleSubmitUser = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault()

  const specialty =
    draftUser.specialty.trim() || roleLabels[draftUser.role]

  if (editingId) {
    const payload: UpdateProfessionalInput = {
      name: draftUser.name,
      email: draftUser.email,
      role: draftUser.role,
      specialty,
      status: draftUser.status,
    }

    if (draftUser.password.trim()) {
      payload.password = draftUser.password
    }

    await onUpdateProfessional(editingId, payload)
  } else {
    const payload: CreateProfessionalInput = {
      name: draftUser.name,
      email: draftUser.email,
      password: draftUser.password,
      role: draftUser.role,
      specialty,
      status: draftUser.status,
    }

    await onAddProfessional(payload)
  }

  setDraftUser(createEmptyProfessionalDraft())
  setEditingId(null)
  setIsModalOpen(false)
}

  const toggleUserStatus = async (userId: string) => {
  const currentProfessional = professionals.find(
    (row) => row.id === userId,
  )

  if (!currentProfessional) return

  await onUpdateProfessional(userId, {
    name: currentProfessional.name,
    email: currentProfessional.email,
    role: currentProfessional.role,
    specialty: currentProfessional.specialty,
    status:
      (currentProfessional.status ?? 'Ativo') === 'Ativo'
        ? 'Inativo'
        : 'Ativo',
  })
}
  const removeUserAccess = async (userId: string) => {
    await onDeleteProfessional(userId)
  }

  const toggleCategory = (category: string) => {
    setActiveCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    )
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  const [profileSuccessMessage, setProfileSuccessMessage] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profileDraft.name.trim() || !profileDraft.email.trim()) return
    setIsSavingProfile(true)
    try {
      await onUpdateCurrentUser(profileDraft)
      setProfileSuccessMessage(true)
      setTimeout(() => setProfileSuccessMessage(false), 4000)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveSettings = async () => {
    await onSaveSettings({
      ...settings,
      schoolName: branding.schoolName,
      cnpj: branding.cnpj,
      contactEmail: branding.contactEmail,
      phone: branding.phone,
      address: branding.address,
      activeCategories,
      themeMode,
      primaryColor,
    })
  }

  const tabs: Array<{ key: ActiveTab; label: string; icon: typeof Users }> = [
    { key: 'profile', label: 'Meu Perfil', icon: CircleUserRound },
    { key: 'users', label: 'Gerenciar Equipe', icon: Users },
    { key: 'branding', label: 'Marca', icon: Building2 },
    { key: 'preferences', label: 'Preferências', icon: Settings2 },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Admin Settings & Console</p>
            <h2 className="text-2xl font-semibold text-slate-900">Painel de Controle e Configurações</h2>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Acesso restrito ao perfil Administrador
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${
                  activeTab === tab.key ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Atletas ativos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalActiveAthletes}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Profissionais ativos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalActiveUsers} / {professionals.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Status do sistema</p>
          <p className="mt-2 text-lg font-semibold text-emerald-700">SQLite Local • Conectado 🟢</p>
        </div>
      </section>

      {activeTab === 'profile' ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-md ${(roleConfig[currentUser.role] ?? roleConfig.admin).avatarBg}`}>
                {getInitials(currentUser.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Online
                  </span>
                </div>
                <p className="text-sm text-slate-500">{currentUser.email}</p>
                <div className="mt-1.5">
                  {(() => {
                    const config = roleConfig[currentUser.role] ?? roleConfig.admin
                    const RoleIcon = config.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>

            <hr className="my-5 border-slate-100" />

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccessMessage && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-sm text-emerald-800 border border-emerald-200">

                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Perfil salvo com sucesso! Nome e e-mail atualizados em tempo real no cabeçalho e AuthContext.</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    placeholder="Digite seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  E-mail do Usuário
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    placeholder="Digite seu e-mail"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Salvando...' : 'Salvar Alterações do Perfil'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-base font-bold text-slate-900">Sincronização do Contexto de Autenticação</h4>
              <p className="mt-1 text-sm text-slate-500">
                Todas as alterações no seu perfil são refletidas instantaneamente em toda a aplicação sem a necessidade de recarregar a página.
              </p>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                  <span className="text-slate-600">ID de Usuário</span>
                  <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-200/60 px-2 py-1 rounded-lg">{currentUser.id}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                  <span className="text-slate-600">Nível de Permissão</span>
                  <span className="font-semibold text-emerald-700">{roleLabels[currentUser.role]}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                  <span className="text-slate-600">Estado no Cabeçalho</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sincronizado em tempo real
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Equipe de Profissionais</h3>
                <p className="text-sm text-slate-500">
                  Gerencie acessos, especialidades e cargos dos profissionais cadastrados no sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Plus className="h-4 w-4" />
                Cadastrar Novo Profissional
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 rounded-l-2xl">Profissional</th>
                    <th className="py-3 px-4">Cargo / Nível</th>
                    <th className="py-3 px-4">Especialidade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right rounded-r-2xl">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {professionals.map((row) => {
                    const isCurrentUser = row.id === currentUser.id
                    const statusLabel = row.status ?? 'Ativo'
                    const config = roleConfig[row.role] || roleConfig.psychologist
                    const RoleIcon = config.icon

                    return (
                      <tr key={row.id} className={`hover:bg-slate-50/60 transition ${isCurrentUser ? 'bg-emerald-50/30' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${config.avatarBg}`}>
                              {getInitials(row.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{row.name}</span>
                                {isCurrentUser && (
                                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                                    Você (Admin)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{row.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}>
                            <RoleIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {row.specialty || config.label}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusLabel === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusLabel === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {statusLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              title="Editar profissional"
                              onClick={() => openEditModal(row)}
                              className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title={isCurrentUser ? 'Você não pode bloquear sua própria conta de Administrador' : statusLabel === 'Ativo' ? 'Inativar acesso' : 'Ativar acesso'}
                              onClick={() => toggleUserStatus(row.id)}
                              disabled={isCurrentUser}
                              className="rounded-xl bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-50 transition"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title={isCurrentUser ? 'Você não pode excluir sua própria conta de Administrador' : 'Excluir acesso'}
                              onClick={() => removeUserAccess(row.id)}
                              disabled={isCurrentUser}
                              className="rounded-xl bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-rose-50 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'branding' ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Personalização do Sistema e Marca</h3>
            <div className="mt-4 grid gap-3">
              <input value={branding.schoolName} onChange={(event) => setBranding({ ...branding, schoolName: event.target.value })} placeholder="Nome da Escola / Clube" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input value={branding.cnpj} onChange={(event) => setBranding({ ...branding, cnpj: event.target.value })} placeholder="CNPJ" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input value={branding.contactEmail} onChange={(event) => setBranding({ ...branding, contactEmail: event.target.value })} placeholder="E-mail principal" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input value={branding.phone} onChange={(event) => setBranding({ ...branding, phone: event.target.value })} placeholder="Telefone / WhatsApp" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input value={branding.address} onChange={(event) => setBranding({ ...branding, address: event.target.value })} placeholder="Endereço" className="rounded-2xl border border-slate-200 px-3 py-2" />
            </div>

            <button type="button" onClick={handleSaveSettings} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              Salvar configurações de marca
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Upload de Logo da Escola</h3>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <ImagePlus className="h-6 w-6 text-emerald-600" />
              <span className="mt-2 text-sm font-semibold text-slate-700">Enviar logomarca</span>
              <span className="text-xs text-slate-500">PNG, JPG ou SVG</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Preview</p>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo da escola" className="mt-3 h-28 w-28 rounded-2xl object-cover" />
              ) : (
                <div className="mt-3 flex h-28 w-28 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-semibold text-emerald-700">
                  {branding.schoolName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'preferences' ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Configurações Globais do CRM</h3>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Categorias ativas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {initialCategoryOptions.map((category) => {
                    const isActive = activeCategories.includes(category)

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Tema de cores</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setThemeMode('light')} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${themeMode === 'light' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    Light
                  </button>
                  <button type="button" onClick={() => setThemeMode('dark')} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${themeMode === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Cor primária</label>
                <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="mt-2 h-11 w-20 rounded-xl border border-slate-200 bg-transparent" />
              </div>
            </div>

            <button type="button" onClick={handleSaveSettings} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              Salvar preferências
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Preview do console</h3>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between rounded-2xl p-3" style={{ backgroundColor: primaryColor }}>
                <span className="font-semibold text-white">{branding.schoolName}</span>
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">{themeMode === 'light' ? 'Light' : 'Dark'}</span>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <p>Categorias ativas: {activeCategories.join(', ')}</p>
                <p className="mt-1">Contato: {branding.contactEmail}</p>
                <p className="mt-1">WhatsApp: {branding.phone}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar profissional' : 'Cadastrar Novo Profissional'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="grid gap-3">
              <input value={draftUser.name} onChange={(event) => setDraftUser({ ...draftUser, name: event.target.value })} placeholder="Nome" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input value={draftUser.email} onChange={(event) => setDraftUser({ ...draftUser, email: event.target.value })} placeholder="E-mail" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <input
  type="password"
  value={draftUser.password}
  onChange={(event) =>
    setDraftUser({
      ...draftUser,
      password: event.target.value,
    })
  }
  placeholder={
    editingId
      ? 'Nova senha (opcional)'
      : 'Senha temporária'
  }
  required={!editingId}
  autoComplete="new-password"
  className="rounded-2xl border border-slate-200 px-3 py-2"
/>
              <input value={draftUser.specialty} onChange={(event) => setDraftUser({ ...draftUser, specialty: event.target.value })} placeholder="Especialidade / Cargo" className="rounded-2xl border border-slate-200 px-3 py-2" />
              <select value={draftUser.role} onChange={(event) => setDraftUser({ ...draftUser, role: event.target.value as Role })} className="rounded-2xl border border-slate-200 px-3 py-2">
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">
                <Save className="h-4 w-4" />
                {editingId ? 'Salvar alterações' : 'Cadastrar usuário'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
