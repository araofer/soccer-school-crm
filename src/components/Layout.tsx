import { useState, type ReactNode } from 'react'
import { Bell, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navigationByRole, roleLabels } from '../lib/rbac'
import type { AdminSettings, AuthUser, Professional } from '../types'

interface LayoutProps {
  user: AuthUser
  professionals: Professional[]
  settings: AdminSettings
  onLogout: () => void
  children: ReactNode
}

export function Layout({ user, professionals, settings, onLogout, children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isDarkTheme = settings.themeMode === 'dark'

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: isDarkTheme ? '#0f172a' : '#f1f5f9',
        color: isDarkTheme ? '#f8fafc' : '#0f172a',
      }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: settings.primaryColor }}> {settings.schoolName}</p>
            <h1 className="text-xl font-semibold" style={{ color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>Olá, {user.name}</h1>
          </div>

          <nav aria-label="Navegação principal" className="hidden items-center gap-3 md:flex">
            {navigationByRole[user.role].map((shortcut) => {
              const isActive = location.pathname === shortcut.href

              return (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="rounded-full border px-3 py-2 text-sm font-semibold transition"
                  style={
                    isActive
                      ? {
                          borderColor: settings.primaryColor,
                          backgroundColor: settings.primaryColor,
                          color: '#ffffff',
                          boxShadow: `0 6px 20px ${settings.primaryColor}33`,
                        }
                      : {
                          borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1',
                          backgroundColor: isDarkTheme ? '#1e293b' : '#f1f5f9',
                          color: isDarkTheme ? '#e2e8f0' : '#334155',
                        }
                  }
                >
                  {shortcut.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="rounded-full border p-2 md:hidden"
              style={{
                borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1',
                color: isDarkTheme ? '#e2e8f0' : '#475569',
              }}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="rounded-full border p-2"
              style={{
                borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1',
                color: isDarkTheme ? '#e2e8f0' : '#475569',
              }}
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border p-2"
              style={{
                borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1',
                color: isDarkTheme ? '#e2e8f0' : '#475569',
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div
          className="border-b md:hidden"
          style={{
            backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff',
            borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0',
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6">
            {navigationByRole[user.role].map((shortcut) => {
              const isActive = location.pathname === shortcut.href

              return (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  onClick={closeMobileMenu}
                  className="rounded-2xl px-3 py-2 text-sm font-semibold"
                  style={
                    isActive
                      ? {
                          backgroundColor: settings.primaryColor,
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: isDarkTheme ? '#1e293b' : '#f1f5f9',
                          color: isDarkTheme ? '#e2e8f0' : '#334155',
                        }
                  }
                >
                  {shortcut.label}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            className="rounded-3xl p-6 text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}bb)` }}
          >
            <p className="text-sm font-medium text-white/90">Painel de operação</p>
            <h2 className="mt-2 text-2xl font-semibold">{settings.schoolName}</h2>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Centralize informações de alunos, profissionais e anotações em um dashboard limpo e responsivo.
            </p>
          </div>

          <div
            className="rounded-3xl border p-4 shadow-sm"
            style={{
              backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
              borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: isDarkTheme ? '#cbd5e1' : '#64748b' }}>Perfil ativo</p>
                <p className="text-lg font-semibold" style={{ color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>{user.name}</p>
              </div>
              <ShieldCheck className="h-6 w-6" style={{ color: settings.primaryColor }} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl px-3 py-2 text-sm" style={{ backgroundColor: isDarkTheme ? '#1f2937' : '#f8fafc' }}>
              <span style={{ color: isDarkTheme ? '#cbd5e1' : '#64748b' }}>Profissionais cadastrados</span>
              <span className="font-semibold" style={{ color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>{professionals.length}</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl px-3 py-2 text-sm" style={{ backgroundColor: isDarkTheme ? '#1f2937' : '#f8fafc' }}>
              <span style={{ color: isDarkTheme ? '#cbd5e1' : '#64748b' }}>Acesso permitido</span>
              <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${settings.primaryColor}22`, color: settings.primaryColor }}>{roleLabels[user.role]}</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl px-3 py-2 text-sm" style={{ backgroundColor: isDarkTheme ? '#1f2937' : '#f8fafc' }}>
              <span style={{ color: isDarkTheme ? '#cbd5e1' : '#64748b' }}>Acessos por role</span>
              <Users className="h-4 w-4" style={{ color: isDarkTheme ? '#e2e8f0' : '#334155' }} />
            </div>
          </div>
        </div>

        <div>{children}</div>
      </main>
    </div>
  )
}
