import { useState } from 'react'
import { useAuth, type LoginRequest, type RegisterRequest } from '../auth/auth'
import './burgermenu.css'

type ActiveView = 'game' | 'leaderboard'
type AuthTab = 'login' | 'register'

interface Props {
  activeView: ActiveView
  onNavigate: (view: ActiveView) => void
}

type Status = { type: 'success' | 'error'; msg: string }

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  onChange,
  onKeyDown,
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  autoComplete: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="auth-input"
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

function StatusMessage({ status }: { status: Status }) {
  return (
    <p className={`auth-message auth-message--${status.type}`} role="status">
      {status.msg}
    </p>
  )
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, loading } = useAuth()
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })
  const [status, setStatus] = useState<Status | null>(null)

  function set(key: keyof LoginRequest) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      setStatus({ type: 'error', msg: 'Please fill in all fields.' })
      return
    }
    setStatus(null)
    try {
      await login(form)
      setStatus({ type: 'success', msg: 'Signed in!' })
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message ?? 'Login failed.' })
    }
  }

  return (
    <div className="auth-form">
      {status && <StatusMessage status={status} />}
      <Field id="login-email" label="Email" type="email"
        placeholder="you@example.com" autoComplete="email"
        value={form.email} onChange={set('email')} />
      <Field id="login-password" label="Password" type="password"
        placeholder="••••••••" autoComplete="current-password"
        value={form.password} onChange={set('password')}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }} />
      <button type="button" className="auth-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="auth-footer">
        No account?{' '}
        <button type="button" className="auth-footer-link" onClick={onSwitch}>Create one</button>
      </p>
    </div>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, loading } = useAuth()
  const [form, setForm] = useState<RegisterRequest & { confirm: string }>({
    username: '', first_name: '', last_name: '', email: '', password: '', confirm: '',
  })
  const [status, setStatus] = useState<Status | null>(null)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit() {
    const { confirm, ...payload } = form
    if (Object.values(payload).some((v) => !v)) {
      setStatus({ type: 'error', msg: 'Please fill in all fields.' })
      return
    }
    if (form.password !== confirm) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    setStatus(null)
    try {
      await register(payload)
      setStatus({ type: 'success', msg: 'Account created! You can now sign in.' })
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message ?? 'Registration failed.' })
    }
  }

  return (
    <div className="auth-form">
      {status && <StatusMessage status={status} />}
      <div className="auth-row">
        <Field id="reg-first" label="First name" placeholder="Charles"
          autoComplete="given-name" value={form.first_name} onChange={set('first_name')} />
        <Field id="reg-last" label="Last name" placeholder="Leclerc"
          autoComplete="family-name" value={form.last_name} onChange={set('last_name')} />
      </div>
      <Field id="reg-username" label="Username" placeholder="klawiatura"
        autoComplete="username" value={form.username} onChange={set('username')} />
      <Field id="reg-email" label="Email" type="email" placeholder="you@example.com"
        autoComplete="email" value={form.email} onChange={set('email')} />
      <Field id="reg-password" label="Password" type="password" placeholder="••••••••"
        autoComplete="new-password" value={form.password} onChange={set('password')} />
      <Field id="reg-confirm" label="Confirm password" type="password" placeholder="••••••••"
        autoComplete="new-password" value={form.confirm} onChange={set('confirm')}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }} />
      <button type="button" className="auth-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating…' : 'Create account'}
      </button>
      <p className="auth-footer">
        Already have one?{' '}
        <button type="button" className="auth-footer-link" onClick={onSwitch}>Sign in</button>
      </p>
    </div>
  )
}

function AuthSection() {
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<AuthTab>('login')

  if (user) {
    return (
      <li className="burger-nav-item">
        <div className="burger-logged-in">
          <span className="burger-logged-in-name">{user.username}</span>
          <button type="button" className="burger-logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="burger-nav-item">
      <button
        type="button"
        className="burger-nav-btn"
        data-active={expanded}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>Login / Register</span>
        <span className="nav-chevron" data-open={expanded} aria-hidden="true">▾</span>
      </button>
      <div className="burger-sub-panel" data-open={expanded} aria-hidden={!expanded}>
        <div className="burger-sub-body">
          <div className="auth-tabs" role="tablist" aria-label="Auth options">
            <button type="button" role="tab" className="auth-tab"
              data-active={tab === 'login'} aria-selected={tab === 'login'}
              onClick={() => setTab('login')}>
              Sign in
            </button>
            <button type="button" role="tab" className="auth-tab"
              data-active={tab === 'register'} aria-selected={tab === 'register'}
              onClick={() => setTab('register')}>
              Register
            </button>
          </div>
          {tab === 'login'
            ? <LoginForm onSwitch={() => setTab('register')} />
            : <RegisterForm onSwitch={() => setTab('login')} />}
        </div>
      </div>
    </li>
  )
}

export default function BurgerMenu({ activeView, onNavigate }: Props) {
  const [open, setOpen] = useState(false)

  function navigate(view: ActiveView) {
    onNavigate(view)
    setOpen(false)
  }

  return (
    <>
      <div 
      className="burger-overlay" 
      data-open={open} 
      aria-hidden="true" 
      onClick={() => setOpen(false)} 
      />

      <div className="burger-toggle-wrap" data-hidden={open}>
        <button
          type="button"
          className="burger-toggle"
          aria-label="Open menu"
          aria-expanded={false}
          aria-controls="burger-drawer"
          onClick={() => setOpen(true)}
        >
          <span className="burger-bar" />
          <span className="burger-bar" />
          <span className="burger-bar" />
        </button>
      </div>

      <div
        id="burger-drawer"
        className="burger-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="burger-drawer-header">
          <span className="burger-drawer-title">Menu</span>
          <button 
          type="button" 
          className="drawer-close" 
          aria-label="Close menu" 
          onClick={() => setOpen(false)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <ul className="burger-nav-list" role="list">
          <AuthSection />
          <li className="burger-nav-item">
            <button 
            type="button" 
            className="burger-nav-btn" 
            data-active={activeView === 'game'} 
            onClick={() => navigate('game')}
            >
              Game
            </button>
          </li>
          <li className="burger-nav-item">
            <button 
            type="button" 
            className="burger-nav-btn" 
            data-active={activeView === 'leaderboard'} 
            onClick={() => navigate('leaderboard')}
            >
              Leaderboard
            </button>
          </li>
        </ul>
      </div>
    </>
  )
}
