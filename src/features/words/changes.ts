// The words putting changes in says: the sheet that asks, the one that says it is done or could not, and the sheet for
// what waits to be checked. A row that is a function takes what it names ("3", "Mia"); an empty name means the page
// does not know who checks, and the row says it without one.
import type { Area } from './languages.ts'

type Key =
  | 'putTitle'
  | 'sendTitle'
  | 'putAbout'
  | 'sendAbout'
  | 'putThem'
  | 'sendThem'
  | 'putAnyway'
  | 'sendAnyway'
  | 'notYet'
  | 'warnPut'
  | 'warnSend'
  | 'fixFirst'
  | 'stopsAbout'
  | 'stopsSafe'
  | 'afterSend'
  | 'showMe'
  | 'cameIn'
  | 'clashed'
  | 'working'
  | 'onDevice'
  | 'clashTitle'
  | 'sendIt'
  | 'doneTitle'
  | 'doneAbout'
  | 'sentTitle'
  | 'sentAbout'
  | 'takeBack'
  | 'takenBack'
  | 'takeBackFailed'
  | 'failPut'
  | 'failSend'
  | 'failOffline'
  | 'failBusy'
  | 'failBroken'
  | 'failBlocked'
  | 'failLook'
  | 'failElse'
  | 'again'
  | 'notNow'
  | 'waitTitle'
  | 'waitAbout'
  | 'waitMoreTitle'
  | 'waitMoreAbout'

const many = (n: string | number): boolean => Number(n) !== 1

