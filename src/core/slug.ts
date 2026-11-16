import { CHAR_MAPS, type CharMap, type CharMapName } from '@samline/string'

export type { CharMap, CharMapName }

/** A built-in transliteration preset, your own map, or several merged in order. */
export type SlugCharMap = CharMapName | CharMap | ReadonlyArray<CharMapName | CharMap>

export interface SlugOptions {
  delimiter?: string
  replacements?: Readonly<Record<string, string>>
  maxLength?: number
  locale?: string | string[]
  charMap?: SlugCharMap
  preserve?: string
}

// slugify lower-cases before it applies the map, so a custom key such as
// `Å` also gets its lower-case form (`å`) unless the map already has one.
const withLowerKeys = (map: CharMap): CharMap => {
  const lower: Record<string, string> = {}
  for (const [key, value] of Object.entries(map)) {
    const small = key.toLowerCase()
    if (small !== key && !(small in map)) lower[small] = value.toLowerCase()
  }
  return { ...map, ...lower }
}

const resolveMap = (entry: CharMapName | CharMap): CharMap => {
  if (typeof entry !== 'string') return withLowerKeys(entry)
  const map = (CHAR_MAPS as Record<string, CharMap>)[entry]
  if (!map) {
    throw new TypeError(
      `Unknown slug charMap "${entry}". Use ${Object.keys(CHAR_MAPS)
        .map(name => `'${name}'`)
        .join(', ')} or an object such as { ä: 'ae' }.`
    )
  }
  return map
}

// Listeners pass the same options on every keystroke; resolving to the same
// map object lets slugify reuse its compiled pattern instead of rebuilding it.
const resolved = new WeakMap<object, CharMap>()

const resolveCharMap = (charMap: SlugCharMap): CharMap => {
  if (typeof charMap === 'string') return resolveMap(charMap)
  const cached = resolved.get(charMap)
  if (cached) return cached
  const map = Array.isArray(charMap)
    ? Object.assign({}, ...charMap.map(resolveMap))
    : resolveMap(charMap as CharMap)
  resolved.set(charMap, map)
  return map
}

/** `slugify` options shared by `format()` (`trim: false`) and `getRawValue()`. */
export const slugifyOptions = (options: SlugOptions) => {
  if (options.preserve !== undefined && typeof options.preserve !== 'string') {
    throw new TypeError('The slug `preserve` option is a string of characters, e.g. "._".')
  }
  return {
    separator: options.delimiter ?? '-',
    ...(options.replacements && { replacements: options.replacements }),
    ...(options.maxLength !== undefined && { maxLength: options.maxLength }),
    ...(options.locale && { locale: options.locale }),
    ...(options.charMap && { charMap: resolveCharMap(options.charMap) }),
    ...(options.preserve && { preserve: options.preserve }),
  }
}
