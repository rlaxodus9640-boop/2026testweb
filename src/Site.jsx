import { useEffect, useState } from 'react'
import Home from './App.jsx'
import AuthPage from './AuthPage.jsx'
import AuthStatus from './AuthStatus.jsx'
import MyPage from './MyPage.jsx'
import Notices from './Notices.jsx'
import './Pages.css'
import './Profile.css'

const pages = [['/', '홈'], ['/company', '회사 소개'], ['/product', '제품 소개'], ['/contact', '온라인 문의'], ['/community', '커뮤니티'], ['/login', '로그인'], ['/signup', '회원가입'], ['/mypage', '마이페이지'], ['/notices', '공지사항']]
const posts = [
  { id: 'welcome', category: '공지사항', title: '가까이에서 시작하는 작은 발견', text: '가까이는 익숙한 동네를 새로운 시선으로 둘러보는 서비스 데모입니다. 홈에서 카테고리를 선택하고 마음에 드는 예시 장소를 저장해 보세요. 위치 권한을 허용하지 않아도 예시 동네를 탐색할 수 있습니다.' },
  { id: 'saving', category: '공지사항', title: '마음에 드는 장소를 기억하는 방법', text: '장소 카드의 책갈피 버튼을 누르면 저장됩니다. 저장한 곳만 보기와 카테고리 필터를 함께 사용할 수 있습니다. 저장 내역은 같은 브라우저에 보관되며, 브라우저 데이터를 삭제하면 사라질 수 있습니다.' },
  { id: 'walk', category: '이용자 이야기', title: '목적지 없이 걷는 오후의 즐거움', text: '늘 지나치던 골목을 천천히 걸어보는 건 어떨까요? 커피를 마시고, 책장을 넘기고, 잠시 초록을 바라보는 하루를 상상해 보았습니다. 이 글은 커뮤니티 화면을 보여주기 위해 작성한 예시이며 실제 이용자 후기가 아닙니다.' },
]

function Intro({ label, title, children }) {
  return <section className="page-intro"><span className="eyebrow">{label}</span><h1>{title}</h1><p>{children}</p></section>
}

