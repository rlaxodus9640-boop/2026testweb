import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { supabase } from './supabase.js'
import { escapeNoticeSearch, isNoticeId, NOTICE_PAGE_SIZE, noticeError, noticePayload } from './notices.js'
import './Notices.css'
import NoticeUpload from './NoticeUpload.jsx'
import { assetUrl, noticeAssetPaths, persistNoticeAssets, removeNoticeAssets, resolveNoticeAssets } from './noticeAssets.js'

function dateLabel(value) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

function BoardHeading({ title = '가까이의 새로운 소식.', children = '서비스 소식과 이용 안내를 확인하세요.' }) {
  return <section className="page-intro"><span className="eyebrow">GAKKAI NOTICE</span><h1>{title}</h1><p>{children}</p></section>
}

function NoticeList() {
  const { isAdmin, user } = useAuth()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ loading: true, rows: [], count: 0, error: '' })
  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!supabase) throw new Error('Missing configuration')
        let request = supabase.from('notices').select('id,title,pinned,created_at,image_paths', { count: 'exact' })
        if (query) request = request.ilike('title', `%${escapeNoticeSearch(query)}%`)
        const { data, count, error } = await request.order('pinned', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * NOTICE_PAGE_SIZE, page * NOTICE_PAGE_SIZE - 1)
        if (error) throw error
        await resolveNoticeAssets(supabase, data)
        if (active) setResult({ loading: false, rows: data, count: count ?? 0, error: '' })
      } catch (error) {
        if (active) setResult({ loading: false, rows: [], count: 0, error: noticeError(error) })
      }
    }
    load()
    return () => { active = false }
  }, [query, page, reload, user?.id])
  function changePage(next) { setResult(current => ({ ...current, loading: true })); setPage(next) }
  return <><BoardHeading /><div className="notice-toolbar"><form className="notice-search" onSubmit={event => { event.preventDefault(); setResult(current => ({ ...current, loading: true })); setQuery(input.trim()); setPage(1); setReload(value => value + 1) }}><label htmlFor="notice-search">공지사항 제목 검색</label><div><input id="notice-search" value={input} maxLength={100} onChange={event => setInput(event.target.value)} placeholder="어떤 소식을 찾으시나요?" /><button type="submit" className="secondary">검색</button></div></form>{isAdmin && <a className="primary" href="/notices/new">공지 작성 <span>↗</span></a>}</div>
    {result.loading ? <div className="empty" role="status">공지사항을 불러오고 있습니다…</div> : result.error ? <div className="empty" role="status"><p>{result.error}</p><button className="secondary" onClick={() => { setResult(current => ({ ...current, loading: true })); setReload(value => value + 1) }}>다시 시도</button></div> : <><p className="notice-count">{query ? `“${query}” 검색 결과` : '전체 소식'} <strong>{result.count}</strong>건</p><div className="notice-list">{result.rows.length ? result.rows.map((notice, index) => <a href={`/notices/${notice.id}`} key={notice.id}><span className={notice.pinned ? 'notice-badge' : 'notice-number'}>{notice.pinned ? '중요' : String((page - 1) * NOTICE_PAGE_SIZE + index + 1).padStart(2, '0')}</span><div className="notice-title-with-image">{notice.image_paths?.[0] && assetUrl(supabase, notice.image_paths[0]) && <img className="notice-thumbnail" src={assetUrl(supabase, notice.image_paths[0])} alt="" loading="lazy" />}<h2>{notice.title}</h2></div><time dateTime={notice.created_at}>{dateLabel(notice.created_at)}</time><span aria-hidden="true">↗</span></a>) : <div className="empty">{query ? '검색 결과가 없습니다. 다른 제목으로 검색해 보세요.' : '아직 등록된 공지사항이 없습니다.'}</div>}</div><nav className="notice-pagination" aria-label="공지사항 페이지"><button className="secondary" disabled={page === 1} onClick={() => changePage(page - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil(result.count / NOTICE_PAGE_SIZE))}</span><button className="secondary" disabled={page * NOTICE_PAGE_SIZE >= result.count} onClick={() => changePage(page + 1)}>다음</button></nav></>}
  </>
}

