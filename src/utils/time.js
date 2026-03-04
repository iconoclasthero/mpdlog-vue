export function sec2sex(sec) {
  const total = Math.floor(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${m<10?'0':''}${m}:${s<10?'0':''}${s}`
  return `${m}:${s<10?'0':''}${s}`
}

