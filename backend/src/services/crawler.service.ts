import { chromium, type Page, type Route } from 'playwright'

export interface CrawlResult {
  content: string
  title: string
  url: string
}

const MIN_CONTENT_LENGTH = 50
const NAV_TIMEOUT_MS = 45000
const CONTENT_WAIT_MS = 15000
const IDLE_BEST_EFFORT_MS = 5000
const MAX_CONTENT_CHARS = 200_000

// Resource types we never need for text extraction. Blocking them shaves
// seconds off crawl time and prevents `networkidle` from hanging on slow
// third-party assets.
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font'])

// Hosts that serve analytics / tracking / ad pixels. Their requests are the
// main reason `networkidle` never settles on Wix / Squarespace / WordPress.
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /googletagservices\.com/i,
  /doubleclick\.net/i,
  /facebook\.(com|net)/i,
  /hotjar\.com/i,
  /segment\.(io|com)/i,
  /mixpanel\.com/i,
  /amplitude\.com/i,
  /fullstory\.com/i,
  /clarity\.ms/i,
  /intercom\.io/i,
  /sentry\.io/i,
  /cdn\.cookielaw\.org/i,
  /onetrust\.com/i,
  /static\.parastorage\.com\/services\/.*\/analytics/i,
  /frog\.wix\.com/i,
]

// Common cookie / consent / newsletter / paywall containers. Removing them
// keeps boilerplate out of the extracted text.
const BOILERPLATE_SELECTORS = [
  '[class*="cookie" i]',
  '[id*="cookie" i]',
  '[class*="consent" i]',
  '[id*="consent" i]',
  '[class*="gdpr" i]',
  '[class*="newsletter" i]',
  '[class*="subscribe" i]',
  '[class*="popup" i]',
  '[class*="modal" i]',
  '[class*="banner" i]',
  '[role="dialog"]',
  '[aria-modal="true"]',
]

function shouldBlockRequest(resourceType: string, requestUrl: string): boolean {
  if (BLOCKED_RESOURCE_TYPES.has(resourceType)) return true
  return BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(requestUrl))
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>(resolve => {
      let total = 0
      const step = 500
      const maxScroll = document.body.scrollHeight + 2000
      const timer = setInterval(() => {
        window.scrollBy(0, step)
        total += step
        if (total >= maxScroll) {
          clearInterval(timer)
          window.scrollTo(0, 0)
          resolve()
        }
      }, 100)
    })
  })
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  // Validate URL up front — fail fast with a clean error rather than a
  // playwright stack trace.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`)
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      // Some bot-detectors check for `navigator.webdriver`.
      bypassCSP: true,
      javaScriptEnabled: true,
    })

    // Block heavy / tracker resources at the network layer.
    await context.route('**/*', (route: Route) => {
      const req = route.request()
      if (shouldBlockRequest(req.resourceType(), req.url())) {
        return route.abort()
      }
      return route.continue()
    })

    const page = await context.newPage()
    page.setDefaultTimeout(NAV_TIMEOUT_MS)

    // Detect non-HTML responses (PDF, image, etc.) and bail with a clear
    // message — Playwright would otherwise extract garbage.
    let mainResponseContentType: string | null = null
    page.on('response', response => {
      if (response.url() === url || response.url() === parsed.href) {
        mainResponseContentType = response.headers()['content-type'] || null
      }
    })

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
    } catch {
      await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    }

    if (mainResponseContentType && !/text\/html|application\/xhtml/i.test(mainResponseContentType)) {
      throw new Error(
        `Unsupported content type: ${mainResponseContentType}. Only HTML pages can be crawled.`
      )
    }

    // Wait until the body has meaningful text — guards against capturing an
    // empty SSR shell before client hydration completes.
    try {
      await page.waitForFunction(
        minLength => (document.body?.innerText?.trim().length ?? 0) > minLength,
        MIN_CONTENT_LENGTH,
        { timeout: CONTENT_WAIT_MS }
      )
    } catch {
      // Continue with whatever rendered; extraction will still try its best.
    }

    await autoScroll(page)
    await page.waitForLoadState('networkidle', { timeout: IDLE_BEST_EFFORT_MS }).catch(() => {})

    const result = await page.evaluate(
      ({ boilerplateSelectors, maxChars }) => {
        // 1. Strip non-content nodes.
        const stripSelectors = ['script', 'style', 'noscript', 'iframe', 'svg', 'template']
        stripSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove())
        })

        // 2. Strip boilerplate containers (cookie banners, popups, modals).
        boilerplateSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => el.remove())
          } catch {
            // Invalid selectors in some engines — skip.
          }
        })

        // 3. Metadata.
        const title = (document.title || '').trim()
        const metaDescription =
          document.querySelector('meta[name="description"]')?.getAttribute('content') ||
          document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
          ''
        const ogTitle =
          document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
        const h1 = (document.querySelector('h1')?.textContent || '').trim()

        // 4. Pick the densest content container.
        const candidates = [
          document.querySelector('main'),
          document.querySelector('article'),
          document.querySelector('[role="main"]'),
          document.getElementById('content'),
          document.getElementById('main'),
          document.querySelector('.content'),
          document.querySelector('#root'),
          document.body,
        ].filter((el): el is HTMLElement => el instanceof HTMLElement)

        let bodyText = ''
        for (const el of candidates) {
          const text = (el.innerText || '').trim()
          if (text.length > bodyText.length) bodyText = text
        }

        // 5. Detect block / captcha pages — short body with telltale phrases.
        const blockedSignals = [
          'enable javascript',
          'are you a human',
          'access denied',
          'checking your browser',
          'cloudflare',
          'captcha',
        ]
        const lower = bodyText.slice(0, 600).toLowerCase()
        const looksBlocked =
          bodyText.length < 200 && blockedSignals.some(signal => lower.includes(signal))

        // 6. Compose: prepend metadata, then body, then truncate.
        const header = [ogTitle || title, h1 && h1 !== title ? h1 : '', metaDescription]
          .filter(Boolean)
          .join('\n\n')

        const combined = header ? `${header}\n\n${bodyText}` : bodyText

        const cleaned = combined
          .replace(/\r/g, '')
          .replace(/[ \t]+/g, ' ')
          .replace(/[ \t]*\n[ \t]*/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        return {
          title: title || ogTitle || h1 || '',
          content: cleaned.length > maxChars ? cleaned.slice(0, maxChars) : cleaned,
          looksBlocked,
          rawLength: bodyText.length,
        }
      },
      { boilerplateSelectors: BOILERPLATE_SELECTORS, maxChars: MAX_CONTENT_CHARS }
    )

    if (result.looksBlocked) {
      throw new Error(
        'The site appears to block automated access (CAPTCHA / bot challenge). Try again later or use a different source.'
      )
    }

    if (result.content.length < MIN_CONTENT_LENGTH) {
      throw new Error(
        'No readable content could be extracted from this page. The page may require login, be empty, or render content from sources we cannot reach.'
      )
    }

    return {
      title: result.title,
      content: result.content,
      url,
    }
  } finally {
    await browser.close()
  }
}
