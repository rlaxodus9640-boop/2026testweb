export const avatarOptions = {
  character: [['bear', '곰'], ['cat', '고양이'], ['rabbit', '토끼']],
  color: [['oat', '오트밀'], ['sage', '세이지'], ['peach', '복숭아'], ['cocoa', '코코아']],
  background: [['cream', '크림'], ['leaf', '연두'], ['sky', '하늘'], ['rose', '분홍']],
  expression: [['smile', '미소'], ['wink', '윙크'], ['happy', '활짝']],
  accessory: [['none', '없음'], ['glasses', '안경'], ['flower', '꽃']],
}

export function normalizeAvatar(value) {
  const input = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(Object.entries(avatarOptions).map(([field, options]) => [field,
    options.some(([key]) => key === input[field]) ? input[field] : options[0][0],
  ]))
}

export function randomAvatar() {
  return Object.fromEntries(Object.entries(avatarOptions).map(([field, options]) => [field,
    options[Math.floor(Math.random() * options.length)][0],
  ]))
}

export function profileFromUser(user) {
  const metadata = user?.user_metadata ?? {}
  return {
    full_name: typeof metadata.full_name === 'string' ? metadata.full_name.slice(0, 50) : '',
    avatar_config: normalizeAvatar(metadata.avatar_config),
  }
}

export async function saveProfile(client, expectedUserId, profile) {
  const name = profile.full_name.trim()
  if (!name || name.length > 50) throw new Error('이름을 1~50자로 입력해 주세요.')
  const { data: verified, error: verifyError } = await client.auth.getUser()
  if (verifyError) throw verifyError
  if (!verified.user || verified.user.id !== expectedUserId) {
    throw new Error('로그인 정보가 변경되었습니다. 다시 로그인해 주세요.')
  }
  const { data, error } = await client.auth.updateUser({ data: {
    full_name: name,
    avatar_config: normalizeAvatar(profile.avatar_config),
  } })
  if (error) throw error
  if (!data.user || data.user.id !== expectedUserId) throw new Error('프로필 저장 결과를 확인하지 못했습니다.')
  return profileFromUser(data.user)
}
