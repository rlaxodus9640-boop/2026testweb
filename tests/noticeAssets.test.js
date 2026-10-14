import assert from 'node:assert/strict'
import test from 'node:test'
import { noticeAssetPaths, persistNoticeAssets, validateNoticeFiles } from '../src/noticeAssets.js'

test('이미지 수·크기·형식을 제한하고 문서 첨부를 분리한다', () => {
  const image = { name: '사진.png', type: 'image/png', size: 1024 }
  assert.equal(validateNoticeFiles([image], 'image', 2)[0].extension, 'png')
  assert.throws(() => validateNoticeFiles([image], 'image', 3), /3장/)
  assert.throws(() => validateNoticeFiles([{ ...image, size: 6 * 1024 * 1024 }], 'image', 0), /5MB/)
  assert.throws(() => validateNoticeFiles([{ ...image, type: 'image/svg+xml' }], 'image', 0), /JPG/)
  assert.throws(() => validateNoticeFiles([{ name: 'file.exe', size: 50 }], 'file', 0), /PDF/)
  assert.throws(() => validateNoticeFiles([{ name: 'file.pdf', size: 0 }], 'file', 0), /파일 크기/)
  assert.equal(validateNoticeFiles([{ name: '보고서.PDF', size: 2000 }], 'file', 0)[0].mime, 'application/pdf')
})

function mockStorage(failedUpload = null) {
  const uploaded = [], removed = []
  const client = { storage: { from: () => ({
    upload: async path => { if (path === failedUpload) return { error: new Error('upload failed') }; uploaded.push(path); return { error: null } },
    remove: async paths => { removed.push(...paths); return { error: null } },
  }) } }
  return { client, uploaded, removed }
}

test('첫 이미지 순서와 첨부 정보를 저장하고 기존 파일은 재업로드하지 않는다', async () => {
  const storage = mockStorage()
  const images = [{ path: 'existing.png' }, { path: 'new.png', file: {}, mime: 'image/png' }]
  const attachments = [{ path: 'file.pdf', file: {}, mime: 'application/pdf', name: '안내.pdf', size: 3000 }]
  let payload
  await persistNoticeAssets(storage.client, images, attachments, async value => { payload = value; return { id: 'saved' } })
  assert.deepEqual(storage.uploaded, ['new.png', 'file.pdf'])
  assert.deepEqual(payload, { image_paths: ['existing.png', 'new.png'], attachments: [{ path: 'file.pdf', name: '안내.pdf', size: 3000 }] })
  assert.deepEqual(noticeAssetPaths(payload), ['existing.png', 'new.png', 'file.pdf'])
})

test('중간 업로드 실패 시 이미 업로드한 파일을 정리하고 게시글을 저장하지 않는다', async () => {
  const storage = mockStorage('second.png')
  let wrote = false
  await assert.rejects(persistNoticeAssets(storage.client, [{ path: 'first.png', file: {} }, { path: 'second.png', file: {} }], [], async () => { wrote = true }), /업로드/)
  assert.equal(wrote, false)
  assert.deepEqual(storage.removed, ['first.png'])
})

test('DB 저장 실패 시 새 파일만 정리하고 기존 첨부파일을 보존한다', async () => {
  const storage = mockStorage()
  const failure = new Error('DB rejected')
  await assert.rejects(persistNoticeAssets(storage.client, [{ path: 'existing.png' }, { path: 'new.png', file: {} }], [], async () => { throw failure }), /DB rejected/)
  assert.deepEqual(storage.removed, ['new.png'])
})
