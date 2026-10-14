import { useState } from 'react'
import './App.css'
import RecentNotices from './RecentNotices.jsx'
import KakaoMap from './KakaoMap.jsx'

const places = [
  { id: 1, name: '오후의 여백', category: '카페', note: '햇살과 커피, 잠시 쉬어가는 자리', image: 'quiet-coffee', time: '걸어서 4분', tag: '혼자 머물기 좋은' },
  { id: 2, name: '초록의 산책', category: '산책', note: '바쁜 하루에서 한 걸음 벗어나기', image: 'forest-path', time: '걸어서 8분', tag: '초록이 필요한 날' },
  { id: 3, name: '작은 취향 서점', category: '문화', note: '책장 사이에서 발견하는 새로운 취향', image: 'book-store', time: '걸어서 12분', tag: '새로운 영감을 주는' },
  { id: 4, name: '골목의 식탁', category: '맛집', note: '정성스러운 한 끼가 기다리는 곳', image: 'local-table', time: '걸어서 6분', tag: '든든한 한 끼' },
]
function Icon({ name, ...props }) { return <iconify-icon icon={`solar:${name}-linear`} {...props} /> }

export default function App() {
  const [category, setCategory] = useState('전체')
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem('gakkai-saved') || '[]') } catch { return [] } })
  const [onlySaved, setOnlySaved] = useState(false)
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('서울숲 주변 지도를 둘러보세요')
  const [loading, setLoading] = useState(false)
  function locate() {
    if (!navigator.geolocation) { setStatus('이 브라우저는 위치 확인을 지원하지 않습니다. 예시 동네를 둘러보세요.'); return }
    setLoading(true)
    setStatus('현재 위치를 확인하고 있습니다…')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ lat: coords.latitude, lng: coords.longitude })
      setStatus('위치를 확인했습니다. 지도에서 현재 위치를 확인해 보세요.')
      setLoading(false)
    }, (error) => {
      setStatus(error.code === 1 ? '위치 권한이 꺼져 있습니다. 브라우저 설정에서 허용하거나 예시 동네를 둘러보세요.' : '위치를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
    }, { timeout: 10000, maximumAge: 60000 })
  }
  function toggleSave(id) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id]
    setSaved(next)
    try { localStorage.setItem('gakkai-saved', JSON.stringify(next)) } catch { /* Saving remains available in this session. */ }
  }
  const shown = places.filter(place => (category === '전체' || place.category === category) && (!onlySaved || saved.includes(place.id)))
  return <>
    <header className="nav container"><a className="brand" href="#"><span className="brand-mark"><Icon name="map-point" /></span>가까이<span className="brand-period">.</span></a><nav aria-label="메인 메뉴"><a href="#discover">동네 둘러보기</a><a href="#how">가까이의 발견</a></nav><button className="saved-nav" onClick={() => { setOnlySaved(!onlySaved); document.getElementById('discover').scrollIntoView({ behavior: 'smooth' }) }}><Icon name="bookmark" /> 저장한 장소 <span>{saved.length}</span></button></header>
    <main>
      <section className="hero container"><div className="hero-copy"><div className="eyebrow"><span /> 일상과 여행 사이, 우리 동네</div><h1>좋은 곳은,<br />생각보다 <span>가까이.</span></h1><p>늘 걷던 길에서 만나는 뜻밖의 취향.<br />지금 있는 곳에서, 새로운 하루를 발견하세요.</p><button className="primary" onClick={locate} disabled={loading}><Icon name="gps" />{loading ? '위치 확인 중…' : '내 주변 발견하기'}<span>↗</span></button><div className="location-status" role="status"><Icon name="shield-check" />{status}</div>{location && <a className="actual-map" target="_blank" rel="noreferrer" href={`https://map.kakao.com/link/map/${location.lat},${location.lng}`}>카카오 지도에서 현재 위치 열기 ↗</a>}<p className="location-map-note">위치 확인 시 좌표가 카카오 지도에 전달되어 표시됩니다. 좌표는 저장하지 않습니다.</p><div className="hero-bottom"><span className="tiny-compass">✳</span><span>멀리 가지 않아도 괜찮아요.<br /><strong>반경 15분, 충분히 새로운 하루.</strong></span></div></div><div className="hero-visual"><div className="visual-top"><span><span className="live-dot" /> NEIGHBORHOOD EXPLORER</span><span>{location ? 'YOUR LOCATION ↗' : 'SEOUL, SEONGSU ↗'}</span></div><KakaoMap location={location} /></div></section>
      <section className="promise container"><span>발걸음은 가볍게, 발견은 더 깊게.</span><div><Icon name="walking" /><strong>도보 중심의 발견</strong></div><div><Icon name="bookmark" /><strong>저장하는 나만의 취향</strong></div><div><Icon name="map-point" /><strong>위치 권한은 선택</strong></div></section>
      <section className="discover container" id="discover"><div className="section-heading"><div><span className="eyebrow">A LITTLE DISCOVERY</span><h2>오늘은, 이런 곳 어때요?</h2></div><p>잠깐의 여유를 채워줄 동네의 작은 장소들.<br />성수동을 모티브로 한 예시 컬렉션입니다.</p></div><div className="filter-row"><div className="filters" role="group" aria-label="장소 카테고리">{['전체', '카페', '맛집', '산책', '문화'].map(item => <button key={item} className={category === item ? 'selected' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === '전체' ? '모든 발견' : item}</button>)}</div><button className={`saved-filter ${onlySaved ? 'active' : ''}`} onClick={() => setOnlySaved(!onlySaved)} aria-pressed={onlySaved}><Icon name="bookmark" />저장한 곳만</button></div><div className="places">{shown.map((place, index) => <article className="place" key={place.id}><div className="place-photo"><img src={`https://picsum.photos/seed/${place.image}/800/650`} alt={`${place.category} 분위기 참고 사진`} loading="lazy" decoding="async" /><span className="photo-tag">{place.tag}</span><button className={`save ${saved.includes(place.id) ? 'is-saved' : ''}`} aria-label={`${place.name} ${saved.includes(place.id) ? '저장 해제' : '저장'}`} aria-pressed={saved.includes(place.id)} onClick={() => toggleSave(place.id)}><Icon name="bookmark" /></button></div><div className="place-meta"><span>{place.category} · 예시 장소</span><span>0{index + 1}</span></div><h3>{place.name}</h3><p>{place.note}</p><div className="walk"><Icon name="walking" />{place.time}<span>예시 거리</span></div></article>)}</div>{shown.length === 0 && <div className="empty">아직 저장한 장소가 없어요. 마음에 드는 장소의 저장 버튼을 눌러보세요.</div>}<p className="demo-note">장소명·도보 시간·사진은 서비스 체험을 위한 예시입니다. 실제 주변 장소는 현재 위치 지도에서 확인하세요.</p></section>
      <section className="story container" id="how"><div className="story-title"><span className="eyebrow">LESS SEARCHING, MORE WANDERING</span><h2>계획은 조금 덜.<br />발견은 조금 더.</h2><p>검색창 앞에서 보내던 시간을<br />좋아하는 곳에서 보내는 시간으로.</p></div><div className="steps">{[['01', '지금 있는 곳에서', '위치를 확인하거나 예시 동네부터 가볍게 둘러보세요.'], ['02', '마음이 가는 대로', '커피 한 잔, 느린 산책. 오늘의 기분에 맞는 카테고리를 골라보세요.'], ['03', '다음에도 기억하도록', '마음에 드는 장소를 저장하세요. 같은 브라우저에서 다시 찾아볼 수 있어요.']].map(([num, title, text]) => <div className="step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><Icon name="arrow-right" /></div>)}</div></section>
      <RecentNotices />
      <section className="closing container"><div><span className="eyebrow">YOUR NEXT FAVORITE IS NEARBY</span><h2>다음에 좋아하게 될 곳,<br />바로 이 근처에.</h2></div><div><button className="primary light" disabled={loading} onClick={() => { locate(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>나의 동네 발견하기 <span>↗</span></button><p>가입 없이 가볍게 시작하세요.</p></div></section>
    </main><footer className="container"><a className="brand" href="#">가까이.</a><span>익숙한 동네를, 새로운 시선으로.</span><small>© 2026 가까이 · 위치 기반 서비스 데모</small></footer>
  </>
}