export const changes = {
  en: {
    putTitle: (n) => `Put ${n} ${many(n) ? 'changes' : 'change'} in the game`,
    sendTitle: (n, by) =>
      `Send ${n} ${many(n) ? 'changes' : 'change'}${by === '' ? ' to check' : ` to ${by}`}`,
    putAbout: (where) => `Only you can see these, ${where}. Put them in and your team sees them too.`,
    sendAbout: (by, where) =>
      by === ''
        ? `Someone puts them in the game, or tells you what to change. Until then, only you can see them, ${where}.`
        : `${by} puts them in the game, or tells you what to change. Until then, only you can see them, ${where}.`,
    putThem: 'Put them in',
    sendThem: (by) => (by === '' ? 'Send to check' : `Send to ${by} to check`),
    putAnyway: 'Put them in anyway',
    sendAnyway: 'Send them anyway',
    notYet: 'Not yet',
    warnPut: 'You can still put them in. Whether this warns you first is in Settings.',
    warnSend: 'You can still send them. Whether this warns you first is in Settings.',
    fixFirst: (n) => `Fix ${n} ${many(n) ? 'problems' : 'problem'} first`,
    stopsAbout:
      'This game asks for every problem to be fixed before changes go in, so players never meet one.',
    stopsSafe:
      'Your changes are safe on this device until then. Only an Owner can change this rule, in Settings.',
    afterSend: (by) =>
      `After you send, the top bar says “${by === '' ? 'Waiting to be checked' : `Waiting for ${by}`}”.`,
    showMe: 'Show me',
    cameIn: (n) =>
      `${n} ${many(n) ? 'changes' : 'change'} came in from the game while you worked. ${many(n) ? 'They are' : 'It is'} in your level now. Press once more to put yours in.`,
    clashed: (n) =>
      `${n} of your changes ${many(n) ? 'clash' : 'clashes'} with someone else’s. The game’s version is kept for now. Undo brings yours back.`,
    working: 'One moment…',
    onDevice: (device) =>
      device === 'ipad' ? 'on this iPad' : device === 'phone' ? 'on this phone' : 'on this computer',
    clashTitle: 'The game’s version is kept',
    sendIt: (n) => (Number(n) === 1 ? 'Send it too' : 'Send them too'),
    doneTitle: 'In the game',
    doneAbout: (game, n) => `Everyone on ${game} has your ${n} ${many(n) ? 'changes' : 'change'} now.`,
    sentTitle: (by) => (by === '' ? 'Sent to be checked' : `Sent to ${by} to check`),
    sentAbout: 'You’ll see here when they are in the game. You can keep working.',
    takeBack: 'Take them back',
    takenBack: 'Taken back. Your changes are yours again, on this device.',
    takeBackFailed: 'Couldn’t take them back. Your changes are safe: nothing is lost. Try again.',
    failPut: 'Couldn’t put them in',
    failSend: 'Couldn’t send them',
    failOffline: (n) =>
      `There is no internet right now. Your ${n} ${many(n) ? 'changes are' : 'change is'} safe on this device: nothing is lost.`,
    failBusy: (n) =>
      `Things are busy right now. Your ${n} ${many(n) ? 'changes are' : 'change is'} safe: nothing is lost. Wait a minute and try again.`,
    failBroken: 'The game would not read with these changes. Here is what needs mending:',
    failBlocked: (owner) =>
      `GitHub is set to stop the editor changing this game. Ask ${owner}, who owns the game, to let the editor change it. Your changes are safe here.`,
    failLook:
      'You can look at this game, but you can’t change it any more. Your changes are safe here: keep a copy instead.',
    failElse: 'Something went wrong, and your changes were not put in. They are safe here: nothing is lost.',
    again: 'Try again',
    notNow: 'Not now',
    waitTitle: (by) => (by === '' ? 'Waiting to be checked' : `With ${by}, to check`),
    waitAbout: (by) =>
      `${by === '' ? 'Someone' : by} has your changes. They are not in the game yet. You can keep working while you wait.`,
    waitMoreTitle: (by) => (by === '' ? 'Your first changes are waiting' : `${by} has your first changes`),
    waitMoreAbout: (n) =>
      `${many(n) ? `These ${n} new ones are` : 'This new one is'} only on this device so far.`,
  },
  es: {
    putTitle: (n) => `Poner ${n} ${many(n) ? 'cambios' : 'cambio'} en el juego`,
    sendTitle: (n, by) =>
      `Enviar ${n} ${many(n) ? 'cambios' : 'cambio'}${by === '' ? ' para revisar' : ` a ${by}`}`,
    putAbout: (where) => `Solo tú los ves, ${where}. Si los pones en el juego, tu equipo también los ve.`,
    sendAbout: (by, where) =>
      `${by === '' ? 'Alguien' : by} los pone en el juego o te dice qué cambiar. Hasta entonces, solo tú los ves, ${where}.`,
    putThem: 'Ponerlos',
    sendThem: (by) => (by === '' ? 'Enviar para revisar' : `Enviar a ${by} para revisar`),
    putAnyway: 'Ponerlos igualmente',
    sendAnyway: 'Enviarlos igualmente',
    notYet: 'Todavía no',
    warnPut: 'Aún puedes ponerlos. Si esto te avisa antes, se elige en Ajustes.',
    warnSend: 'Aún puedes enviarlos. Si esto te avisa antes, se elige en Ajustes.',
    fixFirst: (n) => `Arregla ${n} ${many(n) ? 'problemas' : 'problema'} primero`,
    stopsAbout:
      'Este juego pide arreglar todos los problemas antes de aceptar cambios, para que nadie juegue con uno.',
    stopsSafe:
      'Tus cambios están a salvo en este dispositivo hasta entonces. Solo un dueño puede cambiar esta regla, en Ajustes.',
    afterSend: (by) =>
      `Después de enviar, la barra de arriba dirá “${by === '' ? 'Esperando revisión' : `Esperando a ${by}`}”.`,
    showMe: 'Muéstramelo',
    cameIn: (n) =>
      `${many(n) ? `Entraron ${n} cambios` : 'Entró 1 cambio'} del juego mientras trabajabas. Ya ${many(n) ? 'están' : 'está'} en tu nivel. Pulsa otra vez para poner los tuyos.`,
    clashed: (n) =>
      `${n} ${many(n) ? 'de tus cambios chocan' : 'de tus cambios choca'} con los de otra persona. Por ahora se queda la versión del juego. Deshacer trae la tuya.`,
    working: 'Un momento…',
    onDevice: (device) =>
      device === 'ipad' ? 'en este iPad' : device === 'phone' ? 'en este teléfono' : 'en este ordenador',
    clashTitle: 'Se queda la versión del juego',
    sendIt: (n) => (Number(n) === 1 ? 'Enviarlo también' : 'Enviarlos también'),
    doneTitle: 'En el juego',
    doneAbout: (game, n) => `Todos en ${game} ya tienen ${many(n) ? `tus ${n} cambios` : 'tu cambio'}.`,
    sentTitle: (by) => (by === '' ? 'Enviado para revisar' : `Enviado a ${by} para revisar`),
    sentAbout: 'Aquí verás cuándo están en el juego. Puedes seguir trabajando.',
    takeBack: 'Retirarlos',
    takenBack: 'Retirados. Tus cambios vuelven a ser solo tuyos, en este dispositivo.',
    takeBackFailed:
      'No se pudieron retirar. Tus cambios están a salvo: no se pierde nada. Inténtalo otra vez.',
    failPut: 'No se pudieron poner',
    failSend: 'No se pudieron enviar',
    failOffline: (n) =>
      `Ahora no hay internet. ${many(n) ? `Tus ${n} cambios están a salvo` : 'Tu cambio está a salvo'} en este dispositivo: no se pierde nada.`,
    failBusy: (n) =>
      `Hay mucho trabajo ahora. ${many(n) ? `Tus ${n} cambios están a salvo` : 'Tu cambio está a salvo'}: no se pierde nada. Espera un minuto e inténtalo otra vez.`,
    failBroken: 'El juego no se podría leer con estos cambios. Esto es lo que hay que arreglar:',
    failBlocked: (owner) =>
      `GitHub está configurado para impedir que el editor cambie este juego. Pide a ${owner}, que es dueño del juego, que deje al editor cambiarlo. Tus cambios están a salvo aquí.`,
    failLook:
      'Puedes ver este juego, pero ya no puedes cambiarlo. Tus cambios están a salvo aquí: guarda una copia.',
    failElse: 'Algo salió mal y tus cambios no se pusieron. Están a salvo aquí: no se pierde nada.',
    again: 'Intentar otra vez',
    notNow: 'Ahora no',
    waitTitle: (by) => (by === '' ? 'Esperando revisión' : `Con ${by}, para revisar`),
    waitAbout: (by) =>
      `${by === '' ? 'Alguien' : by} tiene tus cambios. Aún no están en el juego. Puedes seguir trabajando mientras esperas.`,
    waitMoreTitle: (by) => (by === '' ? 'Tus primeros cambios esperan' : `${by} tiene tus primeros cambios`),
    waitMoreAbout: (n) =>
      `${many(n) ? `Estos ${n} nuevos están` : 'Este nuevo está'} solo en este dispositivo por ahora.`,
  },
  ko: {
    putTitle: (n) => `변경 ${n}개를 게임에 넣기`,
    sendTitle: (n, by) => `변경 ${n}개를 ${by === '' ? '확인하도록 보내기' : `${by}에게 보내기`}`,
    putAbout: (where) => `지금은 ${where} 나만 볼 수 있어요. 게임에 넣으면 팀도 볼 수 있어요.`,
    sendAbout: (by, where) =>
      `${by === '' ? '누군가' : by}가 게임에 넣거나 고칠 점을 알려 줘요. 그때까지는 ${where} 나만 볼 수 있어요.`,
    putThem: '게임에 넣기',
    sendThem: (by) => (by === '' ? '확인하도록 보내기' : `${by}에게 확인받으러 보내기`),
    putAnyway: '그래도 넣기',
    sendAnyway: '그래도 보내기',
    notYet: '아직 아니에요',
    warnPut: '그래도 넣을 수 있어요. 먼저 알려 줄지는 설정에서 정해요.',
    warnSend: '그래도 보낼 수 있어요. 먼저 알려 줄지는 설정에서 정해요.',
    fixFirst: (n) => `문제 ${n}개를 먼저 고치세요`,
    stopsAbout: '이 게임은 문제를 모두 고쳐야 변경을 받아요. 그래야 플레이하는 사람이 문제를 만나지 않아요.',
    stopsSafe: '그때까지 변경은 이 기기에 안전하게 있어요. 이 규칙은 설정에서 소유자만 바꿀 수 있어요.',
    afterSend: (by) =>
      `보내면 위쪽 막대에 “${by === '' ? '확인 기다리는 중' : `${by} 기다리는 중`}”이라고 나와요.`,
    showMe: '보여 줘',
    cameIn: (n) =>
      `작업하는 동안 게임에 변경 ${n}개가 들어왔어요. 지금 내 레벨에 반영되어 있어요. 내 변경을 넣으려면 한 번 더 누르세요.`,
    clashed: (n) =>
      `내 변경 ${n}개가 다른 사람의 변경과 겹쳐요. 지금은 게임의 것을 그대로 둬요. 되돌리기를 누르면 내 것이 돌아와요.`,
    working: '잠시만요…',
    onDevice: (device) =>
      device === 'ipad' ? '이 iPad에서' : device === 'phone' ? '이 휴대폰에서' : '이 컴퓨터에서',
    clashTitle: '게임의 것을 그대로 뒀어요',
    sendIt: '같이 보내기',
    doneTitle: '게임에 들어갔어요',
    doneAbout: (game, n) => `${game}의 모두가 이제 내 변경 ${n}개를 가지고 있어요.`,
    sentTitle: (by) => (by === '' ? '확인하도록 보냈어요' : `${by}에게 확인받으러 보냈어요`),
    sentAbout: '게임에 들어가면 여기에 알려 드려요. 계속 작업해도 돼요.',
    takeBack: '되찾기',
    takenBack: '되찾았어요. 변경은 다시 이 기기에 있는 내 것이에요.',
    takeBackFailed: '되찾지 못했어요. 변경은 안전해요. 잃은 건 없어요. 다시 해 보세요.',
    failPut: '넣지 못했어요',
    failSend: '보내지 못했어요',
    failOffline: (n) => `지금 인터넷이 없어요. 변경 ${n}개는 이 기기에 안전하게 있어요. 잃은 건 없어요.`,
    failBusy: (n) => `지금 많이 바빠요. 변경 ${n}개는 안전해요. 잃은 건 없어요. 잠시 뒤에 다시 해 보세요.`,
    failBroken: '이 변경으로는 게임을 읽을 수 없어요. 고칠 곳은 다음과 같아요:',
    failBlocked: (owner) =>
      `GitHub가 편집기가 이 게임을 바꾸지 못하게 막고 있어요. 게임 주인인 ${owner}님에게 편집기가 바꿀 수 있게 해 달라고 부탁하세요. 변경은 여기에 안전하게 있어요.`,
    failLook: '이 게임은 볼 수만 있고 더는 바꿀 수 없어요. 변경은 여기에 안전해요. 대신 사본을 남기세요.',
    failElse: '문제가 생겨서 변경을 넣지 못했어요. 변경은 여기에 안전해요. 잃은 건 없어요.',
    again: '다시 해 보기',
    notNow: '나중에',
    waitTitle: (by) => (by === '' ? '확인 기다리는 중' : `${by}에게, 확인 중`),
    waitAbout: (by) =>
      `${by === '' ? '누군가' : by}가 내 변경을 가지고 있어요. 아직 게임에는 없어요. 기다리는 동안 계속 작업해도 돼요.`,
    waitMoreTitle: (by) => (by === '' ? '처음 변경이 기다리는 중' : `${by}가 처음 변경을 가지고 있어요`),
    waitMoreAbout: (n) => `새 변경 ${n}개는 아직 이 기기에만 있어요.`,
  },
  ja: {
    putTitle: (n) => `${n}件の変更をゲームに入れる`,
    sendTitle: (n, by) => `${n}件の変更を${by === '' ? '確認のために送る' : `${by}に送る`}`,
    putAbout: (where) => `今は${where}、あなただけが見られます。ゲームに入れると、チームにも見えます。`,
    sendAbout: (by, where) =>
      `${by === '' ? '誰か' : by}がゲームに入れるか、直すところを教えてくれます。それまでは${where}、あなただけが見られます。`,
    putThem: '入れる',
    sendThem: (by) => (by === '' ? '確認のために送る' : `${by}に確認してもらう`),
    putAnyway: 'このまま入れる',
    sendAnyway: 'このまま送る',
    notYet: 'まだやめておく',
    warnPut: 'このまま入れることもできます。先に知らせるかどうかは設定で決めます。',
    warnSend: 'このまま送ることもできます。先に知らせるかどうかは設定で決めます。',
    fixFirst: (n) => `先に${n}件の問題を直してください`,
    stopsAbout:
      'このゲームは、問題をすべて直してから変更を受け付けます。遊ぶ人が問題に出会わないようにするためです。',
    stopsSafe:
      'それまで変更はこの端末の中で無事です。このルールを変えられるのは設定の中の、オーナーだけです。',
    afterSend: (by) => `送ると、上のバーに「${by === '' ? '確認待ち' : `${by}を待っています`}」と出ます。`,
    showMe: '見せて',
    cameIn: (n) =>
      `作業中にゲームへ${n}件の変更が入りました。今はあなたのレベルに入っています。あなたの変更を入れるには、もう一度押してください。`,
    clashed: (n) =>
      `あなたの変更${n}件が、ほかの人の変更とぶつかっています。今はゲームの内容を残しています。元に戻すと、あなたの内容が戻ります。`,
    working: '少し待ってね…',
    onDevice: (device) =>
      device === 'ipad' ? 'このiPadの中で' : device === 'phone' ? 'このスマホの中で' : 'このパソコンの中で',
    clashTitle: 'ゲームの内容を残しました',
    sendIt: 'こちらも送る',
    doneTitle: 'ゲームに入りました',
    doneAbout: (game, n) => `${game}のみんなに、あなたの${n}件の変更が届きました。`,
    sentTitle: (by) => (by === '' ? '確認のために送りました' : `${by}に確認のために送りました`),
    sentAbout: 'ゲームに入ったら、ここでお知らせします。作業は続けられます。',
    takeBack: '取り戻す',
    takenBack: '取り戻しました。変更はまた、この端末のあなたのものです。',
    takeBackFailed: '取り戻せませんでした。変更は無事です。何もなくなっていません。もう一度試してください。',
    failPut: '入れられませんでした',
    failSend: '送れませんでした',
    failOffline: (n) =>
      `今はインターネットにつながっていません。${n}件の変更はこの端末で無事です。何もなくなっていません。`,
    failBusy: (n) =>
      `今は混み合っています。${n}件の変更は無事です。何もなくなっていません。少し待って、もう一度試してください。`,
    failBroken: 'この変更のままでは、ゲームを読めません。直すところはこちらです。',
    failBlocked: (owner) =>
      `GitHubの設定で、エディターがこのゲームを変えられません。ゲームの持ち主の${owner}さんに、エディターで変えられるようにしてもらってください。変更はここで無事です。`,
    failLook:
      'このゲームは見るだけで、もう変えられません。変更はここで無事です。代わりにコピーを残してください。',
    failElse: 'うまくいかず、変更は入りませんでした。変更はここで無事です。何もなくなっていません。',
    again: 'もう一度',
    notNow: '今はしない',
    waitTitle: (by) => (by === '' ? '確認待ち' : `${by}のところで確認中`),
    waitAbout: (by) =>
      `${by === '' ? '誰か' : by}があなたの変更を持っています。まだゲームには入っていません。待っている間も作業できます。`,
    waitMoreTitle: (by) => (by === '' ? '最初の変更が待っています' : `${by}が最初の変更を持っています`),
    waitMoreAbout: (n) => `新しい${n}件は、今のところこの端末の中だけです。`,
  },
  zh: {
    putTitle: (n) => `把 ${n} 处改动放进游戏`,
    sendTitle: (n, by) => `把 ${n} 处改动${by === '' ? '发出去检查' : `发给${by}`}`,
    putAbout: (where) => `现在只有你能${where}看到。放进游戏后，你的团队也能看到。`,
    sendAbout: (by, where) =>
      `${by === '' ? '有人' : by}会把它们放进游戏，或告诉你要改什么。在那之前，只有你能${where}看到。`,
    putThem: '放进去',
    sendThem: (by) => (by === '' ? '发出去检查' : `发给${by}检查`),
    putAnyway: '还是放进去',
    sendAnyway: '还是发出去',
    notYet: '先不要',
    warnPut: '你仍然可以放进去。是否先提醒你，可以在设置里选。',
    warnSend: '你仍然可以发出去。是否先提醒你，可以在设置里选。',
    fixFirst: (n) => `请先修好 ${n} 个问题`,
    stopsAbout: '这个游戏要求先修好所有问题，改动才能放进去，这样玩的人就不会遇到问题。',
    stopsSafe: '在那之前，你的改动安全地留在这台设备上。只有所有者能在设置里改这条规则。',
    afterSend: (by) => `发出后，顶部栏会显示“${by === '' ? '等待检查' : `等待${by}`}”。`,
    showMe: '指给我看',
    cameIn: (n) => `你工作时，游戏里进来了 ${n} 处改动，现在已经在你的关卡里了。再按一次，就能放进你的改动。`,
    clashed: (n) => `你有 ${n} 处改动和别人的改动冲突了。暂时保留游戏里的版本。点“撤销”就能找回你的。`,
    working: '请稍等…',
    onDevice: (device) =>
      device === 'ipad' ? '在这台 iPad 上' : device === 'phone' ? '在这部手机上' : '在这台电脑上',
    clashTitle: '已保留游戏里的版本',
    sendIt: '也一起发出去',
    doneTitle: '已在游戏里',
    doneAbout: (game, n) => `${game}里的所有人现在都有你的 ${n} 处改动了。`,
    sentTitle: (by) => (by === '' ? '已发出去检查' : `已发给${by}检查`),
    sentAbout: '它们进入游戏后，这里会告诉你。你可以继续工作。',
    takeBack: '收回来',
    takenBack: '已收回。这些改动又只属于你，留在这台设备上。',
    takeBackFailed: '没能收回来。你的改动是安全的，什么都没丢。请再试一次。',
    failPut: '没能放进去',
    failSend: '没能发出去',
    failOffline: (n) => `现在没有网络。你的 ${n} 处改动安全地留在这台设备上，什么都没丢。`,
    failBusy: (n) => `现在很忙。你的 ${n} 处改动是安全的，什么都没丢。请等一分钟再试。`,
    failBroken: '带着这些改动，游戏读不出来。需要修的地方在这里：',
    failBlocked: (owner) =>
      `GitHub 设置了不让编辑器改这个游戏。请游戏的主人 ${owner} 让编辑器可以改它。你的改动安全地留在这里。`,
    failLook: '你可以看这个游戏，但不能再改了。你的改动安全地留在这里，请改为保留一份副本。',
    failElse: '出了点问题，改动没有放进去。它们安全地留在这里，什么都没丢。',
    again: '再试一次',
    notNow: '现在不要',
    waitTitle: (by) => (by === '' ? '等待检查' : `在${by}那里，等检查`),
    waitAbout: (by) => `${by === '' ? '有人' : by}拿着你的改动。它们还没进游戏。等待时你可以继续工作。`,
    waitMoreTitle: (by) => (by === '' ? '你最初的改动在等待' : `${by}拿着你最初的改动`),
    waitMoreAbout: (n) => `新的 ${n} 处改动目前只在这台设备上。`,
  },
  pt: {
    putTitle: (n) => `Colocar ${n} ${many(n) ? 'mudanças' : 'mudança'} no jogo`,
    sendTitle: (n, by) =>
      `Enviar ${n} ${many(n) ? 'mudanças' : 'mudança'}${by === '' ? ' para conferir' : ` para ${by}`}`,
    putAbout: (where) => `Só você vê isto, ${where}. Se colocar no jogo, sua equipe também vê.`,
    sendAbout: (by, where) =>
      `${by === '' ? 'Alguém' : by} coloca no jogo ou diz o que mudar. Até lá, só você vê, ${where}.`,
    putThem: 'Colocar',
    sendThem: (by) => (by === '' ? 'Enviar para conferir' : `Enviar para ${by} conferir`),
    putAnyway: 'Colocar mesmo assim',
    sendAnyway: 'Enviar mesmo assim',
    notYet: 'Ainda não',
    warnPut: 'Você ainda pode colocar. Se isto avisa antes, é escolhido em Ajustes.',
    warnSend: 'Você ainda pode enviar. Se isto avisa antes, é escolhido em Ajustes.',
    fixFirst: (n) => `Conserte ${n} ${many(n) ? 'problemas' : 'problema'} primeiro`,
    stopsAbout:
      'Este jogo pede que todos os problemas sejam consertados antes das mudanças, para ninguém jogar com um.',
    stopsSafe:
      'Suas mudanças ficam seguras neste dispositivo até lá. Só um dono pode mudar esta regra, em Ajustes.',
    afterSend: (by) =>
      `Depois de enviar, a barra de cima vai dizer “${by === '' ? 'Esperando conferência' : `Esperando ${by}`}”.`,
    showMe: 'Mostre-me',
    cameIn: (n) =>
      `${many(n) ? `Entraram ${n} mudanças` : 'Entrou 1 mudança'} do jogo enquanto você trabalhava. Já ${many(n) ? 'estão' : 'está'} no seu nível. Aperte mais uma vez para colocar as suas.`,
    clashed: (n) =>
      `${many(n) ? `${n} das suas mudanças batem` : '1 das suas mudanças bate'} com as de outra pessoa. Por enquanto fica a versão do jogo. Desfazer traz a sua de volta.`,
    working: 'Um momento…',
    onDevice: (device) =>
      device === 'ipad' ? 'neste iPad' : device === 'phone' ? 'neste celular' : 'neste computador',
    clashTitle: 'Ficou a versão do jogo',
    sendIt: (n) => (Number(n) === 1 ? 'Enviar também' : 'Enviar todas também'),
    doneTitle: 'No jogo',
    doneAbout: (game, n) => `Todos em ${game} já têm ${many(n) ? `suas ${n} mudanças` : 'sua mudança'}.`,
    sentTitle: (by) => (by === '' ? 'Enviado para conferir' : `Enviado para ${by} conferir`),
    sentAbout: 'Você verá aqui quando estiverem no jogo. Pode continuar trabalhando.',
    takeBack: 'Pegar de volta',
    takenBack: 'De volta. Suas mudanças são só suas de novo, neste dispositivo.',
    takeBackFailed:
      'Não deu para pegar de volta. Suas mudanças estão seguras: nada se perdeu. Tente de novo.',
    failPut: 'Não deu para colocar',
    failSend: 'Não deu para enviar',
    failOffline: (n) =>
      `Não há internet agora. ${many(n) ? `Suas ${n} mudanças estão seguras` : 'Sua mudança está segura'} neste dispositivo: nada se perdeu.`,
    failBusy: (n) =>
      `Está tudo ocupado agora. ${many(n) ? `Suas ${n} mudanças estão seguras` : 'Sua mudança está segura'}: nada se perdeu. Espere um minuto e tente de novo.`,
    failBroken: 'O jogo não seria lido com estas mudanças. Isto precisa de conserto:',
    failBlocked: (owner) =>
      `O GitHub está configurado para impedir que o editor mude este jogo. Peça a ${owner}, que é dono do jogo, para deixar o editor mudá-lo. Suas mudanças estão seguras aqui.`,
    failLook:
      'Você pode ver este jogo, mas não pode mais mudá-lo. Suas mudanças estão seguras aqui: guarde uma cópia.',
    failElse: 'Algo deu errado e suas mudanças não foram colocadas. Estão seguras aqui: nada se perdeu.',
    again: 'Tentar de novo',
    notNow: 'Agora não',
    waitTitle: (by) => (by === '' ? 'Esperando conferência' : `Com ${by}, para conferir`),
    waitAbout: (by) =>
      `${by === '' ? 'Alguém' : by} está com suas mudanças. Elas ainda não estão no jogo. Você pode continuar trabalhando enquanto espera.`,
    waitMoreTitle: (by) =>
      by === '' ? 'Suas primeiras mudanças esperam' : `${by} está com suas primeiras mudanças`,
    waitMoreAbout: (n) =>
      `${many(n) ? `Estas ${n} novas estão` : 'Esta nova está'} só neste dispositivo por enquanto.`,
  },
  fr: {
    putTitle: (n) => `Mettre ${n} ${many(n) ? 'changements' : 'changement'} dans le jeu`,
    sendTitle: (n, by) =>
      `Envoyer ${n} ${many(n) ? 'changements' : 'changement'}${by === '' ? ' à vérifier' : ` à ${by}`}`,
    putAbout: (where) => `Toi seul les vois, ${where}. Mets-les dans le jeu et ton équipe les verra aussi.`,
    sendAbout: (by, where) =>
      `${by === '' ? 'Quelqu’un' : by} les met dans le jeu, ou te dit quoi changer. D’ici là, toi seul les vois, ${where}.`,
    putThem: 'Les mettre',
    sendThem: (by) => (by === '' ? 'Envoyer à vérifier' : `Envoyer à ${by} pour vérifier`),
    putAnyway: 'Les mettre quand même',
    sendAnyway: 'Les envoyer quand même',
    notYet: 'Pas encore',
    warnPut: 'Tu peux quand même les mettre. Que cela te prévienne avant, c’est dans les Réglages.',
    warnSend: 'Tu peux quand même les envoyer. Que cela te prévienne avant, c’est dans les Réglages.',
    fixFirst: (n) => `Répare d’abord ${n} ${many(n) ? 'problèmes' : 'problème'}`,
    stopsAbout:
      'Ce jeu demande que tous les problèmes soient réparés avant les changements, pour que personne n’en rencontre.',
    stopsSafe:
      'Tes changements sont en sécurité sur cet appareil d’ici là. Seul un propriétaire peut changer cette règle, dans les Réglages.',
    afterSend: (by) =>
      `Après l’envoi, la barre du haut dira « ${by === '' ? 'En attente de vérification' : `En attente de ${by}`} ».`,
    showMe: 'Montre-moi',
    cameIn: (n) =>
      `${many(n) ? `${n} changements sont arrivés` : '1 changement est arrivé'} du jeu pendant que tu travaillais. ${many(n) ? 'Ils sont' : 'Il est'} déjà dans ton niveau. Appuie encore une fois pour mettre les tiens.`,
    clashed: (n) =>
      `${many(n) ? `${n} de tes changements se heurtent` : '1 de tes changements se heurte'} à ceux de quelqu’un d’autre. La version du jeu est gardée pour l’instant. Annuler rapporte la tienne.`,
    working: 'Un instant…',
    onDevice: (device) =>
      device === 'ipad' ? 'sur cet iPad' : device === 'phone' ? 'sur ce téléphone' : 'sur cet ordinateur',
    clashTitle: 'La version du jeu est gardée',
    sendIt: (n) => (Number(n) === 1 ? 'L’envoyer aussi' : 'Les envoyer aussi'),
    doneTitle: 'Dans le jeu',
    doneAbout: (game, n) =>
      `Tout le monde sur ${game} a ${many(n) ? `tes ${n} changements` : 'ton changement'} maintenant.`,
    sentTitle: (by) => (by === '' ? 'Envoyé pour vérification' : `Envoyé à ${by} pour vérifier`),
    sentAbout: 'Tu verras ici quand ils seront dans le jeu. Tu peux continuer à travailler.',
    takeBack: 'Les reprendre',
    takenBack: 'Repris. Tes changements sont de nouveau à toi seul, sur cet appareil.',
    takeBackFailed:
      'Impossible de les reprendre. Tes changements sont en sécurité : rien n’est perdu. Réessaie.',
    failPut: 'Impossible de les mettre',
    failSend: 'Impossible de les envoyer',
    failOffline: (n) =>
      `Il n’y a pas d’internet pour l’instant. ${many(n) ? `Tes ${n} changements sont en sécurité` : 'Ton changement est en sécurité'} sur cet appareil : rien n’est perdu.`,
    failBusy: (n) =>
      `C’est très occupé en ce moment. ${many(n) ? `Tes ${n} changements sont en sécurité` : 'Ton changement est en sécurité'} : rien n’est perdu. Attends une minute et réessaie.`,
    failBroken: 'Le jeu ne se lirait pas avec ces changements. Voici ce qu’il faut réparer :',
    failBlocked: (owner) =>
      `GitHub est réglé pour empêcher l’éditeur de changer ce jeu. Demande à ${owner}, à qui est le jeu, de laisser l’éditeur le changer. Tes changements sont en sécurité ici.`,
    failLook:
      'Tu peux regarder ce jeu, mais tu ne peux plus le changer. Tes changements sont en sécurité ici : garde plutôt une copie.',
    failElse:
      'Un problème est survenu et tes changements n’ont pas été mis. Ils sont en sécurité ici : rien n’est perdu.',
    again: 'Réessayer',
    notNow: 'Pas maintenant',
    waitTitle: (by) => (by === '' ? 'En attente de vérification' : `Chez ${by}, à vérifier`),
    waitAbout: (by) =>
      `${by === '' ? 'Quelqu’un' : by} a tes changements. Ils ne sont pas encore dans le jeu. Tu peux continuer à travailler en attendant.`,
    waitMoreTitle: (by) =>
      by === '' ? 'Tes premiers changements attendent' : `${by} a tes premiers changements`,
    waitMoreAbout: (n) =>
      `${many(n) ? `Ces ${n} nouveaux ne sont` : 'Ce nouveau n’est'} que sur cet appareil pour l’instant.`,
  },
  ru: {
    putTitle: (n) => `Внести в игру: ${n} ${plural(n, 'изменение', 'изменения', 'изменений')}`,
    sendTitle: (n, by) =>
      `Отправить ${n} ${plural(n, 'изменение', 'изменения', 'изменений')}${by === '' ? ' на проверку' : `: ${by}`}`,
    putAbout: (where) => `Сейчас их видишь только ты, ${where}. Внеси их в игру, и твоя команда тоже увидит.`,
    sendAbout: (by, where) =>
      `${by === '' ? 'Кто-то' : by} внесёт их в игру или скажет, что поправить. До тех пор их видишь только ты, ${where}.`,
    putThem: 'Внести',
    sendThem: (by) => (by === '' ? 'Отправить на проверку' : `Отправить ${by} на проверку`),
    putAnyway: 'Всё равно внести',
    sendAnyway: 'Всё равно отправить',
    notYet: 'Пока нет',
    warnPut: 'Внести всё равно можно. Предупреждать ли заранее, выбирается в Настройках.',
    warnSend: 'Отправить всё равно можно. Предупреждать ли заранее, выбирается в Настройках.',
    fixFirst: (n) => `Сначала исправь: ${n} ${plural(n, 'проблема', 'проблемы', 'проблем')}`,
    stopsAbout:
      'Эта игра требует исправить все проблемы до изменений, чтобы игроки ни с одной не встретились.',
    stopsSafe:
      'До тех пор твои изменения в безопасности на этом устройстве. Менять это правило может только владелец, в Настройках.',
    afterSend: (by) =>
      `После отправки в верхней панели будет написано «${by === '' ? 'Ждёт проверки' : `Ждёт: ${by}`}».`,
    showMe: 'Покажи',
    cameIn: (n) =>
      `Пока ты работал, в игру пришло: ${n} ${plural(n, 'изменение', 'изменения', 'изменений')}. Теперь они в твоём уровне. Нажми ещё раз, чтобы внести свои.`,
    clashed: (n) =>
      `${n} ${plural(n, 'твоё изменение пересекается', 'твоих изменения пересекаются', 'твоих изменений пересекаются')} с чужими. Пока остаётся версия игры. «Отменить» вернёт твою.`,
    working: 'Минуточку…',
    onDevice: (device) =>
      device === 'ipad' ? 'на этом iPad' : device === 'phone' ? 'на этом телефоне' : 'на этом компьютере',
    clashTitle: 'Осталась версия игры',
    sendIt: 'Отправить и их',
    doneTitle: 'В игре',
    doneAbout: (game, n) => `Все в ${game} теперь видят твои изменения: ${n}.`,
    sentTitle: (by) => (by === '' ? 'Отправлено на проверку' : `Отправлено ${by} на проверку`),
    sentAbout: 'Здесь будет видно, когда они попадут в игру. Можно продолжать работать.',
    takeBack: 'Забрать обратно',
    takenBack: 'Забрано. Изменения снова только твои, на этом устройстве.',
    takeBackFailed:
      'Не удалось забрать обратно. Изменения в безопасности: ничего не потеряно. Попробуй снова.',
    failPut: 'Не удалось внести',
    failSend: 'Не удалось отправить',
    failOffline: (n) =>
      `Сейчас нет интернета. Изменения (${n}) в безопасности на этом устройстве: ничего не потеряно.`,
    failBusy: (n) =>
      `Сейчас очень занято. Изменения (${n}) в безопасности: ничего не потеряно. Подожди минуту и попробуй снова.`,
    failBroken: 'С этими изменениями игра не прочитается. Вот что нужно поправить:',
    failBlocked: (owner) =>
      `GitHub настроен так, что редактор не может менять эту игру. Попроси владельца игры, ${owner}, разрешить редактору её менять. Твои изменения в безопасности здесь.`,
    failLook:
      'Эту игру можно смотреть, но больше нельзя менять. Твои изменения в безопасности здесь: лучше сохрани копию.',
    failElse: 'Что-то пошло не так, и изменения не внесены. Они в безопасности здесь: ничего не потеряно.',
    again: 'Попробовать снова',
    notNow: 'Не сейчас',
    waitTitle: (by) => (by === '' ? 'Ждёт проверки' : `У ${by}, на проверке`),
    waitAbout: (by) =>
      `${by === '' ? 'Кто-то' : by} получил твои изменения. В игре их ещё нет. Пока ждёшь, можно продолжать работать.`,
    waitMoreTitle: (by) => (by === '' ? 'Твои первые изменения ждут' : `У ${by} твои первые изменения`),
    waitMoreAbout: (n) => `Новых изменений: ${n}. Пока они только на этом устройстве.`,
  },
  de: {
    putTitle: (n) => `${n} ${many(n) ? 'Änderungen' : 'Änderung'} ins Spiel bringen`,
    sendTitle: (n, by) =>
      `${n} ${many(n) ? 'Änderungen' : 'Änderung'} ${by === '' ? 'zum Prüfen senden' : `an ${by} senden`}`,
    putAbout: (where) => `Nur du siehst sie, ${where}. Bring sie ins Spiel, dann sieht sie auch dein Team.`,
    sendAbout: (by, where) =>
      `${by === '' ? 'Jemand' : by} bringt sie ins Spiel oder sagt dir, was zu ändern ist. Bis dahin siehst nur du sie, ${where}.`,
    putThem: 'Ins Spiel bringen',
    sendThem: (by) => (by === '' ? 'Zum Prüfen senden' : `An ${by} zum Prüfen senden`),
    putAnyway: 'Trotzdem ins Spiel bringen',
    sendAnyway: 'Trotzdem senden',
    notYet: 'Noch nicht',
    warnPut:
      'Du kannst sie trotzdem ins Spiel bringen. Ob dich das vorher warnt, stellst du in den Einstellungen ein.',
    warnSend: 'Du kannst sie trotzdem senden. Ob dich das vorher warnt, stellst du in den Einstellungen ein.',
    fixFirst: (n) => `Behebe zuerst ${n} ${many(n) ? 'Probleme' : 'Problem'}`,
    stopsAbout:
      'Dieses Spiel verlangt, dass jedes Problem behoben ist, bevor Änderungen hineinkommen, damit Spielende keinem begegnen.',
    stopsSafe:
      'Deine Änderungen sind bis dahin sicher auf diesem Gerät. Nur ein Besitzer kann diese Regel ändern, in den Einstellungen.',
    afterSend: (by) =>
      `Nach dem Senden steht in der oberen Leiste „${by === '' ? 'Wartet auf Prüfung' : `Wartet auf ${by}`}“.`,
    showMe: 'Zeig mir',
    cameIn: (n) =>
      `Während du gearbeitet hast, ${many(n) ? `kamen ${n} Änderungen` : 'kam 1 Änderung'} aus dem Spiel dazu. ${many(n) ? 'Sie sind' : 'Sie ist'} jetzt in deinem Level. Drück noch einmal, um deine hineinzubringen.`,
    clashed: (n) =>
      `${many(n) ? `${n} deiner Änderungen kollidieren` : '1 deiner Änderungen kollidiert'} mit denen von jemand anderem. Vorerst bleibt die Version des Spiels. „Rückgängig“ holt deine zurück.`,
    working: 'Einen Moment…',
    onDevice: (device) =>
      device === 'ipad' ? 'auf diesem iPad' : device === 'phone' ? 'auf diesem Handy' : 'auf diesem Computer',
    clashTitle: 'Die Version des Spiels bleibt',
    sendIt: 'Auch senden',
    doneTitle: 'Im Spiel',
    doneAbout: (game, n) =>
      `Alle bei ${game} haben jetzt ${many(n) ? `deine ${n} Änderungen` : 'deine Änderung'}.`,
    sentTitle: (by) => (by === '' ? 'Zum Prüfen gesendet' : `An ${by} zum Prüfen gesendet`),
    sentAbout: 'Hier siehst du, wenn sie im Spiel sind. Du kannst weiterarbeiten.',
    takeBack: 'Zurückholen',
    takenBack: 'Zurückgeholt. Deine Änderungen gehören wieder nur dir, auf diesem Gerät.',
    takeBackFailed:
      'Konnte sie nicht zurückholen. Deine Änderungen sind sicher: nichts geht verloren. Versuch es noch mal.',
    failPut: 'Konnte sie nicht ins Spiel bringen',
    failSend: 'Konnte sie nicht senden',
    failOffline: (n) =>
      `Gerade gibt es kein Internet. ${many(n) ? `Deine ${n} Änderungen sind` : 'Deine Änderung ist'} sicher auf diesem Gerät: nichts geht verloren.`,
    failBusy: (n) =>
      `Gerade ist viel los. ${many(n) ? `Deine ${n} Änderungen sind` : 'Deine Änderung ist'} sicher: nichts geht verloren. Warte eine Minute und versuch es noch mal.`,
    failBroken: 'Mit diesen Änderungen ließe sich das Spiel nicht lesen. Das muss repariert werden:',
    failBlocked: (owner) =>
      `GitHub ist so eingestellt, dass der Editor dieses Spiel nicht ändern darf. Bitte ${owner}, dem das Spiel gehört, den Editor es ändern zu lassen. Deine Änderungen sind hier sicher.`,
    failLook:
      'Du kannst dieses Spiel ansehen, aber nicht mehr ändern. Deine Änderungen sind hier sicher: behalte stattdessen eine Kopie.',
    failElse:
      'Etwas ist schiefgegangen, und deine Änderungen wurden nicht hineingebracht. Sie sind hier sicher: nichts geht verloren.',
    again: 'Noch mal versuchen',
    notNow: 'Jetzt nicht',
    waitTitle: (by) => (by === '' ? 'Wartet auf Prüfung' : `Bei ${by}, zum Prüfen`),
    waitAbout: (by) =>
      `${by === '' ? 'Jemand' : by} hat deine Änderungen. Sie sind noch nicht im Spiel. Du kannst weiterarbeiten, während du wartest.`,
    waitMoreTitle: (by) =>
      by === '' ? 'Deine ersten Änderungen warten' : `${by} hat deine ersten Änderungen`,
    waitMoreAbout: (n) =>
      `${many(n) ? `Diese ${n} neuen sind` : 'Diese neue ist'} bisher nur auf diesem Gerät.`,
  },
} as const satisfies Area<Key>

/** Russian's three forms of a counted word: 1, 2 to 4, and the rest (11 to 14 are always the rest). */
function plural(n: string | number, one: string, few: string, other: string): string {
  const last = Number(n) % 10
  const tens = Number(n) % 100
  if (tens >= 11 && tens <= 14) return other
  return last === 1 ? one : last >= 2 && last <= 4 ? few : other
}
