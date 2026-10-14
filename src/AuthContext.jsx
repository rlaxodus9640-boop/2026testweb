import { useEffect, useState } from 'react'
import { authErrorMessage, supabase } from './supabase.js'
import { AuthContext } from './useAuth.js'
import { roleFromUser } from './roles.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) return
    let active = true
    let revision = 0
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // The initial profile comes from getUser, not a possibly stale cached session.
      if (event === 'INITIAL_SESSION') return
      revision += 1
      if (active) { setUser(session?.user ?? null); setLoading(false) }
    })
    const initialRevision = revision
    supabase.auth.getUser().then(({ data, error: requestError }) => {
      if (!active || revision !== initialRevision) return
      setUser(data.user ?? null)
      setLoading(false)
      if (requestError && requestError.name !== 'AuthSessionMissingError') setError(authErrorMessage(requestError))
    }).catch(requestError => {
      if (active && revision === initialRevision) { setLoading(false); setError(authErrorMessage(requestError)) }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  const role = roleFromUser(user)
  return <AuthContext.Provider value={{ user, loading, error, role, isAdmin: role === 'admin' }}>{children}</AuthContext.Provider>
}

