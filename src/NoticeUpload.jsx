import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { assetUrl, validateNoticeFiles } from './noticeAssets.js'

function Preview({ item }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!item.file) return
    const url = URL.createObjectURL(item.file)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [item.file])
  return <img ref={ref} src={item.file ? undefined : assetUrl(supabase, item.path) || undefined} alt={item.name || '첨부 이미지'} />
}

export default function NoticeUpload({ kind, items, onChange, userId, disabled }) {
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef(null)
  const isImage = kind === 'image'
  const title = isImage ? '이미지' : '첨부파일'
  function add(files) {
    if (disabled) return
    try {
      const next = validateNoticeFiles(Array.from(files), kind, items.length).map(item => ({ ...item, path: `${userId}/${crypto.randomUUID()}.${item.extension}` }))
      onChange([...items, ...next])
      setMessage('')
    } catch (error) { setMessage(error.message) }
  }
  function remove(index) { onChange(items.filter((_, i) => i !== index)); setMessage('') }
  return <section className="notice-upload"><h2>{title} <span>{items.length} / {isImage ? 3 : 5}</span></h2>
    <div className={`notice-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files) }}>
      <p>{isImage ? '이미지를 여기에 드래그하세요' : '첨부할 파일을 여기에 드래그하세요'}</p><small>{isImage ? 'JPG · PNG · WEBP · GIF / 최대 3장, 각 5MB' : 'PDF · TXT · ZIP / 최대 5개, 각 10MB'}</small><button type="button" className="secondary" disabled={disabled} onClick={() => input.current.click()}>{isImage ? '이미지 파일 선택' : '파일 첨부'}</button>
      <input ref={input} type="file" accept={isImage ? 'image/jpeg,image/png,image/webp,image/gif' : '.pdf,.txt,.zip'} multiple hidden disabled={disabled} aria-label={`${title} 파일 선택`} onChange={event => { add(event.target.files); event.target.value = '' }} />
    </div>
    <p className="field-help">{isImage ? '첫 번째 이미지가 목록 썸네일입니다. 대표 이미지로 지정하거나 순서를 바꿀 수 있어요.' : '첨부한 파일은 로그인한 회원이 다운로드할 수 있습니다.'}</p>
    <div className={isImage ? 'notice-image-previews' : 'notice-file-previews'}>{items.map((item, index) => <div className="notice-upload-item" key={item.path}>{isImage && <Preview item={item} />}<p>{isImage && index === 0 && <strong>대표 · </strong>}{item.name || `이미지 ${index + 1}`}</p><div className="notice-upload-actions">{isImage && index > 0 && <button type="button" className="secondary" disabled={disabled} onClick={() => onChange([item, ...items.filter((_, i) => i !== index)])}>대표로</button>}{isImage && <><button type="button" className="secondary" aria-label={`${index + 1}번 이미지 앞으로`} disabled={disabled || index === 0} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next) }}>←</button><button type="button" className="secondary" aria-label={`${index + 1}번 이미지 뒤로`} disabled={disabled || index === items.length - 1} onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next) }}>→</button></>}<button type="button" className="secondary notice-danger" disabled={disabled} onClick={() => remove(index)}>제거</button></div></div>)}</div><p role="status" className="field-error">{message}</p>
  </section>
}
