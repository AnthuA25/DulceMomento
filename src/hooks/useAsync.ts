import { useCallback, useEffect, useState } from 'react'

/** Carga datos asíncronos con estados de carga y error, y permite recargarlos. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    load()
      .then((result) => {
        if (!active) return
        setData(result)
        setError('')
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload }
}
