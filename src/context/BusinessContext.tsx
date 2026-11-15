import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface BusinessIdentity { nombre: string; lema: string; logo: string; reportImage: string; logoScale: number }
const KEY = 'kinetia-business-v1'
export const defaultBusiness: BusinessIdentity = { nombre: 'Kinetia', lema: '', logo: '', reportImage: '', logoScale: 1 }
export function readBusiness(): BusinessIdentity {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (value && typeof value.nombre === 'string' && value.nombre.trim() && typeof value.lema === 'string' && typeof value.logo === 'string') {
      return { nombre: value.nombre.slice(0,80), lema: value.lema.slice(0,160), logo: /^data:image\/(png|jpeg|webp);base64,/.test(value.logo) ? value.logo : '', reportImage: typeof value.reportImage === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(value.reportImage) ? value.reportImage : '', logoScale: Number.isFinite(value.logoScale) ? Math.max(1, Math.min(3, value.logoScale)) : 1 }
    }
  } catch { /* Use defaults if storage is unavailable or damaged. */ }
  return defaultBusiness
}
const Context = createContext<{ business: BusinessIdentity; save: (value: BusinessIdentity) => void } | null>(null)
export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState(readBusiness)
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) setBusiness(readBusiness()) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  useEffect(() => { document.title = `${business.nombre} · Fisioterapia` }, [business.nombre])
  const save = (value: BusinessIdentity) => {
    const next = { ...value, nombre: value.nombre.trim(), lema: value.lema.trim() }
    if (!next.nombre) throw new Error('Escribe el nombre del negocio.')
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { throw new Error('No se pudo guardar. Prueba una imagen más pequeña o habilita el almacenamiento del navegador.') }
    setBusiness(next)
  }
  return <Context.Provider value={{business, save}}>{children}</Context.Provider>
}
export function useBusiness() {
  const value = useContext(Context)
  if (!value) throw new Error('BusinessProvider requerido')
  return value
}
