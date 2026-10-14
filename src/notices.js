export const NOTICE_PAGE_SIZE = 10

export function noticeError(error) {
  if (error?.code === 'PGRST205' || error?.code === '42P01') return '공지사항 게시판이 아직 준비되지 않았습니다. 잠시 후 다시 확인해 주세요.'
  if (error?.code === '42501' || error?.status === 403) return '공지사항을 변경할 관리자 권한이 없습니다.'
  return '요청을 처리하지 못했습니다. 연결 상태를 확인한 후 다시 시도해 주세요.'
}

export function noticePayload({ title, body, pinned }) {
  const trimmedTitle = title.trim()
  const trimmedBody = body.trim()
  if (!trimmedTitle || trimmedTitle.length > 120) throw new Error('제목을 1~120자로 입력해 주세요.')
  if (!trimmedBody || trimmedBody.length > 20000) throw new Error('내용을 1~20,000자로 입력해 주세요.')
  return { title: trimmedTitle, body: trimmedBody, pinned: Boolean(pinned) }
}

export function escapeNoticeSearch(value) {
  return value.replace(/[\\%_]/g, '\\$&')
}

export function isNoticeId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '')
}