function NoticeEditor({ notice }) {
  const { user } = useAuth()
  const [title, setTitle] = useState(notice?.title ?? '')
  const [body, setBody] = useState(notice?.body ?? '')
  const [pinned, setPinned] = useState(notice?.pinned ?? false)
  const [images, setImages] = useState(() => (notice?.image_paths ?? []).map(path => ({ path })))
  const [attachments, setAttachments] = useState(notice?.attachments ?? [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function save(event) {
    event.preventDefault()
    if (busy) return
    let payload
    try { payload = noticePayload({ title, body, pinned }) }
    catch (error) { setMessage(error.message); return }
    setBusy(true)
    setMessage('')
    try {
      const data = await persistNoticeAssets(supabase, images, attachments, async assets => {
        const fields = { ...payload, ...assets }
        const request = notice ? supabase.from('notices').update(fields).eq('id', notice.id) : supabase.from('notices').insert({ ...fields, created_by: user.id })
        const { data: record, error } = await request.select('id').single()
        if (error) throw error
        return record
      })
      const kept = [...images, ...attachments].map(item => item.path)
      let cleanupFailed = false
      try { await removeNoticeAssets(supabase, noticeAssetPaths(notice).filter(path => !kept.includes(path))) }
      catch { cleanupFailed = true }
      window.location.assign(`/notices/${data.id}${cleanupFailed ? '?cleanup=1' : ''}`)
    } catch (error) { setMessage(error.name === 'Error' ? error.message : noticeError(error)); setBusy(false) }
  }
  return <><BoardHeading title={notice ? '공지사항 수정' : '새로운 소식을 전하세요.'}>게시한 공지사항은 모든 방문자가 볼 수 있습니다.</BoardHeading><form className="notice-editor contact-form" onSubmit={save} aria-busy={busy}><fieldset className="auth-fields" disabled={busy}><label>제목<input name="title" required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="공지 제목을 입력하세요" /></label><label>내용<textarea name="body" required maxLength={20000} rows={14} value={body} onChange={event => setBody(event.target.value)} placeholder="전하고 싶은 소식을 입력하세요" /></label><NoticeUpload kind="image" items={images} onChange={setImages} userId={user.id} disabled={busy} /><NoticeUpload kind="file" items={attachments} onChange={setAttachments} userId={user.id} disabled={busy} /><label className="consent"><input type="checkbox" checked={pinned} onChange={event => setPinned(event.target.checked)} />중요 공지로 목록 상단에 표시</label><div className="notice-actions"><button className="primary" type="submit" disabled={busy}>{busy ? '저장 중…' : notice ? '수정 저장' : '공지 게시하기'}</button><a className="secondary" href={notice ? `/notices/${notice.id}` : '/notices'}>취소</a></div></fieldset><p role="status" className="form-status field-error">{message}</p></form></>
}

function NoticeDetail({ notice }) {
  const { isAdmin } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function remove() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.from('notices').delete().eq('id', notice.id).select('id').single()
      if (error || !data) throw error || new Error('Not deleted')
      let cleanupFailed = false
      try { await removeNoticeAssets(supabase, noticeAssetPaths(notice)) }
      catch { cleanupFailed = true }
      window.location.assign(`/notices${cleanupFailed ? '?cleanup=1' : ''}`)
    } catch (error) { setMessage(noticeError(error)); setBusy(false) }
  }
  return <article className="notice-detail">{new URLSearchParams(window.location.search).has("cleanup") && <p className="page-note" role="status">글은 저장했지만 이전 첨부파일 일부를 정리하지 못했습니다. 관리자에게 문의해 주세요.</p>}<BoardHeading title={notice.title}>{notice.pinned && <span className="notice-badge">중요 공지 </span>} <time dateTime={notice.created_at}>{dateLabel(notice.created_at)}</time></BoardHeading><div className="notice-body">{notice.body}</div>{noticeAssetPaths(notice).some(path => !assetUrl(supabase, path)) && <p className="page-note">이미지와 첨부파일은 로그인 후 볼 수 있습니다. 로그인 상태라면 페이지를 새로고침해 주세요.</p>}<div className="notice-gallery">{(notice.image_paths ?? []).filter(path => assetUrl(supabase, path)).map((path, index) => <a key={path} href={assetUrl(supabase, path)} target="_blank" rel="noreferrer"><img src={assetUrl(supabase, path)} alt={`${notice.title} 첨부 이미지 ${index + 1}`} loading="lazy" /></a>)}</div>{notice.attachments?.length > 0 && <section className="notice-downloads"><h2>첨부파일</h2>{notice.attachments.filter(item => assetUrl(supabase, item.path)).map(item => <a key={item.path} href={assetUrl(supabase, item.path, item.name)} target="_blank" rel="noreferrer" download={item.name}>{item.name} <span>{(item.size / 1024).toFixed(0)} KB ↓</span></a>)}</section>}<div className="notice-actions"><a className="secondary" href="/notices">← 목록으로</a>{isAdmin && <><a className="secondary" href={`/notices/${notice.id}/edit`}>수정</a><button className="secondary notice-danger" onClick={() => setConfirming(true)} disabled={busy}>삭제</button></>}</div>{isAdmin && confirming && <div className="page-note notice-confirm"><strong>이 공지사항을 삭제할까요?</strong><p>삭제한 글은 다시 불러올 수 없습니다.</p><div className="notice-actions"><button className="secondary notice-danger" disabled={busy} onClick={remove}>{busy ? '삭제 중…' : '삭제 확인'}</button><button className="secondary" disabled={busy} onClick={() => setConfirming(false)}>취소</button></div></div>}<p role="status" className="form-status field-error">{message}</p></article>
}

