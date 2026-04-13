declare module 'react-toggle-dark-mode' {
  import type { CSSProperties, MouseEvent } from 'react'

  interface AnimationProperties {
    dark: {
      circle?: { r?: number }
      mask?: { cx?: string; cy?: string }
      svg?: { transform?: string }
      lines?: { opacity?: number }
    }
    light: {
      circle?: { r?: number }
      mask?: { cx?: string; cy?: string }
      svg?: { transform?: string }
      lines?: { opacity?: number }
    }
    springConfig?: { mass?: number; tension?: number; friction?: number }
  }

  interface DarkModeSwitchProps {
    onChange: (checked: boolean) => void
    checked?: boolean
    style?: CSSProperties
    size?: number | string
    animationProperties?: Partial<AnimationProperties>
    moonColor?: string
    sunColor?: string
    'aria-label'?: string
    'aria-labelledby'?: string
    onClick?: (event: MouseEvent) => void
    className?: string
    id?: string
  }

  export function DarkModeSwitch(props: DarkModeSwitchProps): JSX.Element
}
