declare module 'embla-carousel-react' {
  import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';

  export type UseEmblaCarouselType = [
    (node: HTMLElement | null) => void,
    EmblaCarouselType | undefined
  ];

  export default function useEmblaCarousel(
    options?: Partial<EmblaOptionsType>,
    plugins?: any[]
  ): UseEmblaCarouselType;
}

declare module 'embla-carousel-autoplay' {
  export interface AutoplayOptionsType {
    delay?: number;
    stopOnInteraction?: boolean;
    stopOnMouseEnter?: boolean;
    stopOnFocusIn?: boolean;
    playOnInit?: boolean;
    rootNode?: ((emblaRoot: HTMLElement) => HTMLElement | null) | null;
  }

  export default function Autoplay(options?: AutoplayOptionsType): any;
}