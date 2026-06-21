# Chatvio — Marketing Website Content & Design System

The spec for Chatvio's public marketing site (the page a logged-out visitor sees).
This is **not** the in-app dashboard (`frontend/src/feature/Landing/Landing.tsx`) — that
is the authenticated home. This is a brand-new marketing landing page.

All copy below is final and ready to paste. Headers are short (3–6 words); subheaders are
one sentence. Color/type tokens are defined once (sections 2–3) and reused everywhere.

---

## 1. Positioning

| | |
|---|---|
| **Product** | Chatvio |
| **Category** | AI agent / chatbot builder (RAG) |
| **One-liner** | Build AI agents your customers can talk to. |
| **What it is** | Train an AI agent on your business data, give it real actions (booking, lead capture), pick any model, and embed it on your site in minutes. |
| **Who it's for** | Businesses & teams that want an accurate, on-brand AI agent on their website. |
| **Proof points** | Grounded in your data · takes real actions · any model per agent · live in minutes. |

**SEO meta**
- **Title:** `Chatvio — Build AI agents your customers can talk to`
- **Description:** `Train a custom AI agent on your data, give it actions like booking and lead capture, and embed it on your site in minutes. Powered by GPT-5, Claude, Gemini and more.`

---

## 2. Color system — "Crisp Indigo"

White-dominant, near-black headers, a single indigo accent, soft tints for section
backgrounds. Deliberately **not** the app's coral (`#fe5e51`) — the coral logo stays as a
small warm mark in the navbar. Scope these tokens to the marketing site (e.g. a `.site`
wrapper) so they don't collide with the app's existing `--color-*` tokens.

```css
:root {
  /* Surfaces */
  --site-canvas:      #FFFFFF;  /* page background */
  --site-surface:     #FFFFFF;  /* cards (with border) */
  --site-tint-1:      #F8FAFC;  /* alt section background (slate-50) */
  --site-tint-2:      #EEF2FF;  /* accent-soft section / chips (indigo-50) */
  --site-ink-band:    #0F172A;  /* dark CTA band / footer background */

  /* Text */
  --site-ink:         #0F172A;  /* ALL headers / titles */
  --site-ink-soft:    #334155;  /* strong body, list items */
  --site-subtext:     #64748B;  /* ALL subheaders + body copy */
  --site-muted:       #94A3B8;  /* captions, meta, disabled */
  --site-on-dark:     #FFFFFF;  /* text on the dark band */
  --site-on-dark-sub: #94A3B8;  /* subtext on the dark band */

  /* Accent (indigo) */
  --site-accent:       #4F46E5; /* buttons, links, active tab, icons */
  --site-accent-hover: #4338CA; /* hover/pressed */
  --site-accent-soft:  #EEF2FF; /* accent backgrounds, icon chips */
  --site-accent-ring:  rgba(79, 70, 229, 0.35); /* focus ring */

  /* Lines & status */
  --site-border:      #E2E8F0;  /* card & divider borders (slate-200) */
  --site-border-soft: #EEF1F5;  /* hairlines */
  --site-success:     #10B981;
  --site-warning:     #F59E0B;
}
```

**Usage rules**
- **Headers** (every H1/H2/H3) → `--site-ink`. Never colored.
- **Subheaders & body** → `--site-subtext`.
- **Eyebrows / kickers** → `--site-accent` (the only place small text goes indigo).
- **Accent is rationed**: primary buttons, links, active states, icon chips, one keyword
  highlight per headline max. Everything else is ink / subtext / borders.
- **Section rhythm**: alternate `--site-canvas` and `--site-tint-1`; use `--site-tint-2`
  sparingly for one "feature spotlight" block. The final CTA band uses `--site-ink-band`.
- **Gradients** (optional, for hero/visual frames): soft indigo radial,
  `radial-gradient(60% 60% at 70% 20%, #EEF2FF, transparent 70%)`.

---

## 3. Typography system

Font: **Inter** (matches the app). Optional tighter display alternative for headlines:
**Inter Tight** or **Inter** with `letter-spacing: -0.02em`. One strict scale — every piece
of text maps to a role below. Sizes use `clamp()` so they scale fluidly mobile → desktop.

