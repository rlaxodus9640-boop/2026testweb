import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null

export function authErrorMessage(error) {
  const messages = {
    invalid_credentials: '이메일 또는 비밀번호를 확인해 주세요.',
    email_not_confirmed: '이메일 인증을 완료한 후 로그인해 주세요.',
    user_already_exists: '이미 가입된 이메일입니다. 로그인해 주세요.',
    email_exists: '이미 가입된 이메일입니다. 로그인해 주세요.',
    weak_password: '비밀번호가 보안 기준에 맞지 않습니다. 다른 비밀번호를 입력해 주세요.',
    over_email_send_rate_limit: '인증 메일 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
    over_request_rate_limit: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
    signup_disabled: '현재 회원가입을 사용할 수 없습니다.',
    email_address_invalid: '사용 가능한 이메일 주소를 입력해 주세요.',
    unexpected_failure: '계정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  }
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) {
    return '서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.'
  }
  return messages[error?.code] || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
