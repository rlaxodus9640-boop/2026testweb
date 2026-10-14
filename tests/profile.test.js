import assert from 'node:assert/strict'
import test from 'node:test'
import { avatarOptions, normalizeAvatar, profileFromUser, randomAvatar, saveProfile } from '../src/avatar.js'

test('외부 값은 허용된 캐릭터 옵션으로만 표시한다', () => {
  const config = normalizeAvatar({ character: '<script>', color: '#000', background: 'sky', expression: 'wink', accessory: 'https://external.invalid' })
  assert.equal(config.character, 'bear')
  assert.equal(config.color, 'oat')
  assert.equal(config.background, 'sky')
  assert.equal(config.expression, 'wink')
  assert.equal(config.accessory, 'none')
  assert.deepEqual(profileFromUser(null).avatar_config, normalizeAvatar(null))
  for (let i = 0; i < 100; i++) {
    const generated = randomAvatar()
    for (const [key, options] of Object.entries(avatarOptions)) assert.ok(options.some(([value]) => value === generated[key]))
  }
})

test('이름과 모든 캐릭터 설정을 하나의 DB 업데이트 요청으로 저장한다', async () => {
  let request
  const client = { auth: {
    getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    updateUser: async value => { request = value; return { data: { user: { id: 'user-1', user_metadata: value.data } }, error: null } },
  } }
  const avatar = { character: 'cat', color: 'peach', background: 'rose', expression: 'happy', accessory: 'flower' }
  const saved = await saveProfile(client, 'user-1', { full_name: '  가까이  ', avatar_config: avatar })
  assert.deepEqual(request, { data: { full_name: '가까이', avatar_config: avatar } })
  assert.deepEqual(saved, request.data)
})

test('서버 저장 실패는 성공으로 처리하거나 로컬 저장으로 대체하지 않는다', async () => {
  const failure = { code: 'unexpected_failure' }
  const client = { auth: {
    getUser: async () => ({ data: { user: { id: 'user-1' } } }),
    updateUser: async () => ({ data: { user: null }, error: failure }),
  } }
  await assert.rejects(saveProfile(client, 'user-1', { full_name: '이름' }), error => error === failure)
})

test('로그아웃·계정 전환 또는 빈 이름이면 프로필을 쓰지 않는다', async () => {
  let writes = 0
  const client = { auth: {
    getUser: async () => ({ data: { user: { id: 'user-2' } } }),
    updateUser: async () => { writes++; return {} },
  } }
  await assert.rejects(saveProfile(client, 'user-1', { full_name: '이름' }), /다시 로그인/)
  await assert.rejects(saveProfile(client, 'user-1', { full_name: '  ' }), /1~50자/)
  assert.equal(writes, 0)
})