| Role | Token / use | Size (clamp) | Weight | Line height | Tracking | Color |
|---|---|---|---|---|---|---|
| **Display** | Hero H1 | `clamp(2.75rem, 5vw, 4rem)` · 44→64px | 700 | 1.05 | -0.02em | `--site-ink` |
| **H2** | Section title | `clamp(2rem, 3.5vw, 2.5rem)` · 32→40px | 700 | 1.1 | -0.02em | `--site-ink` |
| **H3** | Card / feature / tab title | `1.25rem` · 20px | 600 | 1.3 | -0.01em | `--site-ink` |
| **Eyebrow** | Section kicker (uppercase) | `0.8125rem` · 13px | 600 | 1.2 | 0.08em | `--site-accent` |
| **Lead** | Subheader under H1 | `clamp(1.125rem, 1.6vw, 1.25rem)` · 18→20px | 400 | 1.5 | 0 | `--site-subtext` |
| **Subhead** | Subheader under H2 | `1.125rem` · 18px | 400 | 1.55 | 0 | `--site-subtext` |
| **Body** | Paragraphs | `1rem` · 16px | 400 | 1.6 | 0 | `--site-subtext` |
| **Card body** | Card / tab copy | `0.9375rem` · 15px | 400 | 1.55 | 0 | `--site-subtext` |
| **Small** | Captions, meta, trust line | `0.8125rem` · 13px | 500 | 1.4 | 0 | `--site-muted` |
| **Button** | CTA label | `0.9375rem` · 15px | 600 | 1 | 0 | white / accent |
| **Nav link** | Navbar items | `0.9375rem` · 15px | 500 | 1 | 0 | `--site-ink-soft` |

**The header/subheader pattern (what you asked for):** headers are always **ink**, big,
700/600, tight tracking; subheaders are always **subtext**, ~60% the header size, 400, normal
tracking. Eyebrows are the only accent-colored, smallest, uppercase, wide-tracked element —
they sit *above* the header. This 3-part stack (eyebrow → header → subheader) repeats in
every section so the rhythm is consistent.

```
EYEBROW            13px / 600 / uppercase / indigo
Section Header      40px / 700 / ink
One-sentence subheader that explains it.   18px / 400 / subtext
```

**Spacing scale** (8px base): 4, 8, 12, 16, 24, 32, 48, 64, 96. Section vertical padding:
`96px` desktop / `64px` mobile. Max content width: `1200px`. Card radius: `16px`. Button
radius: `10px`.

---

## 4. Page structure — "how many pages?"

**v1 = one marketing landing page**, built from 9 stacked sections + a sticky navbar and a
footer. The five blocks you described map directly onto sections 4–7 below. Add standalone
routed pages later only when you have the content for them.

| # | Section | Purpose | Background |
|---|---|---|---|
| 0 | **Navbar** (sticky) | Brand + nav + sign-in/CTA | canvas, blurs on scroll |
| 1 | **Hero** | Headline + subhead + CTA + visual (your gif) | canvas |
| 2 | **Model strip** *(optional)* | "Powered by" model logos / social proof | tint-1 |
| 3 | **Highlights** | 3–4 value cards | canvas |
| 4 | **How it works** | Interactive 5-step selector + visual | tint-1 |
| 5 | **Features** | Image-topped card grid (8 cards) | canvas |
| 6 | **Explore** | Full-bleed tabs, big visual per tab | tint-2 / per-tab |
| 7 | **Final CTA band** | Last conversion push | ink-band (dark) |
| 8 | **Footer** | Links, legal, social | tint-1 |

**Later (separate routes), when ready:** `/pricing`, `/use-cases` (or per-use-case pages),
`/docs`, `/blog`, `/changelog`. The navbar already links to these so they can ship
incrementally.

---

## 5. Navbar

- **Left:** Chatvio logo (coral wave mark + wordmark).
- **Center/left links:** `Features` · `How it works` · `Use cases` · `Pricing` · `Docs`
- **Right:** `Sign in` (text link, ink-soft) + **`Get started free`** (accent button).
- **Behavior:** sticky; transparent over hero, then white with a `--site-border-soft` bottom
  line + subtle blur once scrolled. Mobile: logo + hamburger → full-screen menu with the same
  links and a full-width accent CTA at the bottom.

