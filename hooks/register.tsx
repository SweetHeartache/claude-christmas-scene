import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Weather } from '../types'
import { makeColors } from './make-colors.js'

// ---------------------------------------------------------------------------
// State: the latest weather reading, which the backdrop draws in its corner.
// ---------------------------------------------------------------------------

const weather = atom({ plugin: 'christmas-scene', key: 'weather' } as const, null, {
  shape: 'weather-1',
})

const REFRESH_MS = 15 * 60 * 1000
const SCENE = 'christmas-night'

// ---------------------------------------------------------------------------
// Colors: a cold navy night, gold accent, Christmas red and green kept for
// danger and success.
// ---------------------------------------------------------------------------

const { theme, problems } = makeColors({
  label: 'Christmas night',
  only: 'dark',
  roles: { accent: '#d4a64a', danger: '#d64545', success: '#3f9b5e', warning: '#e0a030', pro: '#8f7ad6' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0e1726',
        'surface-1': '#152033',
        'surface-2': '#1b2940',
        'surface-3': '#1f2e48',
        'text-primary': '#eef3fa',
        'text-secondary': '#c4d0e0',
        'text-muted': '#9aa9be',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 14, tint: '#0e1726', opacity: 0.55 } },
}

// ---------------------------------------------------------------------------
// The scene, built once: sky, moon, stars, three rows of evergreens on snowy
// hills, a decorated tree at each edge, and three layers of falling snow.
// ---------------------------------------------------------------------------

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

function tree(x: number, base: number, h: number, fill: string, snow: string): string {
  const tiers = 4
  let out = `<rect x="${r1(x - h * 0.035)}" y="${r1(base - h * 0.1)}" width="${r1(h * 0.07)}" height="${r1(h * 0.1)}" fill="#2a1d14"/>`
  for (let i = 0; i < tiers; i++) {
    const top = base - h + i * h * 0.2
    const bottom = top + h * 0.38
    const half = h * (0.16 + i * 0.07)
    out += `<polygon points="${r1(x)},${r1(top)} ${r1(x + half)},${r1(bottom)} ${r1(x - half)},${r1(bottom)}" fill="${fill}"/>`
    // snow resting on the tier's upper slopes
    const capY = top + (bottom - top) * 0.3
    const capHalf = half * 0.3
    out += `<polygon points="${r1(x)},${r1(top)} ${r1(x + capHalf)},${r1(capY)} ${r1(x + capHalf * 0.4)},${r1(capY - 4)} ${r1(x)},${r1(capY + 3)} ${r1(x - capHalf * 0.5)},${r1(capY - 3)} ${r1(x - capHalf)},${r1(capY)}" fill="${snow}"/>`
  }
  return out
}

function decorations(x: number, base: number, h: number, rand: () => number): string {
  const colors = ['#ffd27a', '#ff6b6b', '#7fd3ff', '#b8f28a']
  let out = ''
  for (let i = 0; i < 26; i++) {
    const t = 0.18 + rand() * 0.78
    const y = base - h + t * h * 0.9
    const spread = h * (0.05 + t * 0.32)
    const lx = x + (rand() * 2 - 1) * spread
    const color = colors[i % colors.length]
    const delay = r1(rand() * -6)
    out += `<circle class="bulb" style="animation-delay:${delay}s" cx="${r1(lx)}" cy="${r1(y)}" r="5" fill="${color}"/>`
  }
  // star on top
  const sy = base - h - 10
  const pts: string[] = []
  for (let k = 0; k < 10; k++) {
    const ang = -Math.PI / 2 + (k * Math.PI) / 5
    const rad = k % 2 === 0 ? 22 : 9
    pts.push(`${r1(x + Math.cos(ang) * rad)},${r1(sy + Math.sin(ang) * rad)}`)
  }
  out += `<circle cx="${x}" cy="${sy}" r="34" fill="url(#starGlow)"/>`
  out += `<polygon points="${pts.join(' ')}" fill="#ffd66b"/>`
  return out
}

function snowField(rand: () => number, count: number, rMin: number, rMax: number, alpha: number): string {
  // One field 1100 tall, drawn twice (above and on screen) so the fall loops.
  const flakes: string[] = []
  for (let i = 0; i < count; i++) {
    flakes.push(`<circle cx="${r1(rand() * 1640 - 20)}" cy="${r1(rand() * 1100)}" r="${r1(rMin + rand() * (rMax - rMin))}"/>`)
  }
  const field = flakes.join('')
  return `<g fill="#ffffff" fill-opacity="${alpha}">${field}<g transform="translate(0 -1100)">${field}</g></g>`
}

