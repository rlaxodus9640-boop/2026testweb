import assert from 'node:assert/strict'
import test from 'node:test'
import { escapeNoticeSearch, isNoticeId, noticeError, noticePayload } from '../src/notices.js'

test('빈 본문과 길이 초과를 거부하고 게시글 저장 항목을 제한한다', () => {
  assert.throws(() => noticePayload({ title: '   ', body: '내용' }), /제목/)
  assert.throws(() => noticePayload({ title: '제목', body: '\n\t' }), /내용/)
  assert.throws(() => noticePayload({ title: '가'.repeat(121), body: '내용' }), /120/)
  assert.throws(() => noticePayload({ title: '제목', body: '가'.repeat(20001) }), /20,000/)
  assert.deepEqual(noticePayload({ title: '  제목  ', body: '\n내용\n', pinned: true, created_by: 'forged', id: 'forged' }), { title: '제목', body: '내용', pinned: true })
})

test('검색 와일드카드를 일반 문자로 처리하고 잘못된 상세 ID를 거부한다', () => {
  assert.equal(escapeNoticeSearch('100%_\\'), '100\\%\\_\\\\')
  assert.equal(isNoticeId('new'), false)
  assert.equal(isNoticeId('1 or true'), false)
  assert.equal(isNoticeId('49bc2004-e57b-43e1-a15e-297c7c83f59b'), true)
})

test('DB 미설정과 권한 오류를 빈 게시판으로 오인시키지 않는다', () => {
  assert.match(noticeError({ code: 'PGRST205' }), /준비되지/)
  assert.match(noticeError({ code: '42501' }), /권한/)
  assert.match(noticeError(new TypeError()), /연결/)
})