---

## 6. Hero

```
Eyebrow:    AI AGENT PLATFORM
Header:     Build AI agents your customers can talk to
Subheader:  Train Chatvio on your content, give it actions like booking and
            lead capture, and embed it on your site — live in minutes.
Primary CTA:   Build your agent — free
Secondary CTA: See how it works        (smooth-scrolls to "How it works")
Trust line:    No credit card needed · Powered by GPT-5, Claude, Gemini & more
Right side:    [ your gif / product visual ]
```

**Headline alternates** (swap in if you prefer):
- The AI agent your customers actually trust
- Custom AI agents, trained on your business
- Turn your content into an agent that takes action

*Tip:* highlight one word of the H1 in `--site-accent` (e.g. **talk**) — the only accent in
the headline.

---

## 7. Model strip *(optional social proof)*

```
Small label:  POWERED BY THE MODELS YOU KNOW
Logos:        OpenAI · Anthropic · Google · Meta · DeepSeek
```
Muted, grayscale logos on `--site-tint-1`. Swap for customer logos once you have them
("Trusted by teams at …").

---

## 8. Highlights (3–4 cards)

```
Eyebrow:    WHY CHATVIO
Header:     Not just a chatbot. An agent that acts.
Subheader:  Everything you need to launch an AI agent that's accurate, on-brand,
            and genuinely useful.
```

| # | Card title | Card body |
|---|---|---|
| 1 | **Grounded in your data** | Answers come straight from your docs, pages, and Q&A — not guesswork. |
| 2 | **Takes real actions** | Books appointments and captures leads right inside the chat. |
| 3 | **Any model, per agent** | Choose GPT-5, Claude 4.5, Gemini 2.5, Llama, or DeepSeek. Swap anytime. |
| 4 | **Live in minutes** | Drop in one line of code — widget or iframe, with domain control built in. |

Card style: white surface, `--site-border`, 16px radius, an indigo icon chip
(`--site-accent-soft` bg + `--site-accent` icon) above the title.

---

## 9. How it works (interactive selector)

Left: clickable list of 5 steps (active item gets an indigo left-border + ink title; others
muted). Right: the gif/video for the selected step. Matches your "feature name + subheader"
pattern.

```
Eyebrow:    HOW IT WORKS
Header:     From your content to a live agent in five steps
Subheader:  Pick a step to see it in action.
```

| Step | Name (header) | Subheader |
|---|---|---|
| 1 | **Train on your data** | Upload PDFs, docs, and text, add Q&A, or crawl your website — Chatvio turns it all into searchable knowledge. |
| 2 | **Shape its personality** | Answer a few guided questions and Chatvio writes a tuned system prompt: role, tone, capabilities, and guardrails. |
| 3 | **Give it actions** | Switch on booking and lead capture; your agent spots the intent and runs the flow mid-conversation. |
| 4 | **Make it yours** | Set brand colors, light or dark mode, and a welcome message, then test it all in the live playground. |
| 5 | **Deploy & track** | Embed as a widget or iframe, then watch conversations, ratings, and visitor locations in analytics. |

---

## 10. Features (image-topped card grid)

```
Eyebrow:    FEATURES
Header:     Everything your agent needs
Subheader:  A complete toolkit to build, train, and run production AI agents.
```

3-column grid (1-col mobile). Each card: image/illustration on top, then title (H3), then
one-line body.

| # | Title | Body | Visual idea |
|---|---|---|---|
| 1 | **Any AI model** | GPT-5, Claude 4.5, Gemini 2.5, Llama 3.3, DeepSeek R1 — choose per agent. | Model logos grid |
| 2 | **Knowledge base (RAG)** | Vector search keeps every answer grounded in your own content. | Docs → vectors |
| 3 | **Website crawling** | Point Chatvio at a URL and it learns your entire site. | Globe / crawl |
| 4 | **In-chat booking** | Real-time availability, a slot picker, and email confirmations. | Calendar |
| 5 | **Lead capture** | Collect names and emails without leaving the conversation. | Contact card |
| 6 | **Agent tuning** | A guided prompt builder for identity, tone, capabilities, and guardrails. | Prompt UI |
| 7 | **Brand customization** | Light/dark, brand colors, bubble styling, and welcome messages. | Widget mock |
| 8 | **Analytics & history** | Messages, sessions, locations, and ratings — export as JSON, CSV, or PDF. | Charts |

