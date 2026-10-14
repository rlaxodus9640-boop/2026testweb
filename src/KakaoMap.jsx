import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from './kakaoMaps.js'
import './KakaoMap.css'

const DEFAULT_CENTER = { lat: 37.5445, lng: 127.0374 }

export default function KakaoMap({ location }) {
  const canvas = useRef(null)
  const map = useRef(null)
  const [state, setState] = useState({ ready: false, error: '' })
  const [attempt, setAttempt] = useState(0)
  const lat = location?.lat
  const lng = location?.lng
  useEffect(() => {
    let active = true
    let observer
    const element = canvas.current
    loadKakaoMaps(import.meta.env.VITE_KAKAOMAP_KEY || import.meta.env.VITE_KAKAO_MAP_KEY).then(maps => {
      if (!active) return
      const instance = new maps.Map(element, { center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng), level: 4, scrollwheel: false })
      map.current = instance
      instance.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT)
      const resize = () => {
        const center = instance.getCenter()
        instance.relayout()
        instance.setCenter(center)
      }
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize)
        observer.observe(element)
      }
      setState({ ready: true, error: '' })
    }).catch(error => { if (active) setState({ ready: false, error: error.message }) })
    return () => {
      active = false
      observer?.disconnect()
      map.current = null
      element.replaceChildren()
    }
  }, [attempt])
  useEffect(() => {
    if (!state.ready || !map.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return
    const maps = window.kakao.maps
    const point = new maps.LatLng(lat, lng)
    map.current.setCenter(point)
    const marker = new maps.Marker({ map: map.current, position: point, title: '확인한 현재 위치' })
    return () => marker.setMap(null)
  }, [lat, lng, state.ready])
  const center = location ?? DEFAULT_CENTER
  return <div className="kakao-map-panel"><div className="map-art kakao-map-art"><div ref={canvas} className="map-roads kakao-map-canvas" role="region" aria-label={location ? '현재 위치를 표시한 카카오 지도' : '서울숲 주변 카카오 지도'} tabIndex={0} />{!state.ready && <div className="kakao-map-state" role="status"><span className="eyebrow">NEIGHBORHOOD MAP</span><strong>{state.error ? '지도를 잠시 불러올 수 없어요.' : '동네 지도를 펼치고 있어요.'}</strong><p>{state.error || '잠시만 기다려 주세요.'}</p>{state.error && <button className="secondary" onClick={() => { setState({ ready: false, error: '' }); setAttempt(value => value + 1) }}>다시 불러오기</button>}</div>}</div><div className="kakao-map-caption"><div><strong>{location ? '지금 있는 곳, 이 근처에서' : '서울숲에서 시작하는 동네 발견'}</strong><p>{location ? '위치 확인 버튼으로 확인한 지점입니다.' : '기본 지도 위치입니다. 현재 위치는 버튼을 눌러 확인하세요.'}</p></div><a href={`https://map.kakao.com/link/map/${center.lat},${center.lng}`} target="_blank" rel="noreferrer" aria-label="카카오 지도에서 크게 보기 (새 탭)">크게 보기 ↗</a></div></div>
}
