import { useCallback, useMemo, useState } from 'react'

const TOKEN_KEY = 'expense-token'
const USER_KEY = 'expense-user'
const PREVIEW_KEY = 'expense-preview'

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [isPreview, setIsPreview] = useState(() => sessionStorage.getItem(PREVIEW_KEY) === 'true')

  const saveAuth = useCallback((payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    sessionStorage.removeItem(PREVIEW_KEY)
    setToken(payload.token)
    setUser(payload.user)
    setIsPreview(false)
  }, [])

  const startPreview = useCallback((previewUser) => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.setItem(PREVIEW_KEY, 'true')
    setToken(null)
    setUser(previewUser)
    setIsPreview(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(PREVIEW_KEY)
    setToken(null)
    setUser(null)
    setIsPreview(false)
  }, [])

  const updateUser = useCallback((nextUser) => {
    if (isPreview) {
      setUser(nextUser)
      return
    }
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [isPreview])

  return useMemo(
    () => ({ token, user, isPreview, saveAuth, startPreview, updateUser, logout }),
    [isPreview, logout, saveAuth, startPreview, token, updateUser, user],
  )
}
