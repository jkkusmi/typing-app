import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  apiLogin,
  apiRegister,
  clearToken,
  decodeToken,
  isTokenAlive,
  loadToken,
  saveToken,
  type LoginRequest,
  type RegisterRequest,
  type TokenPayload,
} from '../api/api'

export type { LoginRequest, RegisterRequest }

export interface AuthUser {
  user_id: number
  username: string
}

export interface AuthValue {
  user: AuthUser | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const Auth = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(Auth)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

function userFromToken(token: string): AuthUser | null {
  if (!isTokenAlive(token)) return null
  const payload: TokenPayload | null = decodeToken(token)
  if (!payload) return null
  return { user_id: payload.user_id, username: payload.username }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = loadToken()
    return token ? userFromToken(token) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = loadToken()
    if (token && !isTokenAlive(token)) {
      clearToken()
      setUser(null)
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true)
    try {
      const { access_token } = await apiLogin(data)
      saveToken(access_token)
      setUser(userFromToken(access_token))
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true)
    try {
      await apiRegister(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <Auth.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Auth.Provider>
  )
}
