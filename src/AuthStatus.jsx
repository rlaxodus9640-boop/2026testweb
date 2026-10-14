import { useState } from 'react'
import { authErrorMessage, supabase } from './supabase.js'
import { useAuth } from './useAuth.js'
import Avatar from './Avatar.jsx'
import { profileFromUser } from './avatar.js'

export default function AuthStatus() {
  const { user, loading, error } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function logout() {
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setMessage('로그아웃했습니다.')
    } catch (error) { setMessage(authErrorMessage(error)) }
    finally { setBusy(false) }
  }
  const profile = profileFromUser(user)
  return <div className="account-menu" aria-label="회원 메뉴">{loading ? <span role="status">로그인 확인 중…</span> : user ? <><button type="button" onClick={logout} disabled={busy}>{busy ? '로그아웃 중…' : '로그아웃'}</button><a className="my-page-link" href="/mypage" aria-current={window.location.pathname === '/mypage' ? 'page' : undefined}><Avatar config={profile.avatar_config} label={`${profile.full_name || '회원'}의 아바타`} />마이페이지</a></> : <><a href="/login" aria-current={window.location.pathname === '/login' ? 'page' : undefined}>로그인</a><a href="/signup" aria-current={window.location.pathname === '/signup' ? 'page' : undefined}>회원가입</a></>}<span className="account-message" role="status">{message || error}</span></div>
}
