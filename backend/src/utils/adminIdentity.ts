import type { IUser } from '../models/User'

/** JWT payload 与日志中用的「登录标识」（邮箱优先，否则为登录账号） */
export function adminJwtEmailField(user: Pick<IUser, 'email' | 'loginUsername'>): string {
  const em = user.email
  if (em != null && String(em).trim() !== '') return String(em)
  const lu = user.loginUsername
  if (lu != null && String(lu).trim() !== '') return String(lu)
  return ''
}
