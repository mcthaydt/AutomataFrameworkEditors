// Korean, Japanese and Chinese get their own partner font, and only the language the person speaks is downloaded.
import type { Lang } from '../words/words.ts'

const loaded = new Set<Lang>()

/** Loads the partner font of `lang`, once. Other languages need none (the three families cover them). */
export async function loadLanguageFont(lang: Lang): Promise<void> {
  if (loaded.has(lang)) return
  loaded.add(lang)
  if (lang === 'ko') {
    await Promise.all([
      import('@fontsource/noto-sans-kr/400.css'),
      import('@fontsource/noto-sans-kr/600.css'),
    ])
  } else if (lang === 'ja') {
    await Promise.all([
      import('@fontsource/noto-sans-jp/400.css'),
      import('@fontsource/noto-sans-jp/600.css'),
    ])
  } else if (lang === 'zh') {
    await Promise.all([
      import('@fontsource/noto-sans-sc/400.css'),
      import('@fontsource/noto-sans-sc/600.css'),
    ])
  }
}
