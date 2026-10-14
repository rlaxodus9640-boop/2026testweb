let sdkPromise

export function loadKakaoMaps(key) {
  if (!key) return Promise.reject(new Error('지도를 준비하고 있습니다. 잠시 후 다시 방문해 주세요.'))
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => fail(), 15000)
    function fail() {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error('카카오 지도를 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.'))
    }
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.onerror = fail
    script.onload = () => {
      if (!window.kakao?.maps?.load) { fail(); return }
      window.kakao.maps.load(() => {
        window.clearTimeout(timeout)
        if (window.kakao.maps.Map) resolve(window.kakao.maps)
        else fail()
      })
    }
    document.head.appendChild(script)
  }).catch(error => { sdkPromise = undefined; throw error })
  return sdkPromise
}
