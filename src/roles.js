// app_metadata is managed by trusted server-side administration.
// Email and editable user_metadata must never grant administrative access.
export function roleFromUser(user) {
  if (!user) return null
  return user.app_metadata?.role === 'admin' ? 'admin' : 'user'
}