function buildScene(): string {
  const rand = seeded(2512)

  let stars = ''
  for (let i = 0; i < 90; i++) {
    const cls = i % 3 === 0 ? ' class="twinkle"' : ''
    const delay = i % 3 === 0 ? ` style="animation-delay:${r1(rand() * -8)}s"` : ''
    stars += `<circle${cls}${delay} cx="${r1(rand() * 1600)}" cy="${r1(rand() * 520)}" r="${r1(0.6 + rand() * 1.4)}" fill="#ffffff" fill-opacity="${r1(0.4 + rand() * 0.5)}"/>`
  }

  let far = ''
  for (let i = 0; i < 46; i++) {
    const x = (i / 46) * 1640 + rand() * 30 - 20
    far += tree(x, 700 + rand() * 18, 70 + rand() * 50, '#1c3a4c', '#a9bdd6')
  }

  let mid = ''
  for (let i = 0; i < 20; i++) {
    const x = (i / 20) * 1700 - 40 + rand() * 50
    mid += tree(x, 810 + rand() * 30, 150 + rand() * 90, '#133a30', '#dce8f6')
  }

  // Big trees kept to the edges so the middle, where the words sit, stays calm.
  const near =
    tree(70, 1010, 470, '#0d2b22', '#eef4fb') +
    tree(250, 1030, 360, '#0f3026', '#eef4fb') +
    tree(1370, 1030, 380, '#0f3026', '#eef4fb') +
    tree(1540, 1010, 500, '#0d2b22', '#eef4fb')

  const lights = decorations(250, 1030, 360, rand) + decorations(1370, 1030, 380, rand)

  const snowFar = snowField(rand, 140, 0.8, 1.6, 0.55)
  const snowMid = snowField(rand, 80, 1.6, 2.6, 0.75)
  const snowNear = snowField(rand, 34, 2.8, 4.4, 0.9)

  return `<style>
.fall1 { animation: fall 46s linear infinite; }
.fall2 { animation: fall 30s linear infinite; }
.fall3 { animation: fall 19s linear infinite; }
.sway1 { animation: sway 9s ease-in-out infinite alternate; }
.sway2 { animation: sway 7s ease-in-out infinite alternate; }
.sway3 { animation: sway 5.5s ease-in-out infinite alternate; }
.twinkle { animation: twinkle 7s ease-in-out infinite alternate; }
.bulb { animation: bulb 4s ease-in-out infinite alternate; }
@keyframes fall { from { transform: translateY(0px); } to { transform: translateY(1100px); } }
@keyframes sway { from { transform: translateX(-16px); } to { transform: translateX(16px); } }
@keyframes twinkle { from { opacity: 1; } to { opacity: 0.45; } }
@keyframes bulb { from { opacity: 1; } to { opacity: 0.6; } }
</style>
<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#070f22"/>
<stop offset="0.55" stop-color="#14284a"/>
<stop offset="1" stop-color="#2a4670"/>
</linearGradient>
<radialGradient id="moonGlow">
<stop offset="0" stop-color="#fdf6dc" stop-opacity="0.5"/>
<stop offset="1" stop-color="#fdf6dc" stop-opacity="0"/>
</radialGradient>
<radialGradient id="starGlow">
<stop offset="0" stop-color="#ffd66b" stop-opacity="0.55"/>
<stop offset="1" stop-color="#ffd66b" stop-opacity="0"/>
</radialGradient>
<linearGradient id="snowNear" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#f4f8fd"/>
<stop offset="1" stop-color="#c9d8ec"/>
</linearGradient>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
${stars}
<circle cx="1330" cy="170" r="150" fill="url(#moonGlow)"/>
<circle cx="1330" cy="170" r="44" fill="#fbf3d5"/>
<circle cx="1316" cy="160" r="8" fill="#ece1bb"/>
<circle cx="1344" cy="186" r="5" fill="#ece1bb"/>
<path d="M0 690 C 220 640 420 660 640 690 S 1060 650 1260 680 S 1500 660 1600 670 L1600 1000 L0 1000 Z" fill="#2e4b70"/>
${far}
<path d="M0 790 C 260 750 520 770 800 800 S 1300 760 1600 780 L1600 1000 L0 1000 Z" fill="#b9cbe2"/>
${mid}
<path d="M0 900 C 300 870 600 890 820 910 S 1300 875 1600 895 L1600 1000 L0 1000 Z" fill="url(#snowNear)"/>
${near}
${lights}
<g class="sway1"><g class="fall1">${snowFar}</g></g>
<g class="sway2"><g class="fall2">${snowMid}</g></g>
<g class="sway3"><g class="fall3">${snowNear}</g></g>
</svg>`
}

const SCENE_MARKUP = buildScene()

