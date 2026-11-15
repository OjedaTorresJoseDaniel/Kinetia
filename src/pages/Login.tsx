import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowRight, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { IMG_LOGIN } from '../data/mock'
import { Button, Field, IconButton, Input } from '../components/ui'
import Logo from '../components/Logo'
import { cn, nombreCorto } from '../lib/format'
import { rolDe } from '../types'
import { rolLabel } from '../nav'

export default function Login() {
  const { user, login } = useAuth()
  const { empleados } = useData()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [num, setNum] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const demos = empleados.rows.filter((e) => e.Estatus_Emp && [1001, 2001].includes(e.Num_Emp))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const r = login(Number(num), clave)
      setLoading(false)
      if (r.ok) navigate('/', { replace: true })
      else setError(r.error)
    }, 400)
  }

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col px-6 py-8 sm:px-14">
        <div className="flex items-center justify-between">
          <Logo />
          <IconButton label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} onClick={toggle}>{theme === 'dark' ? <Sun /> : <Moon />}</IconButton>
        </div>

        <div className="mx-auto my-auto w-full max-w-[380px] py-12">
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em]">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-muted">Ingresa con tu número de empleado y clave de acceso.</p>

          <form onSubmit={onSubmit} className="mt-9 flex flex-col gap-5">
            <Field label="Número de empleado">
              <Input inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ''))} placeholder="Ej. 1001" autoComplete="username" className="h-11" />
            </Field>
            <Field label="Clave">
              <span className="relative block">
                <Input type={ver ? 'text' : 'password'} maxLength={15} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="h-11 pr-11" />
                <button type="button" onClick={() => setVer(!ver)} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:text-fg" aria-label={ver ? 'Ocultar clave' : 'Mostrar clave'}>
                  {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </Field>

            {error && <p className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

            <Button type="submit" size="lg" className="mt-1" disabled={loading || !num || !clave}>
              {loading ? 'Verificando…' : 'Iniciar sesión'}
              {!loading && <ArrowRight />}
            </Button>
          </form>

          <div className="mt-10">
            <p className="mb-3 text-xs font-semibold text-subtle">Cuentas de demostración</p>
            <div className="grid gap-2">
              {demos.map((e) => {
                const activo = num === String(e.Num_Emp)
                return (
                  <button
                    key={e.id_Emp}
                    type="button"
                    onClick={() => {
                      setNum(String(e.Num_Emp))
                      setClave(e.Clave)
                      setError('')
                    }}
                    className={cn('flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors', activo ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong')}
                  >
                    <span>
                      <span className="block text-[13px] font-bold">{rolLabel[rolDe(e)]}</span>
                      <span className="block text-xs text-muted">{nombreCorto(e)}</span>
                    </span>
                    <span className="tabular text-xs font-semibold text-muted">
                      #{e.Num_Emp} · {e.Clave}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <p className="text-xs text-subtle">Entorno de demostración · datos simulados</p>
      </section>

      <section className="relative hidden overflow-hidden lg:block">
        <img src={IMG_LOGIN} alt="Fisioterapeuta evaluando la pierna de un paciente" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white">
          <span className="inline-block h-1 w-10 rounded-full bg-[var(--accent)]" />
          <p className="mt-6 max-w-lg text-[28px] font-semibold leading-snug tracking-tight">Diagnóstico, tratamiento y seguimiento del paciente en un solo expediente.</p>
          <p className="mt-4 text-sm text-white/65">Lesiones, escala de dolor, radiografías, músculos afectados y plan de ejercicios.</p>
        </div>
      </section>
    </div>
  )
}
