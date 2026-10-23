import { useState } from 'react'
import type { CSSProperties } from 'react'

const TONES = ['var(--ph-1)', 'var(--ph-2)', 'var(--ph-3)', 'var(--ph-4)']
export const tone = (i: number) => TONES[i % TONES.length]

// Shows the real photo when there is one, otherwise a coloured placeholder with a caption.
export function Photo({ src, label, i = 0, style }: { src?: string | null; label?: string; i?: number; style?: CSSProperties }) {
  const [bad, setBad] = useState(false)
  const show = !!src && /^https?:\/\//.test(src) && !bad
  return (
    <div className="photo" style={{ background: tone(i), color: i === 1 ? '#fff' : undefined, ...style }} role="img" aria-label={label ?? 'Photo'}>
      {show ? <img src={src!} alt="" onError={() => setBad(true)} /> : <span>{label}</span>}
    </div>
  )
}
