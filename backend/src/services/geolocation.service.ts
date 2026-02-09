interface GeoResult {
  country: string | null
  countryCode: string | null
}

export async function resolveCountry(ip: string): Promise<GeoResult> {
  const fallback: GeoResult = { country: null, countryCode: null }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return fallback
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) return fallback

    const data = await response.json()

    if (data.status === 'success') {
      return {
        country: data.country || null,
        countryCode: data.countryCode || null,
      }
    }

    return fallback
  } catch {
    return fallback
  }
}
