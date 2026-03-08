import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

function nextScheduleDate(time: string) {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date()
  next.setHours(h, m, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}

export async function setupDailyReminder(enabled: boolean, time: string) {
  if (!enabled) {
    await LocalNotifications.cancel({ notifications: [{ id: 101 }] })
    return { ok: true, message: 'Reminder disabled' }
  }

  if (Capacitor.getPlatform() === 'web') {
    return { ok: true, message: `Web mode: simulated daily reminder at ${time}` }
  }

  const perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') {
    return { ok: false, message: 'Notification permission not granted' }
  }

  await LocalNotifications.cancel({ notifications: [{ id: 101 }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 101,
        title: 'Daily check-in ✨',
        body: 'Quick 30-second ADHD-friendly health check-in',
        schedule: { at: nextScheduleDate(time), repeats: true },
      },
    ],
  })

  return { ok: true, message: `Daily reminder set for ${time}` }
}
