// Google Maps API 类型声明
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: google.maps.MapOptions) => google.maps.Map
        Marker: new (options: google.maps.MarkerOptions) => google.maps.Marker
        InfoWindow: new (options?: google.maps.InfoWindowOptions) => google.maps.InfoWindow
        MapTypeId: {
          ROADMAP: string
          SATELLITE: string
          HYBRID: string
          TERRAIN: string
        }
        SymbolPath: {
          CIRCLE: number
          FORWARD_CLOSED_ARROW: number
          FORWARD_OPEN_ARROW: number
          BACKWARD_CLOSED_ARROW: number
          BACKWARD_OPEN_ARROW: number
        }
      }
    }
  }

  namespace google.maps {
    interface MapOptions {
      center: LatLngLiteral
      zoom: number
      mapTypeId?: string
      styles?: MapTypeStyle[]
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MarkerOptions {
      position: LatLngLiteral
      map: Map
      title?: string
      icon?: MarkerIcon | string
    }

    interface MarkerIcon {
      path: number | string
      scale?: number
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeWeight?: number
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement
    }

    interface MapTypeStyle {
      elementType?: string
      featureType?: string
      stylers: MapTypeStyler[]
    }

    interface MapTypeStyler {
      color?: string
      visibility?: string
      weight?: number
      gamma?: number
      hue?: string
      lightness?: number
      saturation?: number
    }

    class Map {
      constructor(element: HTMLElement, options: MapOptions)
    }

    class Marker {
      constructor(options: MarkerOptions)
      addListener(eventName: string, handler: () => void): void
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions)
      open(map: Map, marker: Marker): void
    }
  }
}

export {}
