export interface RegisterRequest {
  username: string
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface TokenPayload {
  user_id: number
  username: string
  exp: number
}

export interface ScoreEntry {
  id: number
  username: string
  wpm: number
  score: number
  game_type: string
  text_type: string
  language: string
  achieved_at: string
}

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'access_token'

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const part = token.split('.')[1]
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as TokenPayload
  } catch {
    return null
  }
}

export function isTokenAlive(token: string): boolean {
  const payload = decodeToken(token)
  return payload !== null && payload.exp * 1000 > Date.now()
}

async function apiFetch<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (withAuth) {
    const token = loadToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new Error('Could not reach the server.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }))
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ')
      : (body.detail ?? response.statusText)
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export async function apiRegister(data: RegisterRequest): Promise<{ message: string; user_id: number }> {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiLogin(data: LoginRequest): Promise<AuthToken> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiGetTopScores(limit = 50): Promise<ScoreEntry[]> {
  try {
    return await apiFetch<ScoreEntry[]>(`/scores/top?limit=${limit}`)
  } catch {
    return []
  }
}
