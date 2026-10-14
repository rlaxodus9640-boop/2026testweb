import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import Avatar from './Avatar.jsx'
import { avatarOptions, profileFromUser, randomAvatar, saveProfile } from './avatar.js'
import { authErrorMessage, supabase } from './supabase.js'
import { roleFromUser } from './roles.js'

const fieldNames = { character: '캐릭터', color: '캐릭터 색', background: '배경', expression: '표정', accessory: '액세서리' }

function ProfileEditor({ user }) {
  const [saved, setSaved] = useState(() => profileFromUser(user))
  const [draft, setDraft] = useState(() => profileFromUser(user))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const changed = JSON.stringify(draft) !== JSON.stringify(saved)
  useEffect(() => {
    if (!changed) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [changed])
  function update(field, value) {
    setMessage('')
    setDraft(current => field === 'full_name' ? { ...current, full_name: value } : { ...current, avatar_config: { ...current.avatar_config, [field]: value } })
  }
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      const stored = await saveProfile(supabase, user.id, draft)
      setSaved(stored)
      setDraft(stored)
      setMessage('프로필을 저장했습니다. 상단 아바타에도 반영되었습니다.')
    } catch (error) {
      setFailed(true)
      setMessage(error.code || error.name !== 'Error' ? authErrorMessage(error) : error.message)
    } finally { setBusy(false) }
  }
  return <><section className="page-intro"><span className="eyebrow">MY LITTLE CORNER</span><h1>나를 닮은, 작은 발견.</h1><p>이름과 캐릭터를 꾸미고 나만의 프로필을 완성하세요.</p></section>
    <form className="profile-layout" onSubmit={save} aria-busy={busy}>
      <aside className="avatar-preview"><span className="eyebrow">AVATAR PREVIEW</span><Avatar config={draft.avatar_config} label="저장 전 아바타 미리보기" /><h2>{draft.full_name.trim() || '나의 캐릭터'}</h2><p>{changed ? '미리보기 · 아직 저장하지 않았어요' : '현재 프로필'}</p><div className="saved-avatar"><Avatar config={saved.avatar_config} label="현재 저장된 아바타" /><span>저장된 프로필<br /><strong>{saved.full_name || '이름을 설정해 주세요'}</strong></span></div></aside>
      <div className="profile-controls"><fieldset className="auth-fields contact-form" disabled={busy}><legend>프로필 편집</legend>
        <label>이름<input name="full_name" required maxLength={50} pattern={'.*\\S.*'} value={draft.full_name} onChange={event => update('full_name', event.target.value)} autoComplete="name" /></label>
        <div className="profile-email"><span>이메일</span><p>{user.email}</p><small>가입한 이메일은 이 화면에서 변경할 수 없습니다.</small></div>
        <div className="profile-email"><span>계정 역할</span><p>{roleFromUser(user) === 'admin' ? '관리자 (admin)' : '일반 회원 (user)'}</p><small>계정 역할은 관리자만 변경할 수 있습니다.</small></div>
        <div className="avatar-editor-heading"><h2>캐릭터 만들기</h2><button className="secondary" type="button" onClick={() => { setDraft(current => ({ ...current, avatar_config: randomAvatar() })); setMessage('') }}>랜덤 생성 ↻</button></div>
        {Object.entries(avatarOptions).map(([field, options]) => <fieldset className="avatar-options" key={field}><legend>{fieldNames[field]}</legend><div>{options.map(([value, label]) => <button type="button" key={value} className={draft.avatar_config[field] === value ? 'selected' : ''} aria-pressed={draft.avatar_config[field] === value} onClick={() => update(field, value)}>{label}</button>)}</div></fieldset>)}
        <p className="field-help">캐릭터는 브라우저에서 생성합니다. 저장을 누르면 이름과 모든 캐릭터 설정이 계정 프로필에 저장됩니다.</p>
        <div className="profile-actions"><button type="submit" className="primary" disabled={busy}>{busy ? '저장 중…' : '프로필 저장하기'} <span>↗</span></button><button type="button" className="secondary" disabled={!changed || busy} onClick={() => { setDraft(saved); setMessage('') }}>변경 취소</button></div>
      </fieldset><p className={`form-status ${failed ? 'field-error' : ''}`} role="status">{message}</p></div>
    </form></>
}

export default function MyPage() {
  const { user, loading, error } = useAuth()
  if (loading) return <div className="empty" role="status">프로필을 확인하고 있습니다…</div>
  if (!user) return <section className="page-intro"><span className="eyebrow">MY PAGE</span><h1>먼저 로그인해 주세요.</h1><p>{error || '로그인하면 나의 프로필과 아바타를 꾸밀 수 있습니다.'}</p><a className="text-link" href="/login">로그인하러 가기 →</a></section>
  return <ProfileEditor key={user.id} user={user} />
}