function Company() {
  return <><Intro label="ABOUT GAKKAI" title={<>우리의 일상에,<br />조금 더 가까이.</>}>멀리 떠나지 않아도 새로운 발견은 시작됩니다.<br />가까이는 동네와 사람 사이의 작은 연결을 생각합니다.</Intro>
    <section className="editorial-split"><h2>익숙한 길에서<br />새로운 가능성을.</h2><div><p>가까이는 현재 위치를 출발점으로 동네의 장소를 탐색하는 한국어 서비스 데모입니다. 오늘의 기분에 맞는 장소를 둘러보고, 나만의 취향을 기억하는 경험을 만듭니다.</p><p>우리가 지향하는 것은 더 많은 검색보다, 일상에서 직접 발견하는 즐거움입니다.</p></div></section>
    <section className="value-grid">{[['01', '동네에서 시작', '가까운 골목과 작은 공간에서도 충분히 새로운 하루를 만날 수 있다고 믿습니다.'], ['02', '취향을 존중', '카페부터 산책까지, 각자의 속도와 관심에 맞는 발견을 돕습니다.'], ['03', '선택은 편안하게', '위치 권한은 필요할 때 선택하고, 가입 없이 예시 탐색을 시작합니다.']].map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</section>
    <aside className="page-note"><strong>회사 정보 안내</strong><p>현재는 서비스 소개용 데모입니다. 법인명, 대표자, 사업자등록번호, 주소 등 실제 회사 정보는 확정 자료 제공 후 반영합니다.</p></aside></>
}

function Product() {
  return <><Intro label="OUR PRODUCT" title={<>오늘의 취향을 찾는<br />가장 가까운 출발점.</>}>가볍게 둘러보고, 마음에 들면 저장하세요.<br />가까이는 동네 탐색의 첫걸음을 함께합니다.</Intro>
    <section className="product-list">{[['01', '오늘의 기분으로 둘러보기', '카페 · 맛집 · 산책 · 문화', '카테고리를 선택해 지금 끌리는 예시 장소를 모아보세요.'], ['02', '다음 방문을 위한 책갈피', '저장 · 필터 · 다시 발견', '마음에 드는 장소를 저장하고, 같은 브라우저에서 다시 확인하세요. 카테고리와 저장 필터도 함께 적용됩니다.'], ['03', '지금 있는 곳에서 시작', '선택적 위치 확인', '버튼을 눌러 위치를 확인한 뒤 카카오 지도에서 현재 위치 지도를 열 수 있습니다. 지도 링크를 열면 좌표가 카카오 지도에 전달됩니다.']].map(([n, title, tag, text]) => <article key={n}><span className="feature-number">{n}</span><div><span className="eyebrow">{tag}</span><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    <div className="page-note"><strong>현재 체험할 수 있는 범위</strong><p>홈의 장소명·사진·도보 시간은 예시이며, 지도는 실제 카카오 지도입니다. 실제 주변 장소 검색, 거리 계산, 예약 기능은 제공하지 않습니다.</p><a className="text-link" href="/#discover">예시 동네 둘러보기 ↗</a></div></>
}

function Contact() {
  const [status, setStatus] = useState('')
  return <><Intro label="CONTACT US" title={<>당신의 이야기를<br />들려주세요.</>}>서비스에 대한 궁금한 점과 제안을 남기는 공간입니다.<br />현재 문의 폼은 실제 접수가 되지 않는 체험 화면입니다.</Intro>
    <div className="contact-layout"><aside><h2>어떤 이야기를<br />나누고 싶으신가요?</h2><p>서비스 이용 문의부터 개선 아이디어까지,<br />아래 항목에 맞춰 작성해 보세요.</p><div className="page-note"><strong>데모 안내</strong><p>입력한 내용은 서버로 전송하거나 저장하지 않습니다. 실제 개인정보나 민감한 정보는 입력하지 마세요.</p></div></aside>
    <form className="contact-form" onSubmit={event => { event.preventDefault(); setStatus('입력 검증이 완료되었습니다. 데모 화면이므로 문의는 실제 접수되지 않았으며 입력 내용도 전송·저장되지 않았습니다.') }} onChange={() => setStatus('')}>
      <label>문의 유형 <span>필수</span><select name="type" required defaultValue=""><option value="" disabled>문의 유형을 선택하세요</option><option>서비스 이용</option><option>제휴 제안</option><option>개선 의견</option><option>기타</option></select></label>
      <div className="form-pair"><label>이름 <span>필수</span><input name="name" autoComplete="name" required maxLength={50} pattern=".*\S.*" placeholder="이름을 입력하세요" /></label><label>이메일 <span>필수</span><input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="hello@example.com" /></label></div>
      <label>문의 내용 <span>필수</span><textarea name="message" required minLength={10} maxLength={3000} rows={7} placeholder="문의 내용을 10자 이상 입력하세요" /></label>
      <details className="privacy-note"><summary>개인정보 수집·이용 안내 (데모)</summary><p>실제 운영 시 이름, 이메일, 문의 내용을 문의 응대 목적으로 수집할 예정입니다. 현재는 수집하지 않으며, 실제 운영 전 수집 주체·보유 기간·동의 거부에 따른 영향을 확정해 안내합니다.</p></details>
      <label className="consent"><input type="checkbox" name="consent" required /> 개인정보 수집·이용 안내를 확인했습니다. (데모 체험)</label>
      <button className="primary" type="submit">문의 입력 확인하기 <span>↗</span></button><p className="form-status" role="status">{status}</p>
    </form></div></>
}

function Community() {
  const [filter, setFilter] = useState('전체')
  return <><Intro label="OUR NEIGHBORHOOD JOURNAL" title={<>발견을 나누면,<br />동네는 더 넓어집니다.</>}>가까이의 소식과 소소한 동네 이야기.<br />모든 게시글은 화면 체험을 위한 예시 콘텐츠입니다.</Intro>
    <a className="text-link" href="/notices">공식 공지사항 게시판 →</a><div className="filters community-filters" aria-label="게시글 분류">{['전체', '공지사항', '이용자 이야기'].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="post-list">{posts.filter(post => filter === '전체' || post.category === filter).map(post => <a href={`/community/${post.id}`} key={post.id}><span>{post.category}</span><h2>{post.title}</h2><small>예시 게시글</small><span aria-hidden="true">↗</span></a>)}</div><p className="page-caption">커뮤니티 글 작성 기능은 제공하지 않습니다.</p></>
}

function Post({ post }) {
  return <article className="post-detail"><Intro label={`${post.category} · 예시 게시글`} title={post.title}>가까이 편집 · 데모 콘텐츠</Intro><p>{post.text}</p><a className="text-link" href="/community">← 커뮤니티 목록으로</a></article>
}

function Sitemap() {
  return <><Intro label="SITEMAP" title="가까이를 한눈에.">원하는 페이지로 바로 이동하세요.</Intro><div className="sitemap-grid">{pages.map(([path, title], index) => <a href={path} key={path}><span>0{index + 1}</span><h2>{title}</h2><span aria-hidden="true">↗</span></a>)}</div></>
}

export default function Site() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const post = posts.find(item => path === `/community/${item.id}`)
  const isNoticePath = path === '/notices' || path.startsWith('/notices/')
  const title = pages.find(([url]) => url === path)?.[1] || (isNoticePath ? '공지사항' : post ? post.title : path === '/sitemap' ? '사이트맵' : '페이지를 찾을 수 없습니다')
  useEffect(() => { document.title = `${title} | 가까이` }, [title])
  let content
  if (path === '/') content = <Home />
  else if (path === '/company') content = <Company />
  else if (path === '/product') content = <Product />
  else if (path === '/contact') content = <Contact />
  else if (path === '/community') content = <Community />
  else if (path === '/sitemap') content = <Sitemap />
  else if (path === '/login') content = <AuthPage />
  else if (path === '/signup') content = <AuthPage signup />
  else if (path === '/mypage') content = <MyPage />
  else if (isNoticePath) content = <Notices path={path} />
  else if (post) content = <Post post={post} />
  else content = <><Intro label="404" title="잠시, 길을 벗어났네요.">요청한 페이지를 찾을 수 없습니다.</Intro><a className="text-link" href="/">홈으로 돌아가기 →</a></>
  return <div className={`site-shell ${path === '/' ? 'is-home' : ''}`}><a className="skip-link" href="#page-content">본문으로 바로가기</a><header className="site-header container"><a href="/" className="brand" aria-label="가까이 홈">가까이.</a><nav aria-label="주요 페이지">{pages.filter(([url]) => !["/login", "/signup", "/mypage"].includes(url)).map(([url, label]) => <a href={url} key={url} aria-current={path === url || (url === '/community' && post) || (url === '/notices' && isNoticePath) ? 'page' : undefined}>{label}</a>)}<AuthStatus /></nav></header>{path === '/' ? <div id="page-content">{content}</div> : <main id="page-content" className="inner-page container">{content}</main>}<footer className="site-footer container"><a href="/" className="brand">가까이.</a><span>익숙한 동네를, 새로운 시선으로.</span><nav aria-label="하단 메뉴">{pages.slice(1).map(([url, label]) => <a href={url} key={url}>{label}</a>)}<a href="/sitemap" aria-current={path === '/sitemap' ? 'page' : undefined}>사이트맵</a></nav><small>© 2026 가까이 · 서비스 데모</small></footer></div>
}