function NoticeRecord({ id, edit }) {
  const { user } = useAuth()
  const [result, setResult] = useState({ loading: true, notice: null, error: '' })
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!supabase) throw new Error('Missing configuration')
        const { data, error } = await supabase.from('notices').select('id,title,body,pinned,created_at,updated_at,image_paths,attachments').eq('id', id).maybeSingle()
        if (error) throw error
        if (data) await resolveNoticeAssets(supabase, [data])
        if (active) setResult({ loading: false, notice: data, error: '' })
      } catch (error) { if (active) setResult({ loading: false, notice: null, error: noticeError(error) }) }
    }
    load()
    return () => { active = false }
  }, [id, reload, user?.id])
  if (result.loading) return <div className="empty" role="status">공지사항을 불러오고 있습니다…</div>
  if (result.error) return <div className="empty" role="status"><p>{result.error}</p><button className="secondary" onClick={() => { setResult(current => ({ ...current, loading: true })); setReload(value => value + 1) }}>다시 시도</button><a className="text-link" href="/notices">목록으로</a></div>
  if (!result.notice) return <><BoardHeading title="공지사항을 찾을 수 없습니다.">삭제되었거나 올바르지 않은 주소입니다.</BoardHeading><a className="text-link" href="/notices">목록으로 →</a></>
  return edit ? <NoticeEditor notice={result.notice} /> : <NoticeDetail notice={result.notice} />
}

export default function Notices({ path }) {
  const { isAdmin, loading } = useAuth()
  const parts = path.split('/').filter(Boolean)
  const creating = path === '/notices/new'
  const editing = parts.length === 3 && parts[2] === 'edit'
  if (path === '/notices') return <>{new URLSearchParams(window.location.search).has("cleanup") && <p className="page-note" role="status">게시글 처리는 완료했지만 일부 파일을 정리하지 못했습니다. 관리자에게 문의해 주세요.</p>}<NoticeList /></>
  if (creating || editing) {
    if (loading) return <div className="empty" role="status">권한을 확인하고 있습니다…</div>
    if (!isAdmin) return <><BoardHeading title="관리자만 작성할 수 있습니다.">공지사항은 누구나 읽을 수 있으며 작성과 수정은 관리자에게만 제공됩니다.</BoardHeading><a className="text-link" href="/notices">공지사항 목록으로 →</a></>
  }
  if (creating) return <NoticeEditor />
  if (isNoticeId(parts[1]) && (parts.length === 2 || editing)) return <NoticeRecord id={parts[1]} edit={editing} />
  return <><BoardHeading title="공지사항을 찾을 수 없습니다." /><a className="text-link" href="/notices">목록으로 →</a></>
}