// The root has no viewBox, so its units are screen pixels: the scene inside
// fills and crops itself, and the badge stays a fixed size in the top left.
function compose(w: Weather | null): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
${SCENE_MARKUP}
${badge(w)}
</svg>`
}

// ---------------------------------------------------------------------------
// The temperature badge, drawn as its own small SVG pinned to the top left.
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function badge(w: Weather | null): string {
  const big =
    w === null ? '…' : w.tempC === null ? '—' : `${Math.round(w.tempC) < 0 ? '−' : ''}${Math.abs(Math.round(w.tempC))}°C`
  const small = w === null ? 'Checking the weather' : w.note ?? w.place
  const place = escapeXml(small.length > 26 ? `${small.slice(0, 25)}…` : small)

  // a six-armed snowflake drawn with lines
  let flake = ''
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3
    const x = r1(Math.cos(a) * 13)
    const y = r1(Math.sin(a) * 13)
    flake += `<line x1="0" y1="0" x2="${x}" y2="${y}"/>`
  }

  return `<svg x="20" y="52" width="230" height="86" viewBox="0 0 230 86">
<rect x="1" y="1" width="228" height="84" rx="16" fill="#0a1426" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.22"/>
<g transform="translate(34 43)" stroke="#cfe3ff" stroke-width="2.4" stroke-linecap="round">${flake}</g>
<text x="62" y="46" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#ffffff">${escapeXml(big)}</text>
<text x="63" y="68" font-family="system-ui, sans-serif" font-size="13" fill="#cfe0f5">${place}</text>
</svg>`
}

// ---------------------------------------------------------------------------
// Weather: Open-Meteo, no key. The city is kept in $.store by /snow-city.
// ---------------------------------------------------------------------------

type Place = { query: string; name: string; lat: number; lon: number }

async function locate($: EngineInterface, query: string): Promise<Place | null> {
  const coords = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(query)
  if (coords) {
    const lat = Number(coords[1])
    const lon = Number(coords[2])
    return { query, name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon }
  }

  const cached = (await $.store.get('place')) as Place | undefined
  if (cached && cached.query === query) {
    return cached
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(query)}`
  const res = await $.http.fetch(url)
  if (!res.ok) {
    throw new Error(`geocoding answered ${res.status}`)
  }
  const data = JSON.parse(res.text) as { results?: { name: string; latitude: number; longitude: number }[] }
  const hit = data.results?.[0]
  if (!hit) {
    return null
  }
  const place: Place = { query, name: hit.name, lat: hit.latitude, lon: hit.longitude }
  await $.store.set('place', place)
  return place
}

async function refresh($: EngineInterface): Promise<Weather> {
  const city = (await $.store.get('city')) as string | undefined

  if (!city) {
    const w: Weather = { place: '', tempC: null, note: 'Type /snow-city <city>' }
    await update($, weather, () => w)
    return w
  }

  try {
    const place = await locate($, city)
    if (!place) {
      const w: Weather = { place: city, tempC: null, note: `No place named ${city}` }
      await update($, weather, () => w)
      return w
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m`
    const res = await $.http.fetch(url)
    if (!res.ok) {
      throw new Error(`forecast answered ${res.status}`)
    }
    const data = JSON.parse(res.text) as { current?: { temperature_2m?: number } }
    const t = data.current?.temperature_2m
    const w: Weather = { place: place.name, tempC: typeof t === 'number' ? t : null }
    await update($, weather, () => w)
    return w
  } catch (error) {
    $.ui.log(`christmas-scene: weather fetch failed: ${String(error)}`)
    // Keep the last good reading if there is one.
    const prev = await read($, weather)
    if (prev && prev.tempC !== null) {
      return prev
    }
    const w: Weather = { place: city, tempC: null, note: 'Weather unavailable' }
    await update($, weather, () => w)
    return w
  }
}

// ---------------------------------------------------------------------------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.log(unpainted)
    }

    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.log(`christmas-scene: ${set.reason}`)
    }

    await $.command.register({
      name: 'snow-city',
      description: 'Set the city for the Christmas scene temperature, e.g. /snow-city Oslo (or lat,lon)',
    })

    void refresh($)
    $.clock.every(REFRESH_MS, () => {
      void refresh($)
    })

    return next(e)
  })

  on('command.run', { command: 'snow-city' }, async ($, e) => {
    const city = e.args.trim()
    if (city === '') {
      const current = (await $.store.get('city')) as string | undefined
      return {
        text: current
          ? `The Christmas scene shows the temperature for ${current}. Change it with /snow-city <city>.`
          : 'No city yet. Set one with /snow-city <city>, for example /snow-city Oslo.',
      }
    }
    await $.store.set('city', city)
    const w = await refresh($)
    if (w.tempC === null) {
      return { text: `Saved ${city}, but no temperature yet: ${w.note ?? 'unknown error'}.` }
    }
    return { text: `It's ${Math.round(w.tempC)}°C in ${w.place}. The scene now shows it in the top left.` }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const w = await read($, weather)
    const temp = w?.tempC != null ? ` Outside it is ${Math.round(w.tempC)}°C in ${w.place}.` : ''

    return (
      <Svg
        source={compose(w)}
        alt={`A snowy evergreen forest at night under the moon, with snow falling.${temp}`}
        isInteractive
      />
    )
  })
}
