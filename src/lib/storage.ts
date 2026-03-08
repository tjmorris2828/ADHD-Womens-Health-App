import { Preferences } from '@capacitor/preferences'

export async function saveData<T>(key: string, value: T) {
  const payload = JSON.stringify(value)

  try {
    await Preferences.set({ key, value: payload })
  } catch {
    localStorage.setItem(key, payload)
  }
}

export async function getData<T>(key: string, fallback: T): Promise<T> {
  try {
    const out = await Preferences.get({ key })
    return out.value ? (JSON.parse(out.value) as T) : fallback
  } catch {
    const out = localStorage.getItem(key)
    return out ? (JSON.parse(out) as T) : fallback
  }
}
