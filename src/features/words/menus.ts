// The words the top bar's three menus say: the game's menu, the six editors and the parts of an editor. An editor that
// is not built is drawn as it will be and says in plain words that it is not in this version yet; no row says "Soon"
// or "Comes later".
import type { Area } from './languages.ts'

type Key =
  | 'whoCanChange'
  | 'waitingRow'
  | 'keepCopyOf'
  | 'keepCopyAbout'
  | 'yourGames'
  | 'yourGamesAbout'
  | 'signIn'
  | 'signOut'
  | 'goTo'
  | 'inWorld'
  | 'sixEditors'
  | 'youAreHere'
  | 'allLevels'
  | 'partLevels'
  | 'partLevelsAbout'
  | 'gameMenu'
  | 'editorWorld'
  | 'editorWorldAbout'
  | 'editorCharacters'
  | 'editorCharactersAbout'
  | 'editorFeel'
  | 'editorFeelAbout'
  | 'editorSound'
  | 'editorSoundAbout'
  | 'editorStory'
  | 'editorStoryAbout'
  | 'editorScreens'
  | 'editorScreensAbout'
  | 'noteCharacters'
  | 'noteFeel'
  | 'noteSound'
  | 'noteStory'
  | 'noteScreens'

export const menus = {
  en: {
    whoCanChange: 'Who can change it',
    waitingRow: (n) => (Number(n) === 1 ? '1 change is waiting' : `${n} changes are waiting`),
    keepCopyOf: (name) => `Keep a copy of ${name}`,
    keepCopyAbout: 'As a file, to give to your helper',
    yourGames: 'Your games',
    yourGamesAbout: 'Open another game',
    signIn: 'Sign in',
    signOut: 'Sign out',
    goTo: 'Go to',
    inWorld: 'In World',
    sixEditors: 'The six editors',
    youAreHere: 'You are here',
    allLevels: 'All levels',
    partLevels: 'Levels',
    partLevelsAbout: 'Put things in a level',
    gameMenu: 'The game’s menu',
    editorWorld: 'World',
    editorWorldAbout: 'Levels and the world map',
    editorCharacters: 'Characters',
    editorCharactersAbout: 'Who is in the game and how they move',
    editorFeel: 'Feel',
    editorFeelAbout: 'How the game feels to play',
    editorSound: 'Sound',
    editorSoundAbout: 'Music and sounds',
    editorStory: 'Story',
    editorStoryAbout: 'Words, talk and scenes',
    editorScreens: 'Screens',
    editorScreensAbout: 'Menus, pause and what a player sees',
    noteCharacters:
      'Characters is not in this version yet. It will be where you decide who is in the game and how they move.',
    noteFeel: 'Feel is not in this version yet. It will be where you tune how the game feels to play.',
    noteSound: 'Sound is not in this version yet. It will be where you choose the music and the sounds.',
    noteStory: 'Story is not in this version yet. It will be where you write what people say and what happens.',
    noteScreens:
      'Screens is not in this version yet. It will be where you make the menus and what a player sees.',
  },
  es: {
    whoCanChange: 'Quién puede cambiarlo',
    waitingRow: (n) => (Number(n) === 1 ? '1 cambio está esperando' : `${n} cambios están esperando`),
    keepCopyOf: (name) => `Guardar una copia de ${name}`,
    keepCopyAbout: 'Como archivo, para dárselo a tu ayudante',
    yourGames: 'Tus juegos',
    yourGamesAbout: 'Abrir otro juego',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    goTo: 'Ir a',
    inWorld: 'En Mundo',
    sixEditors: 'Los seis editores',
    youAreHere: 'Estás aquí',
    allLevels: 'Todos los niveles',
    partLevels: 'Niveles',
    partLevelsAbout: 'Pon cosas en un nivel',
    gameMenu: 'El menú del juego',
    editorWorld: 'Mundo',
    editorWorldAbout: 'Niveles y el mapa del mundo',
    editorCharacters: 'Personajes',
    editorCharactersAbout: 'Quién está en el juego y cómo se mueve',
    editorFeel: 'Sensación',
    editorFeelAbout: 'Cómo se siente jugar',
    editorSound: 'Sonido',
    editorSoundAbout: 'Música y sonidos',
    editorStory: 'Historia',
    editorStoryAbout: 'Palabras, charlas y escenas',
    editorScreens: 'Pantallas',
    editorScreensAbout: 'Menús, pausa y lo que ve quien juega',
    noteCharacters:
      'Personajes todavía no está en esta versión. Será donde decidas quién está en el juego y cómo se mueve.',
    noteFeel:
      'Sensación todavía no está en esta versión. Será donde ajustes cómo se siente jugar.',
    noteSound:
      'Sonido todavía no está en esta versión. Será donde elijas la música y los sonidos.',
    noteStory:
      'Historia todavía no está en esta versión. Será donde escribas lo que dice la gente y lo que pasa.',
    noteScreens:
      'Pantallas todavía no está en esta versión. Será donde hagas los menús y lo que ve quien juega.',
  },
  ko: {
    whoCanChange: '누가 바꿀 수 있나요',
    waitingRow: (n) => `변경 ${n}개가 기다리고 있어요`,
    keepCopyOf: (name) => `${name} 사본 저장`,
    keepCopyAbout: '도우미에게 줄 파일로',
    yourGames: '내 게임',
    yourGamesAbout: '다른 게임 열기',
    signIn: '로그인',
    signOut: '로그아웃',
    goTo: '이동',
    inWorld: '월드 안',
    sixEditors: '여섯 가지 편집기',
    youAreHere: '지금 여기예요',
    allLevels: '모든 레벨',
    partLevels: '레벨',
    partLevelsAbout: '레벨에 물건 놓기',
    gameMenu: '게임 메뉴',
    editorWorld: '월드',
    editorWorldAbout: '레벨과 월드 지도',
    editorCharacters: '캐릭터',
    editorCharactersAbout: '누가 나오고 어떻게 움직이는지',
    editorFeel: '조작감',
    editorFeelAbout: '플레이할 때의 느낌',
    editorSound: '소리',
    editorSoundAbout: '음악과 효과음',
    editorStory: '이야기',
    editorStoryAbout: '말, 대화, 장면',
    editorScreens: '화면',
    editorScreensAbout: '메뉴, 일시정지, 플레이어가 보는 것',
    noteCharacters:
      '캐릭터는 아직 이 버전에 없어요. 누가 게임에 나오고 어떻게 움직일지 정하는 곳이 될 거예요.',
    noteFeel: '조작감은 아직 이 버전에 없어요. 플레이할 때의 느낌을 맞추는 곳이 될 거예요.',
    noteSound: '소리는 아직 이 버전에 없어요. 음악과 효과음을 고르는 곳이 될 거예요.',
    noteStory: '이야기는 아직 이 버전에 없어요. 사람들이 하는 말과 벌어지는 일을 쓰는 곳이 될 거예요.',
    noteScreens: '화면은 아직 이 버전에 없어요. 메뉴와 플레이어가 보는 것을 만드는 곳이 될 거예요.',
  },
  ja: {
    whoCanChange: '変更できる人',
    waitingRow: (n) => `変更${n}件が待っています`,
    keepCopyOf: (name) => `${name}のコピーを残す`,
    keepCopyAbout: 'ファイルとして、手伝う人に渡せます',
    yourGames: 'あなたのゲーム',
    yourGamesAbout: '別のゲームを開く',
    signIn: 'ログイン',
    signOut: 'ログアウト',
    goTo: '移動',
    inWorld: 'ワールドの中',
    sixEditors: '6つのエディター',
    youAreHere: '今ここです',
    allLevels: 'すべてのレベル',
    partLevels: 'レベル',
    partLevelsAbout: 'レベルにものを置く',
    gameMenu: 'ゲームのメニュー',
    editorWorld: 'ワールド',
    editorWorldAbout: 'レベルと世界のマップ',
    editorCharacters: 'キャラクター',
    editorCharactersAbout: '誰が出てきて、どう動くか',
    editorFeel: '操作感',
    editorFeelAbout: '遊んだときの感じ',
    editorSound: 'サウンド',
    editorSoundAbout: '音楽と効果音',
    editorStory: 'ストーリー',
    editorStoryAbout: 'せりふ、会話、場面',
    editorScreens: '画面',
    editorScreensAbout: 'メニュー、ポーズ、遊ぶ人が見るもの',
    noteCharacters:
      'キャラクターはこのバージョンにはまだありません。誰がゲームに出て、どう動くかを決める場所になります。',
    noteFeel: '操作感はこのバージョンにはまだありません。遊んだときの感じを整える場所になります。',
    noteSound: 'サウンドはこのバージョンにはまだありません。音楽と効果音を選ぶ場所になります。',
    noteStory:
      'ストーリーはこのバージョンにはまだありません。人のせりふと起きることを書く場所になります。',
    noteScreens:
      '画面はこのバージョンにはまだありません。メニューや遊ぶ人が見るものを作る場所になります。',
  },
  zh: {
    whoCanChange: '谁可以改动',
    waitingRow: (n) => `${n} 项改动在等待`,
    keepCopyOf: (name) => `保存${name}的副本`,
    keepCopyAbout: '存成文件，交给帮手',
    yourGames: '你的游戏',
    yourGamesAbout: '打开另一个游戏',
    signIn: '登录',
    signOut: '退出登录',
    goTo: '前往',
    inWorld: '世界之内',
    sixEditors: '六个编辑器',
    youAreHere: '你在这里',
    allLevels: '所有关卡',
    partLevels: '关卡',
    partLevelsAbout: '把东西放进关卡',
    gameMenu: '游戏菜单',
    editorWorld: '世界',
    editorWorldAbout: '关卡和世界地图',
    editorCharacters: '角色',
    editorCharactersAbout: '游戏里有谁，怎么行动',
    editorFeel: '手感',
    editorFeelAbout: '玩起来的感觉',
    editorSound: '声音',
    editorSoundAbout: '音乐和音效',
    editorStory: '故事',
    editorStoryAbout: '台词、对话和场景',
    editorScreens: '画面',
    editorScreensAbout: '菜单、暂停和玩家看到的内容',
    noteCharacters: '这个版本里还没有“角色”。以后你可以在这里决定游戏里有谁，以及他们怎么行动。',
    noteFeel: '这个版本里还没有“手感”。以后你可以在这里调整玩起来的感觉。',
    noteSound: '这个版本里还没有“声音”。以后你可以在这里挑选音乐和音效。',
    noteStory: '这个版本里还没有“故事”。以后你可以在这里写人们说的话和发生的事。',
    noteScreens: '这个版本里还没有“画面”。以后你可以在这里制作菜单和玩家看到的内容。',
  },
  pt: {
    whoCanChange: 'Quem pode mudar',
    waitingRow: (n) => (Number(n) === 1 ? '1 mudança está esperando' : `${n} mudanças estão esperando`),
    keepCopyOf: (name) => `Guardar uma cópia de ${name}`,
    keepCopyAbout: 'Como arquivo, para dar ao seu ajudante',
    yourGames: 'Seus jogos',
    yourGamesAbout: 'Abrir outro jogo',
    signIn: 'Entrar',
    signOut: 'Sair',
    goTo: 'Ir para',
    inWorld: 'Em Mundo',
    sixEditors: 'Os seis editores',
    youAreHere: 'Você está aqui',
    allLevels: 'Todos os níveis',
    partLevels: 'Níveis',
    partLevelsAbout: 'Ponha coisas em um nível',
    gameMenu: 'O menu do jogo',
    editorWorld: 'Mundo',
    editorWorldAbout: 'Níveis e o mapa do mundo',
    editorCharacters: 'Personagens',
    editorCharactersAbout: 'Quem está no jogo e como se mexe',
    editorFeel: 'Sensação',
    editorFeelAbout: 'Como é jogar',
    editorSound: 'Som',
    editorSoundAbout: 'Música e sons',
    editorStory: 'História',
    editorStoryAbout: 'Palavras, conversas e cenas',
    editorScreens: 'Telas',
    editorScreensAbout: 'Menus, pausa e o que quem joga vê',
    noteCharacters:
      'Personagens ainda não está nesta versão. Será onde você decide quem está no jogo e como se mexe.',
    noteFeel: 'Sensação ainda não está nesta versão. Será onde você ajusta como é jogar.',
    noteSound: 'Som ainda não está nesta versão. Será onde você escolhe a música e os sons.',
    noteStory:
      'História ainda não está nesta versão. Será onde você escreve o que as pessoas dizem e o que acontece.',
    noteScreens:
      'Telas ainda não está nesta versão. Será onde você faz os menus e o que quem joga vê.',
  },
  fr: {
    whoCanChange: 'Qui peut le changer',
    waitingRow: (n) => (Number(n) === 1 ? '1 changement attend' : `${n} changements attendent`),
    keepCopyOf: (name) => `Garder une copie de ${name}`,
    keepCopyAbout: 'En fichier, à donner à ton aide',
    yourGames: 'Tes jeux',
    yourGamesAbout: 'Ouvrir un autre jeu',
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
    goTo: 'Aller à',
    inWorld: 'Dans Monde',
    sixEditors: 'Les six éditeurs',
    youAreHere: 'Tu es ici',
    allLevels: 'Tous les niveaux',
    partLevels: 'Niveaux',
    partLevelsAbout: 'Mets des choses dans un niveau',
    gameMenu: 'Le menu du jeu',
    editorWorld: 'Monde',
    editorWorldAbout: 'Niveaux et carte du monde',
    editorCharacters: 'Personnages',
    editorCharactersAbout: 'Qui est dans le jeu et comment il bouge',
    editorFeel: 'Sensation',
    editorFeelAbout: 'Ce que l’on ressent en jouant',
    editorSound: 'Son',
    editorSoundAbout: 'Musique et sons',
    editorStory: 'Histoire',
    editorStoryAbout: 'Paroles, discussions et scènes',
    editorScreens: 'Écrans',
    editorScreensAbout: 'Menus, pause et ce que voit le joueur',
    noteCharacters:
      'Personnages n’est pas encore dans cette version. Ce sera là que tu décideras qui est dans le jeu et comment il bouge.',
    noteFeel:
      'Sensation n’est pas encore dans cette version. Ce sera là que tu règleras ce que l’on ressent en jouant.',
    noteSound:
      'Son n’est pas encore dans cette version. Ce sera là que tu choisiras la musique et les sons.',
    noteStory:
      'Histoire n’est pas encore dans cette version. Ce sera là que tu écriras ce que disent les gens et ce qui arrive.',
    noteScreens:
      'Écrans n’est pas encore dans cette version. Ce sera là que tu feras les menus et ce que voit le joueur.',
  },
  ru: {
    whoCanChange: 'Кто может менять',
    waitingRow: (n) => `Изменений в ожидании: ${n}`,
    keepCopyOf: (name) => `Сохранить копию: ${name}`,
    keepCopyAbout: 'Файлом, чтобы передать помощнику',
    yourGames: 'Ваши игры',
    yourGamesAbout: 'Открыть другую игру',
    signIn: 'Войти',
    signOut: 'Выйти',
    goTo: 'Перейти',
    inWorld: 'В разделе «Мир»',
    sixEditors: 'Шесть редакторов',
    youAreHere: 'Вы здесь',
    allLevels: 'Все уровни',
    partLevels: 'Уровни',
    partLevelsAbout: 'Расставьте предметы на уровне',
    gameMenu: 'Меню игры',
    editorWorld: 'Мир',
    editorWorldAbout: 'Уровни и карта мира',
    editorCharacters: 'Персонажи',
    editorCharactersAbout: 'Кто есть в игре и как он двигается',
    editorFeel: 'Ощущения',
    editorFeelAbout: 'Каково играть',
    editorSound: 'Звук',
    editorSoundAbout: 'Музыка и звуки',
    editorStory: 'История',
    editorStoryAbout: 'Слова, разговоры и сцены',
    editorScreens: 'Экраны',
    editorScreensAbout: 'Меню, пауза и всё, что видит игрок',
    noteCharacters:
      'Раздела «Персонажи» в этой версии пока нет. Здесь вы решите, кто есть в игре и как он двигается.',
    noteFeel: 'Раздела «Ощущения» в этой версии пока нет. Здесь вы настроите, каково играть.',
    noteSound: 'Раздела «Звук» в этой версии пока нет. Здесь вы выберете музыку и звуки.',
    noteStory:
      'Раздела «История» в этой версии пока нет. Здесь вы напишете, что говорят люди и что происходит.',
    noteScreens:
      'Раздела «Экраны» в этой версии пока нет. Здесь вы сделаете меню и всё, что видит игрок.',
  },
  de: {
    whoCanChange: 'Wer es ändern darf',
    waitingRow: (n) => (Number(n) === 1 ? '1 Änderung wartet' : `${n} Änderungen warten`),
    keepCopyOf: (name) => `Kopie von ${name} behalten`,
    keepCopyAbout: 'Als Datei, zum Weitergeben an deine Hilfe',
    yourGames: 'Deine Spiele',
    yourGamesAbout: 'Ein anderes Spiel öffnen',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    goTo: 'Gehe zu',
    inWorld: 'In Welt',
    sixEditors: 'Die sechs Editoren',
    youAreHere: 'Du bist hier',
    allLevels: 'Alle Level',
    partLevels: 'Level',
    partLevelsAbout: 'Dinge in einen Level setzen',
    gameMenu: 'Das Spielmenü',
    editorWorld: 'Welt',
    editorWorldAbout: 'Level und die Weltkarte',
    editorCharacters: 'Figuren',
    editorCharactersAbout: 'Wer im Spiel ist und wie er sich bewegt',
    editorFeel: 'Spielgefühl',
    editorFeelAbout: 'Wie sich das Spielen anfühlt',
    editorSound: 'Klang',
    editorSoundAbout: 'Musik und Geräusche',
    editorStory: 'Geschichte',
    editorStoryAbout: 'Worte, Gespräche und Szenen',
    editorScreens: 'Bildschirme',
    editorScreensAbout: 'Menüs, Pause und was Spielende sehen',
    noteCharacters:
      'Figuren gibt es in dieser Version noch nicht. Dort legst du fest, wer im Spiel ist und wie er sich bewegt.',
    noteFeel:
      'Spielgefühl gibt es in dieser Version noch nicht. Dort stellst du ein, wie sich das Spielen anfühlt.',
    noteSound:
      'Klang gibt es in dieser Version noch nicht. Dort wählst du die Musik und die Geräusche aus.',
    noteStory:
      'Geschichte gibt es in dieser Version noch nicht. Dort schreibst du, was die Leute sagen und was passiert.',
    noteScreens:
      'Bildschirme gibt es in dieser Version noch nicht. Dort baust du die Menüs und das, was Spielende sehen.',
  },
} as const satisfies Area<Key>
