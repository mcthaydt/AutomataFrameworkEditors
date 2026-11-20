// The first run: the language card that comes before everything else, the welcome, and the tour's cards.
import type { Area } from './languages.ts'

type Key =
  | 'languageTitle'
  | 'languageHint'
  | 'languageUse'
  | 'languageGo'
  | 'welcomeTitle'
  | 'welcomeBody'
  | 'welcome1Title'
  | 'welcome1Body'
  | 'welcome2Title'
  | 'welcome2Body'
  | 'welcome3Title'
  | 'welcome3Body'
  | 'welcomeShow'
  | 'welcomeSelf'
  | 'welcomeSmall'
  | 'tourStepOf'
  | 'tourNext'
  | 'tourSkip'
  | 'tourDid'
  | 'tourPickTitle'
  | 'tourPickBody'
  | 'tourPickDo'
  | 'tourToolsTitle'
  | 'tourToolsBody'
  | 'tourToolsDo'
  | 'tourValueTitle'
  | 'tourValueBody'
  | 'tourValueDo'
  | 'tourArrowsDo'
  | 'tourPutTitle'
  | 'tourPutBody'
  | 'tourPutDo'
  | 'tourEndTitle'
  | 'tourEndBody'
  | 'tourEnd'

export const first = {
  en: {
    languageTitle: 'Choose your language',
    languageHint: 'You can change it any time in Settings.',
    languageUse: (name) => `${name}: use this language`,
    languageGo: 'Go on',
    welcomeTitle: 'Welcome to the editor',
    welcomeBody: (game) =>
      `This is ${game}'s first level. You can change anything you see, and nothing goes in the game until you say so.`,
    welcome1Title: 'Pick a thing',
    welcome1Body: 'Tap any thing in the level.',
    welcome2Title: 'Change it',
    welcome2Body: 'Drag it, or change its settings.',
    welcome3Title: 'Put it in the game',
    welcome3Body:
      'Once you have changed something, a button at the top right puts it in the game. Press it when you are happy.',
    welcomeShow: 'Show me around',
    welcomeSelf: "I'll look around myself",
    welcomeSmall: 'Takes a minute. You can see it again any time in Help.',
    tourStepOf: (n, total) => `${n} of ${total}`,
    tourNext: 'Next',
    tourSkip: 'Skip the tour',
    tourDid: 'That worked.',
    tourPickTitle: 'Pick a thing',
    tourPickBody: 'Everything in the level is a thing. A ring shows which one is picked.',
    tourPickDo: 'Try it: tap the thing with the ring.',
    tourToolsTitle: 'These are your tools',
    tourToolsBody:
      'Pick moves things. Place puts new things in. Paint paints the ground. Erase takes things away. Join joins a button to the gate it opens.',
    tourToolsDo: 'Try it: tap Place.',
    tourValueTitle: 'Change how it is',
    tourValueBody: 'Whatever is picked has settings. Change one and the level changes.',
    tourValueDo: (name) => `Try it: drag ${name}.`,
    tourArrowsDo: (name) => `Try it: move ${name} with the arrows.`,
    tourPutTitle: 'Keep your change',
    tourPutBody:
      'Your changes are only on your screen until you press the button at the top right. It puts them in the game, or keeps a copy if you cannot save here.',
    tourPutDo: 'Try it: press that button.',
    tourEndTitle: 'That is the tour',
    tourEndBody: 'You can see it again any time in Help.',
    tourEnd: 'Finish',
  },
  es: {
    languageTitle: 'Elige tu idioma',
    languageHint: 'Puedes cambiarlo cuando quieras en Ajustes.',
    languageUse: (name) => `${name}: usar este idioma`,
    languageGo: 'Seguir',
    welcomeTitle: 'Te damos la bienvenida al editor',
    welcomeBody: (game) =>
      `Este es el primer nivel de ${game}. Puedes cambiar lo que veas, y nada entra en el juego hasta que lo digas.`,
    welcome1Title: 'Elige una cosa',
    welcome1Body: 'Toca cualquier cosa del nivel.',
    welcome2Title: 'Cámbiala',
    welcome2Body: 'Arrástrala o cambia sus ajustes.',
    welcome3Title: 'Ponla en el juego',
    welcome3Body:
      'Cuando hayas cambiado algo, un botón arriba a la derecha lo pone en el juego. Púlsalo cuando estés contento.',
    welcomeShow: 'Enséñame',
    welcomeSelf: 'Miraré por mi cuenta',
    welcomeSmall: 'Dura un minuto. Puedes verlo otra vez en Ayuda.',
    tourStepOf: (n, total) => `${n} de ${total}`,
    tourNext: 'Siguiente',
    tourSkip: 'Saltar el recorrido',
    tourDid: 'Muy bien.',
    tourPickTitle: 'Elige una cosa',
    tourPickBody: 'Todo lo del nivel es una cosa. Un aro muestra cuál está elegida.',
    tourPickDo: 'Pruébalo: toca la cosa con el aro.',
    tourToolsTitle: 'Estas son tus herramientas',
    tourToolsBody:
      'Elegir mueve cosas. Poner mete cosas nuevas. Pintar pinta el suelo. Borrar quita cosas. Unir une un botón con la puerta que abre.',
    tourToolsDo: 'Pruébalo: toca Poner.',
    tourValueTitle: 'Cambia cómo es',
    tourValueBody: 'Lo que está elegido tiene ajustes. Cambia uno y el nivel cambia.',
    tourValueDo: (name) => `Pruébalo: arrastra ${name}.`,
    tourArrowsDo: (name) => `Pruébalo: mueve ${name} con las flechas.`,
    tourPutTitle: 'Guarda tu cambio',
    tourPutBody:
      'Tus cambios solo están en tu pantalla hasta que pulses el botón de arriba a la derecha. Lo pone en el juego, o guarda una copia si aquí no puedes guardar.',
    tourPutDo: 'Pruébalo: pulsa ese botón.',
    tourEndTitle: 'Eso es todo el recorrido',
    tourEndBody: 'Puedes verlo otra vez en Ayuda cuando quieras.',
    tourEnd: 'Terminar',
  },
  ko: {
    languageTitle: '언어를 선택하세요',
    languageHint: '설정에서 언제든 바꿀 수 있어요.',
    languageUse: (name) => `${name} 사용`,
    languageGo: '계속',
    welcomeTitle: '편집기에 오신 것을 환영해요',
    welcomeBody: (game) =>
      `${game}의 첫 번째 레벨이에요. 보이는 건 무엇이든 바꿀 수 있고, 직접 말하기 전에는 게임에 아무것도 들어가지 않아요.`,
    welcome1Title: '물건 고르기',
    welcome1Body: '레벨에 있는 아무 물건이나 누르세요.',
    welcome2Title: '바꾸기',
    welcome2Body: '끌어서 옮기거나 설정을 바꾸세요.',
    welcome3Title: '게임에 넣기',
    welcome3Body: '무언가를 바꾸면 오른쪽 위 버튼으로 게임에 넣을 수 있어요. 마음에 들면 누르세요.',
    welcomeShow: '둘러보기',
    welcomeSelf: '혼자 둘러볼게요',
    welcomeSmall: '1분이면 돼요. 도움말에서 언제든 다시 볼 수 있어요.',
    tourStepOf: (n, total) => `${n}/${total}`,
    tourNext: '다음',
    tourSkip: '둘러보기 건너뛰기',
    tourDid: '잘했어요.',
    tourPickTitle: '물건 고르기',
    tourPickBody: '레벨에 있는 모든 것이 물건이에요. 고른 물건에는 고리가 보여요.',
    tourPickDo: '해 보세요: 고리가 있는 물건을 누르세요.',
    tourToolsTitle: '이것들이 도구예요',
    tourToolsBody:
      '고르기는 물건을 옮겨요. 놓기는 새 물건을 넣어요. 칠하기는 땅을 칠해요. 지우기는 물건을 없애요. 잇기는 버튼과 열리는 문을 이어요.',
    tourToolsDo: '해 보세요: 놓기를 누르세요.',
    tourValueTitle: '모습 바꾸기',
    tourValueBody: '고른 것에는 설정이 있어요. 하나를 바꾸면 레벨이 바뀌어요.',
    tourValueDo: (name) => `해 보세요: ${name}을(를) 끌어 보세요.`,
    tourArrowsDo: (name) => `해 보세요: 화살표로 ${name}을(를) 움직이세요.`,
    tourPutTitle: '변경 남기기',
    tourPutBody:
      '오른쪽 위 버튼을 누르기 전까지 바꾼 내용은 내 화면에만 있어요. 게임에 넣거나, 여기서 저장할 수 없으면 사본을 만들어요.',
    tourPutDo: '해 보세요: 그 버튼을 누르세요.',
    tourEndTitle: '둘러보기 끝',
    tourEndBody: '도움말에서 언제든 다시 볼 수 있어요.',
    tourEnd: '마치기',
  },
  ja: {
    languageTitle: '言語を選んでください',
    languageHint: '設定でいつでも変えられます。',
    languageUse: (name) => `${name}を使う`,
    languageGo: '次へ',
    welcomeTitle: 'エディタへようこそ',
    welcomeBody: (game) =>
      `これは${game}の最初のレベルです。見えるものは何でも変えられます。あなたが決めるまで、ゲームには何も入りません。`,
    welcome1Title: 'ものを選ぶ',
    welcome1Body: 'レベルにあるものをタップします。',
    welcome2Title: '変える',
    welcome2Body: 'ドラッグして動かすか、設定を変えます。',
    welcome3Title: 'ゲームに入れる',
    welcome3Body: '何かを変えたら、右上のボタンでゲームに入れられます。よければ押してください。',
    welcomeShow: '案内してもらう',
    welcomeSelf: '自分で見てみる',
    welcomeSmall: '1分ほどです。ヘルプからいつでも見直せます。',
    tourStepOf: (n, total) => `${n}/${total}`,
    tourNext: '次へ',
    tourSkip: '案内をやめる',
    tourDid: 'できました。',
    tourPickTitle: 'ものを選ぶ',
    tourPickBody: 'レベルにあるものはすべて「もの」です。選んだものには輪が付きます。',
    tourPickDo: 'やってみよう：輪のついたものをタップ。',
    tourToolsTitle: 'これが道具です',
    tourToolsBody:
      '選ぶは、ものを動かします。置くは、新しいものを入れます。塗るは、地面を塗ります。消すは、ものを取ります。つなぐは、ボタンと開く扉をつなぎます。',
    tourToolsDo: 'やってみよう：「置く」をタップ。',
    tourValueTitle: '様子を変える',
    tourValueBody: '選んだものには設定があります。ひとつ変えると、レベルも変わります。',
    tourValueDo: (name) => `やってみよう：${name}をドラッグ。`,
    tourArrowsDo: (name) => `やってみよう：矢印で${name}を動かす。`,
    tourPutTitle: '変更を残す',
    tourPutBody:
      '右上のボタンを押すまで、変更は自分の画面だけにあります。ゲームに入れるか、ここで保存できないときはコピーを残します。',
    tourPutDo: 'やってみよう：そのボタンを押す。',
    tourEndTitle: '案内はここまで',
    tourEndBody: 'ヘルプからいつでも見直せます。',
    tourEnd: '終わる',
  },
  zh: {
    languageTitle: '请选择语言',
    languageHint: '你可以随时在设置中更改。',
    languageUse: (name) => `${name}：使用这个语言`,
    languageGo: '继续',
    welcomeTitle: '欢迎使用编辑器',
    welcomeBody: (game) =>
      `这是${game}的第一关。你可以改动看到的一切，在你说可以之前，游戏里不会有任何变化。`,
    welcome1Title: '选一样东西',
    welcome1Body: '点一下关卡里的任何东西。',
    welcome2Title: '改动它',
    welcome2Body: '拖动它，或者改它的设置。',
    welcome3Title: '放进游戏',
    welcome3Body: '改完以后，右上角的按钮可以把它放进游戏。满意了就按它。',
    welcomeShow: '带我看看',
    welcomeSelf: '我自己看看',
    welcomeSmall: '只要一分钟。以后可以在帮助里再看。',
    tourStepOf: (n, total) => `${n}/${total}`,
    tourNext: '下一步',
    tourSkip: '跳过导览',
    tourDid: '成功了。',
    tourPickTitle: '选一样东西',
    tourPickBody: '关卡里的一切都是东西。被选中的会有一个圈。',
    tourPickDo: '试试：点有圈的东西。',
    tourToolsTitle: '这些是你的工具',
    tourToolsBody:
      '选择用来移动东西。放置用来放进新东西。涂抹用来涂地面。擦除用来拿走东西。连接把按钮和它打开的门连起来。',
    tourToolsDo: '试试：点“放置”。',
    tourValueTitle: '改变它的样子',
    tourValueBody: '选中的东西有设置。改一项，关卡就会变。',
    tourValueDo: (name) => `试试：拖动${name}。`,
    tourArrowsDo: (name) => `试试：用箭头移动${name}。`,
    tourPutTitle: '保留你的改动',
    tourPutBody:
      '在你按右上角的按钮之前，改动只在你的屏幕上。它会把改动放进游戏，如果你在这里不能保存，就留一份副本。',
    tourPutDo: '试试：按那个按钮。',
    tourEndTitle: '导览结束',
    tourEndBody: '以后可以在帮助里再看。',
    tourEnd: '完成',
  },
  pt: {
    languageTitle: 'Escolha seu idioma',
    languageHint: 'Você pode mudar quando quiser em Ajustes.',
    languageUse: (name) => `${name}: usar este idioma`,
    languageGo: 'Continuar',
    welcomeTitle: 'Boas-vindas ao editor',
    welcomeBody: (game) =>
      `Este é o primeiro nível de ${game}. Você pode mudar tudo o que vê, e nada entra no jogo até você dizer.`,
    welcome1Title: 'Escolha uma coisa',
    welcome1Body: 'Toque em qualquer coisa do nível.',
    welcome2Title: 'Mude',
    welcome2Body: 'Arraste ou mude os ajustes dela.',
    welcome3Title: 'Ponha no jogo',
    welcome3Body:
      'Depois de mudar algo, um botão no alto à direita põe no jogo. Aperte quando estiver satisfeito.',
    welcomeShow: 'Mostre-me',
    welcomeSelf: 'Vou olhar sozinho',
    welcomeSmall: 'Leva um minuto. Dá para ver de novo na Ajuda.',
    tourStepOf: (n, total) => `${n} de ${total}`,
    tourNext: 'Próximo',
    tourSkip: 'Pular o passeio',
    tourDid: 'Deu certo.',
    tourPickTitle: 'Escolha uma coisa',
    tourPickBody: 'Tudo no nível é uma coisa. Um anel mostra qual está escolhida.',
    tourPickDo: 'Experimente: toque na coisa com o anel.',
    tourToolsTitle: 'Estas são suas ferramentas',
    tourToolsBody:
      'Escolher move coisas. Pôr coloca coisas novas. Pintar pinta o chão. Apagar tira coisas. Ligar liga um botão à porta que ele abre.',
    tourToolsDo: 'Experimente: toque em Pôr.',
    tourValueTitle: 'Mude como ela é',
    tourValueBody: 'O que está escolhido tem ajustes. Mude um e o nível muda.',
    tourValueDo: (name) => `Experimente: arraste ${name}.`,
    tourArrowsDo: (name) => `Experimente: mova ${name} com as setas.`,
    tourPutTitle: 'Guarde sua mudança',
    tourPutBody:
      'Suas mudanças só estão na sua tela até você apertar o botão no alto à direita. Ele põe no jogo, ou guarda uma cópia se você não puder salvar aqui.',
    tourPutDo: 'Experimente: aperte esse botão.',
    tourEndTitle: 'Fim do passeio',
    tourEndBody: 'Dá para ver de novo na Ajuda quando quiser.',
    tourEnd: 'Terminar',
  },
  fr: {
    languageTitle: 'Choisissez votre langue',
    languageHint: 'Vous pouvez la changer à tout moment dans Réglages.',
    languageUse: (name) => `${name} : utiliser cette langue`,
    languageGo: 'Continuer',
    welcomeTitle: "Bienvenue dans l'éditeur",
    welcomeBody: (game) =>
      `Voici le premier niveau de ${game}. Vous pouvez changer tout ce que vous voyez, et rien n'entre dans le jeu avant votre accord.`,
    welcome1Title: 'Choisir une chose',
    welcome1Body: "Touchez n'importe quelle chose du niveau.",
    welcome2Title: 'La changer',
    welcome2Body: 'Faites-la glisser, ou changez ses réglages.',
    welcome3Title: 'La mettre dans le jeu',
    welcome3Body:
      'Quand vous avez changé quelque chose, un bouton en haut à droite le met dans le jeu. Appuyez quand vous êtes content.',
    welcomeShow: 'Faites-moi visiter',
    welcomeSelf: 'Je regarde seul',
    welcomeSmall: "Cela prend une minute. Vous pouvez le revoir à tout moment dans l'Aide.",
    tourStepOf: (n, total) => `${n} sur ${total}`,
    tourNext: 'Suivant',
    tourSkip: 'Passer la visite',
    tourDid: 'Ça a marché.',
    tourPickTitle: 'Choisir une chose',
    tourPickBody: 'Tout ce qui est dans le niveau est une chose. Un anneau montre laquelle est choisie.',
    tourPickDo: "Essayez : touchez la chose avec l'anneau.",
    tourToolsTitle: 'Voici vos outils',
    tourToolsBody:
      "Choisir déplace les choses. Poser en met de nouvelles. Peindre peint le sol. Effacer retire des choses. Relier relie un bouton à la porte qu'il ouvre.",
    tourToolsDo: 'Essayez : touchez Poser.',
    tourValueTitle: 'Changer comment elle est',
    tourValueBody: 'Ce qui est choisi a des réglages. Changez-en un et le niveau change.',
    tourValueDo: (name) => `Essayez : faites glisser ${name}.`,
    tourArrowsDo: (name) => `Essayez : déplacez ${name} avec les flèches.`,
    tourPutTitle: 'Gardez votre changement',
    tourPutBody:
      "Vos changements restent sur votre écran jusqu'à ce que vous appuyiez sur le bouton en haut à droite. Il les met dans le jeu, ou garde une copie si vous ne pouvez pas enregistrer ici.",
    tourPutDo: 'Essayez : appuyez sur ce bouton.',
    tourEndTitle: 'Fin de la visite',
    tourEndBody: "Vous pouvez la revoir à tout moment dans l'Aide.",
    tourEnd: 'Terminer',
  },
  ru: {
    languageTitle: 'Выберите язык',
    languageHint: 'Её можно сменить в любой момент в настройках.',
    languageUse: (name) => `${name}: выбрать этот язык`,
    languageGo: 'Дальше',
    welcomeTitle: 'Добро пожаловать в редактор',
    welcomeBody: (game) =>
      `Это первый уровень: ${game}. Вы можете менять всё, что видите, и ничего не попадёт в игру, пока вы не скажете.`,
    welcome1Title: 'Выберите предмет',
    welcome1Body: 'Коснитесь любого предмета на уровне.',
    welcome2Title: 'Измените его',
    welcome2Body: 'Перетащите его или измените его настройки.',
    welcome3Title: 'Положите в игру',
    welcome3Body:
      'Когда что-то изменено, кнопка справа вверху кладёт это в игру. Нажмите, когда всё устраивает.',
    welcomeShow: 'Покажите мне',
    welcomeSelf: 'Посмотрю сам',
    welcomeSmall: 'Это займёт минуту. Потом можно посмотреть снова в справке.',
    tourStepOf: (n, total) => `${n} из ${total}`,
    tourNext: 'Дальше',
    tourSkip: 'Пропустить обзор',
    tourDid: 'Получилось.',
    tourPickTitle: 'Выберите предмет',
    tourPickBody: 'Всё на уровне — предметы. Кольцо показывает выбранный.',
    tourPickDo: 'Попробуйте: коснитесь предмета с кольцом.',
    tourToolsTitle: 'Это ваши инструменты',
    tourToolsBody:
      'Выбор двигает предметы. Поставить добавляет новые. Закрасить красит землю. Стереть убирает предметы. Связать соединяет кнопку с дверью, которую она открывает.',
    tourToolsDo: 'Попробуйте: коснитесь «Поставить».',
    tourValueTitle: 'Измените, какой он',
    tourValueBody: 'У выбранного есть настройки. Измените одну — изменится уровень.',
    tourValueDo: (name) => `Попробуйте: перетащите «${name}».`,
    tourArrowsDo: (name) => `Попробуйте: подвиньте «${name}» стрелками.`,
    tourPutTitle: 'Сохраните изменение',
    tourPutBody:
      'Пока вы не нажмёте кнопку справа вверху, изменения только на вашем экране. Она кладёт их в игру или оставляет копию, если здесь сохранять нельзя.',
    tourPutDo: 'Попробуйте: нажмите эту кнопку.',
    tourEndTitle: 'Обзор окончен',
    tourEndBody: 'Его можно посмотреть снова в справке.',
    tourEnd: 'Готово',
  },
  de: {
    languageTitle: 'Wähle deine Sprache',
    languageHint: 'Du kannst das jederzeit in den Einstellungen ändern.',
    languageUse: (name) => `${name} verwenden`,
    languageGo: 'Weiter',
    welcomeTitle: 'Willkommen im Editor',
    welcomeBody: (game) =>
      `Das ist das erste Level von ${game}. Du kannst alles ändern, was du siehst, und nichts kommt ins Spiel, bevor du es sagst.`,
    welcome1Title: 'Etwas auswählen',
    welcome1Body: 'Tippe auf irgendein Ding im Level.',
    welcome2Title: 'Ändern',
    welcome2Body: 'Zieh es oder ändere seine Einstellungen.',
    welcome3Title: 'Ins Spiel legen',
    welcome3Body:
      'Wenn du etwas geändert hast, legt ein Knopf oben rechts es ins Spiel. Drück ihn, wenn es dir gefällt.',
    welcomeShow: 'Zeig mir alles',
    welcomeSelf: 'Ich schaue allein',
    welcomeSmall: 'Dauert eine Minute. Du kannst es jederzeit in der Hilfe wieder ansehen.',
    tourStepOf: (n, total) => `${n} von ${total}`,
    tourNext: 'Weiter',
    tourSkip: 'Rundgang überspringen',
    tourDid: 'Das hat geklappt.',
    tourPickTitle: 'Etwas auswählen',
    tourPickBody: 'Alles im Level ist ein Ding. Ein Ring zeigt, welches ausgewählt ist.',
    tourPickDo: 'Probier es: Tippe auf das Ding mit dem Ring.',
    tourToolsTitle: 'Das sind deine Werkzeuge',
    tourToolsBody:
      'Wählen bewegt Dinge. Setzen legt neue hinein. Malen malt den Boden. Löschen nimmt Dinge weg. Verbinden verbindet einen Knopf mit dem Tor, das er öffnet.',
    tourToolsDo: 'Probier es: Tippe auf Setzen.',
    tourValueTitle: 'Ändere, wie es ist',
    tourValueBody: 'Was ausgewählt ist, hat Einstellungen. Ändere eine, und das Level ändert sich.',
    tourValueDo: (name) => `Probier es: Zieh ${name}.`,
    tourArrowsDo: (name) => `Probier es: Bewege ${name} mit den Pfeilen.`,
    tourPutTitle: 'Behalte deine Änderung',
    tourPutBody:
      'Deine Änderungen sind nur auf deinem Bildschirm, bis du den Knopf oben rechts drückst. Er legt sie ins Spiel oder behält eine Kopie, wenn du hier nicht speichern kannst.',
    tourPutDo: 'Probier es: Drück diesen Knopf.',
    tourEndTitle: 'Das war der Rundgang',
    tourEndBody: 'Du kannst ihn jederzeit in der Hilfe wieder ansehen.',
    tourEnd: 'Fertig',
  },
} as const satisfies Area<Key>
