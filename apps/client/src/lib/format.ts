const TZ = 'Africa/Lagos'
export const naira = (kobo: number) => '₦' + Math.round(kobo / 100).toLocaleString('en-NG')
export const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))
export const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
export const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).toUpperCase()
export const whenLabel = (iso: string) => `${dayLabel(iso)}, ${timeLabel(iso)}`
export const duration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ')
}
export const greeting = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
