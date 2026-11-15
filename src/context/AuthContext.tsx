import { createContext, useContext, useState, type ReactNode } from 'react'
import { useData } from './DataContext'
import { rolDe, type Empleado, type Rol } from '../types'

interface AuthCtx {
  user: Empleado | null
  rol: Rol | null
  login: (numEmp: number, clave: string) => { ok: true; user: Empleado } | { ok: false; error: string }
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)
const KEY = 'kinetia-emp'

/** Autenticación simulada contra Persona.Empleados (Num_Emp + Clave, Estatus_Emp activo). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { empleados } = useData()
  const [id, setId] = useState<number | null>(() => Number(sessionStorage.getItem(KEY)) || null)
  const user = empleados.rows.find((e) => e.id_Emp === id) ?? null

  const login: AuthCtx['login'] = (numEmp, clave) => {
    const e = empleados.rows.find((x) => x.Num_Emp === numEmp)
    if (!e || e.Clave !== clave) return { ok: false, error: 'Número de empleado o clave incorrectos.' }
    if (!e.Estatus_Emp) return { ok: false, error: 'Este empleado está dado de baja. Contacta a administración.' }
    sessionStorage.setItem(KEY, String(e.id_Emp))
    setId(e.id_Emp)
    return { ok: true, user: e }
  }

  const logout = () => {
    sessionStorage.removeItem(KEY)
    setId(null)
  }

  return <Ctx.Provider value={{ user, rol: user ? rolDe(user) : null, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