---

## 11. Explore (full-bleed tabs)

Big tabbed showcase. Tab row at top (active tab = indigo underline + ink label). Each panel
is a full-width header + subheader + large visual on a soft background. Mirrors your
"Sync with real-time data" example, but kept truthful to what Chatvio actually does.

```
Eyebrow:    EXPLORE
Header:     See what your agent can do
```

| Tab | Heading | Subheading |
|---|---|---|
| 1 | **Answers grounded in your data** | Every reply is pulled from your documents, pages, and Q&A pairs — so your agent stays accurate and on-brand, and never makes things up. |
| 2 | **Actions, not just answers** | Chatvio detects intent mid-chat and runs real flows — booking an appointment or capturing a lead — without ever leaving the conversation. |
| 3 | **Booking built in** | Set weekly and date-specific availability; customers pick a slot in the chat and get an email confirmation automatically. |
| 4 | **Your model, your call** | Match cost and quality to each use case — switch between GPT-5, Claude, Gemini, Llama, and DeepSeek per agent, anytime. |
| 5 | **Deploy with control** | Ship as a widget or iframe and whitelist exactly which domains can load it. Your agent goes live on your site in minutes. |

> **Optional roadmap tab** (only add if you're comfortable signaling what's coming):
> **Connect your systems** — *Sync your agent with order management tools, CRMs, and helpdesk
> platforms to pull live data into every conversation.* This is the closest match to your
> chatbase example, but Chatvio doesn't ship integrations yet — keep it out of v1 unless you
> want an aspirational "coming soon" tab.

Per-tab backgrounds: rotate `--site-tint-2`, `--site-tint-1`, and white to keep panels
distinct; visual sits in a rounded frame with the soft indigo radial behind it.

---

## 12. Final CTA band (dark)

Background `--site-ink-band`; white text; accent button.

```
Header:     Build your first agent today
Subheader:  Free to start. No credit card. Live in minutes.
Primary CTA:   Get started free        (accent button)
Secondary CTA: Book a demo             (ghost button, white border)
```

---

## 13. Footer

Background `--site-tint-1`, top hairline `--site-border`.

| Product | Use cases | Resources | Company |
|---|---|---|---|
| Features | Customer support | Docs | About |
| How it works | Lead generation | API reference | Blog |
| Pricing | Appointment booking | Guides | Contact |
| Playground | FAQ deflection | Status | Careers |
| Changelog | | | |

**Bottom bar:** Chatvio logo · `© 2026 Chatvio. All rights reserved.` · social icons
(X, LinkedIn, GitHub) · `Privacy` · `Terms`.

---

## 14. Microcopy bank

- **Buttons:** `Get started free` · `Build your agent` · `See how it works` · `Book a demo` · `Talk to sales`
- **Badges / trust:** `No credit card` · `Live in minutes` · `Cancel anytime`
- **Empty/aspirational hooks:** `Your next customer conversation, automated.`

---

## 15. Build notes (when you implement it)

- Stack fits the existing frontend: React 19 + Mantine 8 + Tailwind 4. Put it under
  `frontend/src/feature/website/` (e.g. `Website.tsx` composing `Navbar`, `Hero`,
  `Highlights`, `HowItWorks`, `Features`, `Explore`, `CtaBand`, `Footer`), lazy-loaded as the
  public `/` route in `App.tsx` (the current `Landing` becomes the authenticated home).
- Scope the section-2 tokens to a `.site` wrapper class so marketing `--site-*` vars never
  collide with the app's `--color-*` tokens.
- Per the testing policy, add a `Website.test.tsx` (and per-section tests) following
  `frontend/src/feature/Landing/Landing.test.tsx`.
- Reserve right-side `gif/visual` slots as fixed-aspect boxes (e.g. `aspect-[4/3]`) so the
  layout doesn't shift when you drop media in.
</content>
</invoke>
