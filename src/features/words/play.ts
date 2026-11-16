// The words playing a level in place says: the bar under the game, the one tip on the first Play, and what is said when a
// level cannot be played. The top bar's Play and Stop are in `bar.ts`. Every language has every row.
import type { Area } from './languages.ts'

type Key =
  | 'playBar'
  | 'game'
  | 'pause'
  | 'goOn'
  | 'again'
  | 'bigger'
  | 'biggerAbout'
  | 'smaller'
  | 'smallerAbout'
  | 'tipCode'
  | 'cantPlay'
  | 'cantPlayNothing'

export const play = {
  en: {
    playBar: 'Play controls',
    game: 'The level, playing',
    pause: 'Pause',
    goOn: 'Go on',
    again: 'Start again',
    bigger: 'Bigger',
    biggerAbout: 'Hide the panels while you play',
    smaller: 'Smaller',
    smallerAbout: 'Bring the panels back',
    tipCode:
      "Play shows the level, its things and the hero's moves as the game's files make them. Rules the game's makers wrote in code don't run here.",
    cantPlay: "This level can't be played yet. Here is what needs mending:",
    cantPlayNothing: "This level can't be played right now. Try again.",
  },
  es: {
    playBar: 'Controles del juego',
    game: 'El nivel, en juego',
    pause: 'Pausa',
    goOn: 'Seguir',
    again: 'Empezar de nuevo',
    bigger: 'Más grande',
    biggerAbout: 'Oculta los paneles mientras juegas',
    smaller: 'Más pequeño',
    smallerAbout: 'Vuelve a mostrar los paneles',
    tipCode:
      'Jugar muestra el nivel, sus cosas y los movimientos del héroe tal como los hacen los archivos del juego. Las reglas que los creadores escribieron en código no funcionan aquí.',
    cantPlay: 'Este nivel todavía no se puede jugar. Esto hay que arreglar:',
    cantPlayNothing: 'Este nivel no se puede jugar ahora. Inténtalo otra vez.',
  },
  ko: {
    playBar: '플레이 조작',
    game: '플레이 중인 레벨',
    pause: '일시 정지',
    goOn: '계속하기',
    again: '처음부터 다시',
    bigger: '크게',
    biggerAbout: '플레이하는 동안 패널을 숨겨요',
    smaller: '작게',
    smallerAbout: '패널을 다시 보여요',
    tipCode:
      '플레이에서는 게임 파일에 적힌 대로 레벨과 사물, 영웅의 움직임이 보여요. 게임 제작자가 코드로 쓴 규칙은 여기서 작동하지 않아요.',
    cantPlay: '이 레벨은 아직 플레이할 수 없어요. 고쳐야 할 점이에요:',
    cantPlayNothing: '지금은 이 레벨을 플레이할 수 없어요. 다시 해 보세요.',
  },
  ja: {
    playBar: 'プレイの操作',
    game: 'プレイ中のレベル',
    pause: '一時停止',
    goOn: '続ける',
    again: 'はじめからやり直す',
    bigger: '大きく',
    biggerAbout: 'プレイ中はパネルを隠します',
    smaller: '小さく',
    smallerAbout: 'パネルをもとに戻します',
    tipCode:
      'プレイでは、ゲームのファイルのとおりにレベルと物、主人公の動きが表示されます。ゲームの作り手がコードで書いたルールは、ここでは動きません。',
    cantPlay: 'このレベルはまだプレイできません。直す必要があるところです:',
    cantPlayNothing: 'いまはこのレベルをプレイできません。もう一度試してください。',
  },
  zh: {
    playBar: '试玩控制',
    game: '正在试玩的关卡',
    pause: '暂停',
    goOn: '继续',
    again: '重新开始',
    bigger: '放大',
    biggerAbout: '试玩时隐藏面板',
    smaller: '缩小',
    smallerAbout: '把面板放回来',
    tipCode: '试玩会按游戏文件显示关卡、物体和主角的动作。游戏作者用代码写的规则在这里不会运行。',
    cantPlay: '这个关卡暂时还不能试玩。需要修好的地方:',
    cantPlayNothing: '现在无法试玩这个关卡，请再试一次。',
  },
  pt: {
    playBar: 'Controles do jogo',
    game: 'A fase, em jogo',
    pause: 'Pausar',
    goOn: 'Continuar',
    again: 'Começar de novo',
    bigger: 'Maior',
    biggerAbout: 'Esconde os painéis enquanto você joga',
    smaller: 'Menor',
    smallerAbout: 'Traz os painéis de volta',
    tipCode:
      'Jogar mostra a fase, as suas coisas e os movimentos do herói como os arquivos do jogo os fazem. As regras que os criadores escreveram em código não funcionam aqui.',
    cantPlay: 'Esta fase ainda não pode ser jogada. Isto precisa ser consertado:',
    cantPlayNothing: 'Esta fase não pode ser jogada agora. Tente de novo.',
  },
  fr: {
    playBar: 'Commandes du jeu',
    game: 'Le niveau, en jeu',
    pause: 'Pause',
    goOn: 'Reprendre',
    again: 'Recommencer',
    bigger: 'Plus grand',
    biggerAbout: 'Cache les panneaux pendant que vous jouez',
    smaller: 'Plus petit',
    smallerAbout: 'Ramène les panneaux',
    tipCode:
      'Jouer montre le niveau, ses éléments et les mouvements du héros tels que les fichiers du jeu les font. Les règles que les créateurs ont écrites en code ne fonctionnent pas ici.',
    cantPlay: "Ce niveau ne peut pas encore être joué. Voici ce qu'il faut réparer :",
    cantPlayNothing: 'Ce niveau ne peut pas être joué pour le moment. Réessayez.',
  },
  ru: {
    playBar: 'Управление игрой',
    game: 'Уровень, идёт игра',
    pause: 'Пауза',
    goOn: 'Продолжить',
    again: 'Начать заново',
    bigger: 'Крупнее',
    biggerAbout: 'Скрыть панели на время игры',
    smaller: 'Меньше',
    smallerAbout: 'Вернуть панели',
    tipCode:
      'В игре показаны уровень, его предметы и движения героя так, как их задают файлы игры. Правила, которые создатели написали кодом, здесь не работают.',
    cantPlay: 'Этот уровень пока нельзя запустить. Вот что нужно исправить:',
    cantPlayNothing: 'Сейчас этот уровень нельзя запустить. Попробуйте ещё раз.',
  },
  de: {
    playBar: 'Spielsteuerung',
    game: 'Das Level, im Spiel',
    pause: 'Pause',
    goOn: 'Weiter',
    again: 'Neu starten',
    bigger: 'Größer',
    biggerAbout: 'Blendet die Felder beim Spielen aus',
    smaller: 'Kleiner',
    smallerAbout: 'Holt die Felder zurück',
    tipCode:
      'Spielen zeigt das Level, seine Dinge und die Bewegungen des Helden so, wie die Dateien des Spiels sie festlegen. Regeln, die die Macher im Code geschrieben haben, laufen hier nicht.',
    cantPlay: 'Dieses Level lässt sich noch nicht spielen. Das muss repariert werden:',
    cantPlayNothing: 'Dieses Level lässt sich gerade nicht spielen. Versuche es noch einmal.',
  },
} as const satisfies Area<Key>
