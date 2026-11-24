export type Weather = {
  /** The place as the weather service names it, e.g. "Berlin". */
  place: string
  /** Current temperature in °C, or null when the last fetch failed. */
  tempC: number | null
  /** Why there is no temperature, shown in place of it. */
  note?: string
}

declare module 'claude-code' {
  interface PluginState {
    'christmas-scene': { weather: Shaped<Weather | null> }
  }
}
