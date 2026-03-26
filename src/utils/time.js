export function sec2sex(sec) {
  const total = Math.floor(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  // Use padStart for consistent leading zeros
  const padM = String(m).padStart(2, '0');
  const padS = String(s).padStart(2, '0');


  if (h > 0) {
//    return `${h}:${m<10?'0':''}${m}:${s<10?'0':''}${s}`
    const padH = String(h).padStart(2, '0');
    return `${padH}:${padM}:${padS}`;
  }

//  return `${m}:${s<10?'0':''}${s}`
  return `${padM}:${padS}`;
}

