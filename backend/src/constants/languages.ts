/**
 * Supported languages for chatbot replies.
 *
 * - `name`        — English name, used in admin UI and logs.
 * - `nativeName`  — Native script name, used in the user-facing language switcher.
 * - `promptName`  — String injected into the system prompt. Includes the script
 *                   in parentheses for non-Latin languages so the LLM is
 *                   unambiguous about which writing system to use.
 */
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', promptName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español', promptName: 'Spanish (Español)' },
  fr: { name: 'French', nativeName: 'Français', promptName: 'French (Français)' },
  de: { name: 'German', nativeName: 'Deutsch', promptName: 'German (Deutsch)' },
  it: { name: 'Italian', nativeName: 'Italiano', promptName: 'Italian (Italiano)' },
  pt: { name: 'Portuguese', nativeName: 'Português', promptName: 'Portuguese (Português)' },
  ru: { name: 'Russian', nativeName: 'Русский', promptName: 'Russian (Русский, Cyrillic script)' },
  zh: { name: 'Chinese', nativeName: '中文', promptName: 'Chinese (中文, Simplified Chinese script)' },
  ja: { name: 'Japanese', nativeName: '日本語', promptName: 'Japanese (日本語)' },
  ko: { name: 'Korean', nativeName: '한국어', promptName: 'Korean (한국어, Hangul script)' },
  ar: { name: 'Arabic', nativeName: 'العربية', promptName: 'Arabic (العربية, Arabic script)' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', promptName: 'Hindi (हिन्दी, Devanagari script)' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', promptName: 'Bengali (বাংলা, Bengali script)' },
  ur: { name: 'Urdu', nativeName: 'اردو', promptName: 'Urdu (اردو, Perso-Arabic script)' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', promptName: 'Tamil (தமிழ், Tamil script)' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', promptName: 'Telugu (తెలుగు, Telugu script)' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', promptName: 'Malayalam (മലയാളം, Malayalam script)' },
  mr: { name: 'Marathi', nativeName: 'मराठी', promptName: 'Marathi (मराठी, Devanagari script)' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', promptName: 'Gujarati (ગુજરાતી, Gujarati script)' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', promptName: 'Punjabi (ਪੰਜਾਬੀ, Gurmukhi script)' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', promptName: 'Turkish (Türkçe)' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', promptName: 'Dutch (Nederlands)' },
  pl: { name: 'Polish', nativeName: 'Polski', promptName: 'Polish (Polski)' },
  sv: { name: 'Swedish', nativeName: 'Svenska', promptName: 'Swedish (Svenska)' },
  da: { name: 'Danish', nativeName: 'Dansk', promptName: 'Danish (Dansk)' },
  no: { name: 'Norwegian', nativeName: 'Norsk', promptName: 'Norwegian (Norsk)' },
  fi: { name: 'Finnish', nativeName: 'Suomi', promptName: 'Finnish (Suomi)' },
  el: { name: 'Greek', nativeName: 'Ελληνικά', promptName: 'Greek (Ελληνικά, Greek script)' },
  he: { name: 'Hebrew', nativeName: 'עברית', promptName: 'Hebrew (עברית, Hebrew script)' },
  th: { name: 'Thai', nativeName: 'ไทย', promptName: 'Thai (ไทย, Thai script)' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', promptName: 'Vietnamese (Tiếng Việt)' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', promptName: 'Indonesian (Bahasa Indonesia)' },
  ms: { name: 'Malay', nativeName: 'Bahasa Melayu', promptName: 'Malay (Bahasa Melayu)' },
  fa: { name: 'Persian', nativeName: 'فارسی', promptName: 'Persian (فارسی, Perso-Arabic script)' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', promptName: 'Ukrainian (Українська, Cyrillic script)' },
  cs: { name: 'Czech', nativeName: 'Čeština', promptName: 'Czech (Čeština)' },
  ro: { name: 'Romanian', nativeName: 'Română', promptName: 'Romanian (Română)' },
  hu: { name: 'Hungarian', nativeName: 'Magyar', promptName: 'Hungarian (Magyar)' },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function isSupportedLanguage(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES
}

export function getLanguageMeta(code: string) {
  return isSupportedLanguage(code) ? SUPPORTED_LANGUAGES[code] : SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
}
