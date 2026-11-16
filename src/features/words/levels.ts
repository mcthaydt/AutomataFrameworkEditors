// The words a level on screen says: the small map, the marks over the level, and what picking, placing and erasing tell
// a person. A row that is a function takes what it names ("Crate 1", "3"). Every language has every row.
import type { Area } from './languages.ts'

type Key = 'miniMap' | 'miniMapBox' | 'miniMapAt'

export const levels = {
  en: {
    miniMap: 'Where you are in the level',
    miniMapBox: 'The part you can see',
    miniMapAt: (across, down) => `Showing the part near ${across} across and ${down} down`,
  },
  es: {
    miniMap: 'Dónde estás en el nivel',
    miniMapBox: 'La parte que ves',
    miniMapAt: (across, down) => `Mostrando la parte cerca de ${across} a lo ancho y ${down} hacia abajo`,
  },
  ko: {
    miniMap: '레벨에서 지금 있는 곳',
    miniMapBox: '보이는 부분',
    miniMapAt: (across, down) => `가로 ${across}, 세로 ${down} 근처를 보는 중`,
  },
  ja: {
    miniMap: 'レベルの中の今いる場所',
    miniMapBox: '見えている部分',
    miniMapAt: (across, down) => `横${across}、縦${down}あたりを表示中`,
  },
  zh: {
    miniMap: '你在关卡中的位置',
    miniMapBox: '你能看到的部分',
    miniMapAt: (across, down) => `正在显示横向${across}、纵向${down}附近`,
  },
  pt: {
    miniMap: 'Onde você está no nível',
    miniMapBox: 'A parte que você vê',
    miniMapAt: (across, down) => `Mostrando a parte perto de ${across} na horizontal e ${down} na vertical`,
  },
  fr: {
    miniMap: 'Où vous êtes dans le niveau',
    miniMapBox: 'La partie que vous voyez',
    miniMapAt: (across, down) => `Partie affichée : autour de ${across} en largeur et ${down} en hauteur`,
  },
  ru: {
    miniMap: 'Где вы на уровне',
    miniMapBox: 'Видимая часть',
    miniMapAt: (across, down) => `Показана часть около ${across} по горизонтали и ${down} по вертикали`,
  },
  de: {
    miniMap: 'Wo du im Level bist',
    miniMapBox: 'Der Teil, den du siehst',
    miniMapAt: (across, down) => `Zeigt den Teil bei ${across} quer und ${down} nach unten`,
  },
} as const satisfies Area<Key>
