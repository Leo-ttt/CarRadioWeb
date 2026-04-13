/**
 * 内容语言固定为英文，仅支持 en
 */
export const DEFAULT_CONTENT_LANGUAGE = 'en' as const

export type ContentLanguage = 'en'

/** 将任意请求参数规范为内容语言，仅返回 'en' */
export function toContentLanguage(value: unknown): ContentLanguage {
  return DEFAULT_CONTENT_LANGUAGE
}
