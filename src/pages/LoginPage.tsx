import { useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('admin@clinic.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Credenciais inválidas.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-4xl bg-white shadow-xl lg:grid-cols-[1fr_0.95fr]">
        <section className="bg-linear-to-br from-emerald-700 via-emerald-600 to-cyan-500 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-100">Soccer School Clinic</p>
          <h1 className="mt-4 text-4xl font-semibold">CRM com visual clean e gestão multidisciplinar.</h1>
          <p className="mt-4 max-w-md text-sm text-emerald-50">
            Acesse o dashboard com perfis de administrador, psicólogo, nutricionista e pedagogo para visualizar o que cada papel precisa.
          </p>
          <div className="mt-8 space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" /> Perfis habilitados</p>
            <ul className="text-sm text-emerald-50">
              <li>• Administrador</li>
              <li>• Psicólogo</li>
              <li>• Nutricionista</li>
              <li>• Pedagogo</li>
            </ul>
          </div>
        </section>

        <section className="p-8">
          <div className="mb-6">
            <p className="text-sm text-slate-500">Acesso ao sistema</p>
            <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">E-mail</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Senha</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500" />
            </label>

            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
              <LockKeyhole className="h-4 w-4" />
              {isLoading ? 'Entrando...' : 'Entrar no CRM'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Credenciais de demonstração</p>
            <p>admin@clinic.com / admin123</p>
            <p>psicologo@clinic.com / psico123</p>
            <p>nutri@clinic.com / nutri123</p>
            <p>pedagogo@clinic.com / peda123</p>
          </div>
        </section>
      </div>
    </div>
  )
}
