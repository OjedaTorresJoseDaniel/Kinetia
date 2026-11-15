import { useData } from '../context/DataContext'

/** Resumen de un diagnóstico: lesiones (DetalleDiag) y valor máximo en la escala de dolor. */
export function useResumenDiag() {
  const { detalleDiag, getLesion, getEscala } = useData()
  return (id_Diag: number) => {
    const det = detalleDiag.rows.filter((d) => d.id_Diag === id_Diag)
    return {
      lesiones: det.map((d) => getLesion(d.id_Lesion)?.Nom_Les ?? '—'),
      principal: getLesion(det.find((d) => d.Tipo_Diag)?.id_Lesion ?? det[0]?.id_Lesion ?? 0)?.Nom_Les ?? 'Sin lesión registrada',
      dolor: Math.max(0, ...det.map((d) => Number(getEscala(d.id_EscalaDolor)?.Valor_Escala ?? 0))),
    }
  }
}
