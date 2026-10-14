import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { supabase } from './supabase.js'
import { noticeError } from './notices.js'
import { assetUrl, resolveNoticeAssets } from './noticeAssets.js'
import './RecentNotices.css'

export default function RecentNotices() {
  const { user } = useAuth()
  const [result, setResult] = useState({ rows: [], loading: true, error: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!supabase) throw new Error('Missing configuration')
        const { data, error } = await supabase.from('notices')
          .select('id,title,body,pinned,created_at,image_paths')
          .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(3)
        if (error) throw error
        await resolveNoticeAssets(supabase, data)
        const rows = data.map(notice => ({ ...notice, thumbnail: assetUrl(supabase, notice.image_paths?.[0]) }))
        if (active) setResult({ rows, loading: false, error: '' })
      } catch (error) {
        if (active) setResult({ rows: [], loading: false, error: noticeError(error) })
      }
    }
    load()
    return () => { active = false }
  }, [user?.id, retry])
  return <section className="recent-notices container" aria-labelledby="recent-notices-title"><div className="section-heading"><div><span className="eyebrow">NEWS FROM GAKKAI</span><h2 id="recent-notices-title">가까이의 새로운 이야기.</h2><p>서비스 소식과 알아두면 좋은 안내를 만나보세요.</p></div><a className="recent-more" href="/notices">공지사항 전체 보기 <span aria-hidden="true">↗</span></a></div>
    {result.loading ? <p className="recent-state" role="status">최근 소식을 불러오고 있습니다…</p> : result.error ? <div className="recent-state" role="status"><p>{result.error}</p><button className="secondary" onClick={() => { setResult(current => ({ ...current, loading: true })); setRetry(value => value + 1) }}>다시 불러오기</button></div> : result.rows.length === 0 ? <p className="recent-state">아직 등록된 공지사항이 없습니다. 새로운 소식을 준비하고 있어요.</p> : <div className="recent-notice-grid">{result.rows.map((notice, index) => <article key={notice.id}><a className="recent-notice-card" href={`/notices/${notice.id}`}><div className={`recent-notice-image ${notice.thumbnail ? '' : 'without-image'}`}>{notice.thumbnail ? <img src={notice.thumbnail} alt="" loading="lazy" decoding="async" /> : <div aria-hidden="true"><span>가까이.</span><small>NEWS & UPDATES</small></div>}<span className="recent-notice-index">0{index + 1}</span></div><div className="recent-notice-copy"><div className="recent-notice-meta"><span>{notice.pinned ? '중요 공지' : '공지사항'}</span><time dateTime={notice.created_at}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(notice.created_at))}</time></div><h3>{notice.title}</h3><p>{notice.body}</p><span className="recent-read">자세히 보기 <span aria-hidden="true">↗</span></span></div></a></article>)}</div>}
  </section>
}
