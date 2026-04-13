/**
 * PrimeReact 全局配置
 * 用途：统一管理 PrimeReact 组件的默认行为和样式
 * 注意：locale 配置通过 addLocale() 和 locale() API 设置，不在此配置
 */

/**
 * 创建 PrimeReact 配置
 * @returns PrimeReact 配置对象
 */
export function createPrimeReactConfig() {
  return {
    // 使用预设主题，与现有深色风格匹配
    unstyled: false,

    // Ripple 效果（Material Design 风格的点击波纹）
    ripple: true,

    // 输入框样式变体
    inputStyle: 'outlined' as const,

    // 过渡动画配置
    pt: {
      // 全局过渡配置
      global: {
        css: () => `
          .p-component {
            font-family: inherit;
          }
        `
      }
    }
  }
}

// 默认配置
export const primeReactConfig = createPrimeReactConfig()

export type PrimeReactConfig = ReturnType<typeof createPrimeReactConfig>
