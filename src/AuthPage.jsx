import { useState } from 'react'
import { authErrorMessage, supabase } from './supabase.js'

export default function AuthPage({ signup = false }) {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    if (signup && form.elements.password.value !== form.elements.confirm.value) {
      setMismatch(true)
      form.elements.confirm.focus()
      return
    }
    setMismatch(false)
    setFailed(false)
    setStatus('')
    if (!supabase) { setFailed(true); setStatus('인증 서버 설정이 없습니다. 관리자에게 문의해 주세요.'); return }
    setPending(true)
    const email = form.elements.email.value.trim()
    const password = form.elements.password.value
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: new URL('/login', window.location.origin).href,
            data: { full_name: form.elements.name.value.trim(), demo_notice_acknowledged: form.elements.agreement.checked },
          },
        })
        if (error) throw error
        setStatus(data.session ? '회원가입과 로그인이 완료되었습니다.' : '가입 요청을 처리했습니다. 이메일로 인증 안내가 도착하면 인증을 완료한 후 로그인해 주세요. 이미 가입했다면 로그인 화면을 이용해 주세요.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (!data.session) throw new Error('Missing session')
        window.location.replace('/')
      }
      form.reset()
      setVisible(false)
    } catch (error) { setFailed(true); setStatus(authErrorMessage(error)) }
    finally {
      form.elements.password.value = ''
      if (signup) form.elements.confirm.value = ''
      setPending(false)
    }
  }
  return <section className="auth-layout">
    <div className="auth-story"><span className="eyebrow">{signup ? 'YOUR NEXT DISCOVERY' : 'WELCOME BACK'}</span><h1>{signup ? <>새로운 발견의 시작,<br />가까이에서.</> : <>다시 만나 반가워요.<br />오늘도, 가까이.</>}</h1><p>익숙한 동네에서 만나는 뜻밖의 취향.<br />당신의 다음 발견은 어떤 모습일까요?</p><div className="auth-illustration" aria-hidden="true"><span>산책</span><span>커피</span><span>취향</span><strong>가까이.</strong></div><a className="text-link" href="/#discover">가입 없이 예시 동네 둘러보기 ↗</a></div>
    <div className="auth-panel"><h2>{signup ? '회원가입' : '로그인'}</h2><p className="auth-description">{signup ? '이메일로 가입하고 가까이의 발견을 시작하세요.' : '가입한 이메일과 비밀번호로 로그인하세요.'}</p>
      <div className="page-note auth-demo" id="auth-demo"><strong>Supabase 계정 인증</strong><p>{signup ? '이름·이메일·비밀번호를 Supabase로 전송해 계정을 생성합니다. 이메일 인증이 필요할 수 있습니다.' : 'Supabase에서 계정을 인증합니다. 로그인 상태 유지를 위해 이 브라우저에 인증 세션을 저장합니다.'} 비밀번호 원문은 앱에 저장하지 않습니다.</p></div>
      <form className="contact-form auth-form" aria-describedby="auth-demo" aria-busy={pending} onSubmit={submit} onChange={() => { setStatus(''); setMismatch(false); setFailed(false) }}>
        <fieldset className="auth-fields" disabled={pending}>
        {signup && <label>이름<input name="name" autoComplete="name" required maxLength={50} pattern={'.*\\S.*'} placeholder="이름을 입력하세요" /></label>}
        <label>이메일<input name="email" type="email" autoComplete="username" required maxLength={254} placeholder="hello@example.com" /></label>
        <div><label htmlFor="auth-password">비밀번호</label><div className="password-field"><input id="auth-password" name="password" type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} maxLength={128} aria-describedby={signup ? 'password-help' : undefined} placeholder={signup ? '8자 이상 입력하세요' : '비밀번호를 입력하세요'} /><button type="button" aria-controls="auth-password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? '숨기기' : '표시'}</button></div>{signup && <p className="field-help" id="password-help">8자 이상, 128자 이하로 입력하세요.</p>}</div>
        {signup && <><label>비밀번호 확인<input name="confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" required maxLength={128} aria-invalid={mismatch} aria-describedby={mismatch ? 'password-error' : undefined} placeholder="비밀번호를 한 번 더 입력하세요" /></label>{mismatch && <p id="password-error" className="field-error" role="alert">비밀번호가 일치하지 않습니다. 다시 확인해 주세요.</p>}
          <details className="privacy-note"><summary>계정 정보 처리 안내</summary><p>계정 생성·인증을 위해 이메일과 비밀번호를 Supabase Auth에 전송하고, 이름과 안내 확인 정보를 계정 메타데이터에 저장합니다. 프로필 테이블 적용 후 이름과 확인 시각이 프로필에도 기록됩니다. 이 안내 확인은 서비스 데모의 계정 처리 확인이며 정식 이용약관 동의를 대체하지 않습니다.</p></details>
          <label className="consent"><input name="agreement" type="checkbox" required /> 계정 정보 처리 안내를 확인했습니다. (필수)</label></>}
        <button type="submit" className="primary" disabled={pending || !supabase}>{pending ? '처리 중…' : signup ? '회원가입' : '로그인'} <span>↗</span></button>
        </fieldset><p className={`form-status ${failed ? 'field-error' : ''}`} role="status">{status}</p>
      </form><p className="auth-switch">{signup ? '이미 계정이 있으신가요?' : '가까이가 처음이신가요?'} <a href={signup ? '/login' : '/signup'}>{signup ? '로그인' : '회원가입'} →</a></p>
    </div>
  </section>
}
