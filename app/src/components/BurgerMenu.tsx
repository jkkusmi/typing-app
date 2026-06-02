import { useState } from 'react'
import './burger-menu.css'

type ActiveView = 'game' | 'leaderboard'
type AuthTab = 'login' | 'register'

type Props = {
  activeView: ActiveView
  onNavigate: (view: ActiveView) => void
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function handleSubmit() {
    if (!form.email || !form.password) {
      setStatus({ type: 'error', msg: 'Please fill in all fields' })
      return
    }
    // Demo mode: no API call
    setStatus({ type: 'success', msg: 'Signed in! (demo mode)' })
  }

  return (
    <div className="auth-form">
      {status && (
        <p className={`auth-message auth-message--${status.type}`}>{status.msg}</p>
      )}
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-email">Email</label>
        <input
          id="login-email" className="auth-input" type="email"
          placeholder="you@example.com" autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-password">Password</label>
        <input
          id="login-password" className="auth-input" type="password"
          placeholder="••••••••" autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
      </div>
      <button type="button" className="auth-submit" onClick={handleSubmit}>
        Sign in
      </button>
      <p className="auth-footer">
        No account?{' '}
        <button type="button" className="auth-footer-link" onClick={onSwitch}>
          Create one
        </button>
      </p>
    </div>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', email: '', password: '', confirm: '',
  })
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function field(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function handleSubmit() {
    if (!form.username || !form.first_name || !form.last_name || !form.email || !form.password) {
      setStatus({ type: 'error', msg: 'Please fill in all fields' })
      return
    }
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', msg: 'Passwords do not match' })
      return
    }
    // Demo mode: no API call
    setStatus({ type: 'success', msg: 'Account created! (demo mode)' })
  }

  return (
    <div className="auth-form">
      {status && (
        <p className={`auth-message auth-message--${status.type}`}>{status.msg}</p>
      )}
      <div className="auth-row">
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-first">First name</label>
          <input id="reg-first" className="auth-input" type="text"
            placeholder="Ada" autoComplete="given-name"
            value={form.first_name} onChange={field('first_name')} />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-last">Last name</label>
          <input id="reg-last" className="auth-input" type="text"
            placeholder="Lovelace" autoComplete="family-name"
            value={form.last_name} onChange={field('last_name')} />
        </div>
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-username">Username</label>
        <input id="reg-username" className="auth-input" type="text"
          placeholder="speedtyper" autoComplete="username"
          value={form.username} onChange={field('username')} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-email">Email</label>
        <input id="reg-email" className="auth-input" type="email"
          placeholder="you@example.com" autoComplete="email"
          value={form.email} onChange={field('email')} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-password">Password</label>
        <input id="reg-password" className="auth-input" type="password"
          placeholder="••••••••" autoComplete="new-password"
          value={form.password} onChange={field('password')} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
        <input id="reg-confirm" className="auth-input" type="password"
          placeholder="••••••••" autoComplete="new-password"
          value={form.confirm} onChange={field('confirm')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }} />
      </div>
      <button type="button" className="auth-submit" onClick={handleSubmit}>
        Create account
      </button>
      <p className="auth-footer">
        Already have one?{' '}
        <button type="button" className="auth-footer-link" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </div>
  )
}

function AuthSection() {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<AuthTab>('login')

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
      {/* Backdrop */}
      <div
        className="burger-overlay"
        data-open={open}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Floating hamburger — hidden while drawer is open to prevent overlap */}
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

      {/* Drawer */}
      <div
        id="burger-drawer"
        className="burger-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
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
              className="burger-nav-link"
              data-active={activeView === 'game'}
              onClick={() => navigate('game')}
            >
              Game
            </button>
          </li>

          <li className="burger-nav-item">
            <button
              type="button"
              className="burger-nav-link"
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
