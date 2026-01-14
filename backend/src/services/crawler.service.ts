import { chromium } from 'playwright'

export interface CrawlResult {
  content: string
  title: string
  url: string
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const browser = await chromium.launch({
    headless: true,
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    const page = await context.newPage()

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    const result = await page.evaluate(() => {
      // Remove unwanted elements
      const selectors = ['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript']
      selectors.forEach(function (selector) {
        const elements = document.querySelectorAll(selector)
        elements.forEach(function (el) {
          el.remove()
        })
      })

      const title = document.title || ''
      const bodyText = document.body.innerText || ''

      return {
        title: title,
        content: bodyText.trim(),
      }
    })

    return {
      ...result,
      url,
    }
  } finally {
    await browser.close()
  }
}
