import assert from 'node:assert/strict'
import test from 'node:test'
import { roleFromUser } from '../src/roles.js'

test('DB의 app_metadata 역할만 관리자로 인정한다', () => {
  assert.equal(roleFromUser({ app_metadata: { role: 'admin' } }), 'admin')
  assert.equal(roleFromUser({ app_metadata: { role: 'user' } }), 'user')
  assert.equal(roleFromUser(null), null)
})

test('이메일과 수정 가능한 프로필 정보로 관리자 권한을 얻을 수 없다', () => {
  assert.equal(roleFromUser({ email: 'admin@example.com', user_metadata: { role: 'admin' } }), 'user')
  assert.equal(roleFromUser({ app_metadata: { role: 'owner' }, user_metadata: { role: 'admin' } }), 'user')
  assert.equal(roleFromUser({}), 'user')
})
