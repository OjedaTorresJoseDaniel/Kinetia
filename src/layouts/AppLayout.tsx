import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { navGroups, rolLabel } from '../nav'
import { cn, formatLongDate, iniciales, nombreCorto, todayISO } from '../lib/format'
import { Avatar, IconButton } from '../components/ui'
import Logo from '../components/Logo'

export default function AppLayout() {
  const { user, rol, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  if (!user || !rol) return <Navigate to="/login" replace />

  // La agenda ocupa todo el ancho y alto disponibles, como un calendario de reservas.
  const fullBleed = location.pathname.startsWith('/agenda')
  const groups = navGroups.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(rol)) })).filter((g) => g.items.length)

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/pacientes?q=${encodeURIComponent(q.trim())}`)
    setQ('')
  }

  const sidebar = (
    <aside className="flex h-full w-[248px] flex-col border-r border-line bg-surface">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Logo />
        <IconButton label="Cerrar menú" className="lg:hidden" onClick={() => setOpen(false)}><X /></IconButton>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{g.label}</p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold transition-colors',
                        isActive ? 'bg-surface-3 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
                        <Icon className={cn('size-[17px]', isActive && 'text-accent')} strokeWidth={2} />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar text={iniciales(user)} size="sm" tone="accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{nombreCorto(user)}</p>
            <p className="truncate text-xs text-muted">{rolLabel[rol]}</p>
          </div>
          <IconButton label="Cerrar sesión" onClick={logout} className="size-8"><LogOut className="!size-4" /></IconButton>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen lg:pl-[248px]">
      <div className="no-print fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-fit">{sidebar}</div>
        </div>
      )}

      <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-8">
        <IconButton label="Abrir menú" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></IconButton>
        <form onSubmit={onSearch} className="relative hidden w-full max-w-xs sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar paciente…"
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] placeholder:text-subtle focus:border-accent focus:outline-none"
          />
        </form>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden pr-3 text-[13px] font-medium text-muted md:inline">{formatLongDate(todayISO())}</span>
          <IconButton label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} onClick={toggle}>{theme === 'dark' ? <Sun /> : <Moon />}</IconButton>
        </div>
      </header>

      <main className={fullBleed ? '' : 'mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-8 sm:pt-10'}>
        <Outlet />
      </main>
    </div>
  )
}
