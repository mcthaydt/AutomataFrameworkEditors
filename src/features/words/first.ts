// The first run: the language card that comes before everything else. The welcome and the tour add their rows here.
import type { Area } from './languages.ts'

export const first = {
  en: {
    languageTitle: 'Choose your language',
    languageHint: 'You can change it any time in Settings.',
    languageUse: (name) => `Use ${name}`,
  },
  es: {
    languageTitle: 'Elige tu idioma',
    languageHint: 'Puedes cambiarlo cuando quieras en Ajustes.',
    languageUse: (name) => `Usar ${name}`,
  },
  ko: {
    languageTitle: '언어를 선택하세요',
    languageHint: '설정에서 언제든 바꿀 수 있어요.',
    languageUse: (name) => `${name} 사용`,
  },
  ja: {
    languageTitle: '言語を選んでください',
    languageHint: '設定でいつでも変えられます。',
    languageUse: (name) => `${name}を使う`,
  },
  zh: {
    languageTitle: '请选择语言',
    languageHint: '你可以随时在设置中更改。',
    languageUse: (name) => `使用${name}`,
  },
  pt: {
    languageTitle: 'Escolha seu idioma',
    languageHint: 'Você pode mudar quando quiser em Ajustes.',
    languageUse: (name) => `Usar ${name}`,
  },
  fr: {
    languageTitle: 'Choisissez votre langue',
    languageHint: 'Vous pouvez la changer à tout moment dans Réglages.',
    languageUse: (name) => `Utiliser ${name}`,
  },
  ru: {
    languageTitle: 'Выберите язык',
    languageHint: 'Её можно сменить в любой момент в настройках.',
    languageUse: (name) => `Выбрать: ${name}`,
  },
  de: {
    languageTitle: 'Wähle deine Sprache',
    languageHint: 'Du kannst das jederzeit in den Einstellungen ändern.',
    languageUse: (name) => `${name} verwenden`,
  },
} as const satisfies Area<'languageTitle' | 'languageHint' | 'languageUse'>
