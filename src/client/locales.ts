/**
 * The panel's dictionaries.
 *
 * `zh` is the source: this plugin's users write Chinese, and translating out of
 * the language the copy was thought in loses less than translating into it.
 * `en` is pinned to the same key set by `satisfies`, so a key added to one and
 * forgotten in the other is a compile error rather than a blank label.
 *
 * ## Vocabulary rules the wording follows
 *
 * - **"unknown" is never rendered as "offline".** The CLI is emphatic that a
 *   null online state means nobody has probed, and the copy has to preserve
 *   that or the user goes to debug a network that is fine.
 * - **The panel says what is, never what to do.** It is a status surface;
 *   instructions belong to the CLI's own error text, which the panel shows
 *   verbatim when something fails. The two pairing **dialogs** are the
 *   exception and the reason the rule is worded this way now: a dialog is a
 *   task surface, and a task surface that will not say what the task is leaves
 *   the user holding a QR code with no idea which device is supposed to read
 *   it. Keep such sentences inside the dialogs.
 */

/** Dictionary namespace owned by this plugin. */
export const NS = 'swarmdrop'

/** Simplified Chinese panel copy (source). */
export const zh = {
  name: 'SwarmDrop',
  /** 页头副标题。说这条通道是什么，不说它有多好。 */
  tagline: '在 DSH 与你自己的设备之间传文件',

  node: '节点',
  nodeRunning: '运行中',
  nodeStopped: '已停止',
  nodeUnknown: '读取中…',

  /**
   * 结论层那**一句话**。措辞由 SwarmDrop `DESIGN.md` 的 Node Status Contract
   * 逐字定死，四端（本插件是第四个）必须一致。
   *
   * **必须是后果句，不能是形容词。** 「良好」「受限」这类没有主语的词说不出
   * 「谁能不能连到我」，而那才是用户打开这里要问的唯一问题。
   */
  healthNotRunning: '节点未运行',
  healthStarting: '正在连接网络…',
  healthReachable: '其他网络的设备可以连到你',
  healthLanReachable: '只有同一网络里的设备能连到你',
  healthConfiguredLanOnly: '你关闭了公网可达性，其他网络的设备找不到你',
  healthIsolated: '连不上任何网络，检查引导节点',

  /** 结论层：已配对多少台、其中多少台在线。 */
  pairedSummary: '已配对 {paired} · 在线 {online}',

  /** 单条基础设施关系的状态词，同样由契约定死。 */
  linkSeedOnly: '仅 DHT 种子',
  linkExcluded: '已按设置排除',
  linkSettling: '正在连接',
  linkOk: '已就绪',
  linkLost: '连接已断',
  linkUnreachable: '连不上',
  /** 诊断层里那张表的标题。 */
  infraLinks: '引导 / 中继关系',
  copyError: '复制错误信息',

  /**
   * 接收策略的判定结果。
   *
   * **这条在命令行宿主上格外值得说**：新配对设备的默认档位带 `require_confirmation`，
   * 而常驻节点没有终端可以举着确认框，于是它替用户答了「接受」。桌面端会停下来问的
   * 那一次，这里是自动过的——是有意的取舍，但用户看不见就无从知道取舍发生过。
   */
  policyAutoAccept: '按设备策略自动接收',
  policyConfirmed: '策略本要求确认，由常驻节点代答',
  policyRejected: '按设备策略拒绝',

  /**
   * 会话行的文案。
   *
   * 这些串此前是硬编码英文——`nodes.tsx` 当时的理由是「这些行只画设备名和字节数，
   * 没什么可翻译的」。加上方向词、文件计数、结束原因与三个控制动词之后，那个前提
   * 不再成立，于是按那条注释自己给出的答案办：用本插件自己的 namespace，而不是去借
   * `conversation` 的。
   */
  rowSent: '已发送',
  rowReceived: '已接收',
  rowFiles: '{count} 个文件',
  rowMessage: '一条消息',
  rowProgress: '{done} / {total}',
  rowRate: '{rate}/s',
  rowLeft: '剩余 {duration}',
  rowInInbox: '已进收件箱，可用 @ 引用',
  /** 传输的结束原因。CLI 给的是枚举，不是给人读的词。 */
  rowEnded: '已结束',
  reasonCompleted: '已完成',
  reasonCancelled: '已取消',
  reasonRejected: '被拒绝',
  reasonExpired: '已过期',
  ctrlPause: '暂停',
  ctrlResume: '继续',
  ctrlCancel: '取消',
  start: '启动',
  stop: '停止',

  network: '网络',
  nat: 'NAT',
  relay: '中继',
  relayReady: '已就绪',
  relayWaiting: '未就绪',
  bootstrap: '引导节点',
  bootstrapConnected: '已连接',
  bootstrapWaiting: '未连接',
  peers: '已连接节点',
  listen: '监听地址',
  listenCount: '{count} 个',

  devices: '已配对设备',
  /**
   * 设备在线状态的三个词。**「未知」绝不能写成「离线」**——见本文件顶部的
   * 词汇规则，以及 SwarmDrop `DESIGN.md` 的 Device Card Contract：在线状态
   * 必须「既有点也有词」，光一个彩色圆点不算数。
   */
  deviceOnline: '在线',
  deviceOffline: '离线',
  deviceUnknownState: '未知',
  noDevices: '还没有配对任何设备',
  forget: '解除',
  forgetConfirm: '确认解除',

  pairing: '配对',
  addDevice: '添加设备',
  waitingForDevice: '等待设备扫码…',
  pairingHint: '让另一台设备上的 SwarmDrop 扫这个码；扫不了就把链接发过去。',
  pairingInProgress: '配对进行中',
  viewPairing: '查看',
  qrAlt: '配对邀请二维码',
  qrUnavailable: '二维码不可用',
  qrNoRoom: '窗口太窄，放不下一张扫得动的码',
  qrNeedsNewerCli: '画二维码要 swarmdrop {minimum} 起；先升级，或用下面的链接。',
  copyLink: '复制链接',
  copied: '已复制',
  copyFailed: '复制失败',
  openOnThisDevice: '在本设备打开',
  cancelPairing: '取消配对',
  close: '关闭',
  cancel: '取消',
  pairingRequestTitle: '收到配对请求',
  device: '设备',
  unnamedDevice: '（未命名）',
  system: '系统',
  link: '链路',
  linkLan: '局域网',
  linkRelay: '中继',
  linkDirect: '直连',
  linkUnknown: '未知',
  verifyHint: '请对方念一遍节点标识的开头几位——设备名是对方自己填的，标识不是。',
  accept: '接受',
  decline: '拒绝',
  pairedWith: '已与「{device}」配对',
  done: '完成',

  inbox: '收件箱',
  inboxCount: '{count} 项',
  inboxMore: '更多在设置 → SwarmDrop 里',
  inboxFiles: '{count} 个文件',
  inboxText: '一条消息',

  inFlight: '正在传输',
  transferSending: '发往',
  transferReceiving: '来自',
  // 速率与剩余时间说不出来时的占位符。**不写「0 B/s」**：核心把速率归零表达的是
  // 「一个窗口内没有新字节」（对端在确认、接收方正在保存收齐的文件），说成 0 是在
  // 报告一个没发生的停滞。
  transferUnknownRate: '—',
  transferEta: '剩余 {eta}',
  // 两个阶段方向相反，不能共用一句：`offered` 是**收到**对端的 Offer、等本机用户
  // 点接受（`TransferState::offered`），`waiting_accept` 才是已发出、等对端。写成
  // 同一句会让一条需要用户自己确认的入站传输显示「等对方」——于是没人去动它。
  transferPhaseOffered: '等你确认',
  transferPhaseWaitingAccept: '等待对方确认',
  transferPhaseSuspended: '已暂停',

  stale: '与 SwarmDrop 的订阅断了，正在重连；下面的信息可能是旧的。',

  // ── 设置页 ──
  //
  // 与面板同一份字典：两处说的是同一个子系统，同一件事在两个界面里长出两种叫法，
  // 用户会以为它们是两回事。
  navOverview: '概览',
  navInvites: '邀请',
  navInbox: '收件箱',
  navTransfers: '传输记录',
  navSettings: '设置',
  navBootstrap: '引导节点',
  navAbout: '关于',

  refresh: '刷新',
  loading: '读取中…',
  notLoaded: '还没有读取',
  dismiss: '知道了',
  edit: '修改',
  save: '保存',
  clear: '清除',
  remove: '移除',
  copyNodeId: '复制节点标识',
  copyAddress: '复制地址',
  copyPath: '复制路径',
  noListenAddrs: '（无）',

  invites: '已发出的邀请',
  invitesHint: '邀请有效 24 小时、跨重启存活，且谁拿到谁就能配对。泄露了就在这里撤销。',
  noInvites: '当前没有未过期的邀请',
  revoke: '撤销',
  revokeAll: '全部撤销',
  inviteConsumed: '已被使用',
  inviteExpiresIn: '{minutes} 分钟后过期',

  inboxEmpty: '收件箱是空的',
  inboxFrom: '来自 {device}',
  inboxMissing: '文件已不在磁盘上，导不出来。',
  export: '导出',
  exportTo: '导出到',

  transfers: '传输记录',
  noTransfers: '还没有传输记录',
  directionSend: '发送',
  directionReceive: '接收',
  pause: '暂停',
  resume: '恢复',
  cancelTransfer: '取消',

  settings: '本机设置',
  settingDeviceName: '设备名',
  settingReceiveDir: '接收落点',
  inEffect: '当前生效',
  valueUnset: '（未设置）',
  sourceEnv: '来自环境变量',
  sourceConfig: '你设置的',
  sourceDefault: '默认值',
  overriddenBy: '此刻被环境变量 {variable} 压着，改这里要等它取消后才生效。',

  bootstrapNodes: '引导 / 中继节点',
  bootstrapHint: '跨网互通的入口。内置那几条随版本更新；你的增删是叠加在它之上的。',
  bootstrapEmpty: '清单是空的——本机只能在局域网内发现设备，跨网不可达。',
  addBootstrap: '添加',
  originBuiltin: '内置',
  originCustom: '自定义',
  relayConnecting: '中继连接中',
  relayFailed: '中继连不上',

  about: '关于',
  pluginVersion: '插件版本',
  cliVersion: 'swarmdrop 版本',
  cliMissing: '没找到（未安装或不在 PATH 上）',
  checkUpdate: '检查更新',
  updateAvailable: '有新版本 {version}，停下节点后运行 swarmdrop update 安装它。',
  updateUpToDate: '已是最新版本。',
  updateUnknown: '这份 swarmdrop 由别的方式安装（Homebrew / npm），请用那边更新。',
  binary: '可执行文件',
  binaryOverride: 'SWARMDROP_BIN 指定',
  binaryPath: '你自己安装的',
  binaryBundled: '插件自带',
  binaryMissing: '没找到',
  daemonVersion: '常驻节点版本',
  daemonSilent: '不报告版本（较旧）',
  skewDiffers: '常驻节点是 {daemon}，但这里运行的是 {cli}。新加的命令它可能认不得——'
    + '先 swarmdrop stop 再 swarmdrop start，让它用上当前版本。',
  skewSilent: '常驻节点比这里运行的 swarmdrop 旧。新加的命令它可能认不得——'
    + '先 swarmdrop stop 再 swarmdrop start，让它用上当前版本。',
  cliTooOld: '这份 swarmdrop 是 {version}，插件至少需要 {minimum}。升级它'
    + '（brew upgrade swarmdrop / swarmdrop update），或用 SWARMDROP_BIN 指向别的一份。',
} satisfies Record<string, string>

/** The panel's key set. */
export type SwarmDropKey = keyof typeof zh

/** English panel copy. */
export const en = {
  name: 'SwarmDrop',
  tagline: 'Move files between DSH and your own devices',

  node: 'Node',
  nodeRunning: 'Running',
  nodeStopped: 'Stopped',
  nodeUnknown: 'Checking…',

  healthNotRunning: 'Node is not running',
  healthStarting: 'Connecting to the network…',
  healthReachable: 'Devices on other networks can reach you',
  healthLanReachable: 'Only devices on your network can reach you',
  healthConfiguredLanOnly: "Public reachability is off, so devices on other networks can't find you",
  healthIsolated: "Can't reach any network - check your bootstrap nodes",

  pairedSummary: 'Paired {paired} · online {online}',

  linkSeedOnly: 'DHT seed only',
  linkExcluded: 'Excluded by settings',
  linkSettling: 'Connecting',
  linkOk: 'Ready',
  linkLost: 'Connection lost',
  linkUnreachable: 'Unreachable',
  infraLinks: 'Bootstrap / relay links',
  copyError: 'Copy the error',

  policyAutoAccept: 'Auto-accepted by device policy',
  policyConfirmed: 'Policy asked for confirmation; the resident node answered',
  policyRejected: 'Rejected by device policy',

  rowSent: 'sent',
  rowReceived: 'received',
  rowFiles: '{count} file(s)',
  rowMessage: 'a message',
  rowProgress: '{done} of {total}',
  rowRate: '{rate}/s',
  rowLeft: '{duration} left',
  rowInInbox: 'In your inbox — reference it with @',
  rowEnded: 'ended',
  reasonCompleted: 'completed',
  reasonCancelled: 'cancelled',
  reasonRejected: 'rejected',
  reasonExpired: 'expired',
  ctrlPause: 'Pause',
  ctrlResume: 'Resume',
  ctrlCancel: 'Cancel',
  start: 'Start',
  stop: 'Stop',

  network: 'Network',
  nat: 'NAT',
  relay: 'Relay',
  relayReady: 'Ready',
  relayWaiting: 'Not ready',
  bootstrap: 'Bootstrap',
  bootstrapConnected: 'Connected',
  bootstrapWaiting: 'Not connected',
  peers: 'Connected peers',
  listen: 'Listen addresses',
  listenCount: '{count}',

  devices: 'Paired devices',
  deviceOnline: 'Online',
  deviceOffline: 'Offline',
  deviceUnknownState: 'Unknown',
  noDevices: 'No devices paired yet',
  forget: 'Unpair',
  forgetConfirm: 'Confirm',

  pairing: 'Pairing',
  addDevice: 'Add a device',
  waitingForDevice: 'Waiting for a device…',
  pairingHint: 'Scan this code with SwarmDrop on the other device — or send it the link.',
  pairingInProgress: 'Pairing in progress',
  viewPairing: 'View',
  qrAlt: 'Pairing invite QR code',
  qrUnavailable: 'No QR code',
  qrNoRoom: 'Too narrow here to draw a scannable code',
  qrNeedsNewerCli: 'Drawing a code needs swarmdrop {minimum} — upgrade, or use the link below.',
  copyLink: 'Copy link',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  openOnThisDevice: 'Open on this device',
  cancelPairing: 'Cancel pairing',
  close: 'Close',
  cancel: 'Cancel',
  pairingRequestTitle: 'Pairing request',
  device: 'Device',
  unnamedDevice: '(unnamed)',
  system: 'System',
  link: 'Link',
  linkLan: 'Local network',
  linkRelay: 'Relay',
  linkDirect: 'Direct',
  linkUnknown: 'Unknown',
  verifyHint: 'Have them read back the first characters of the node id — the display name is self-reported, the id is not.',
  accept: 'Accept',
  decline: 'Decline',
  pairedWith: 'Paired with {device}',
  done: 'Done',

  inbox: 'Inbox',
  inboxCount: '{count}',
  inboxMore: 'More in Settings → SwarmDrop',
  inboxFiles: '{count} file(s)',
  inboxText: 'A message',

  inFlight: 'In flight',
  transferSending: 'To',
  transferReceiving: 'From',
  transferUnknownRate: '—',
  transferEta: '{eta} left',
  transferPhaseOffered: 'Waiting for you',
  transferPhaseWaitingAccept: 'Waiting for the other end',
  transferPhaseSuspended: 'Paused',

  stale: 'Lost the SwarmDrop subscription and is reconnecting; what follows may be out of date.',

  navOverview: 'Overview',
  navInvites: 'Invites',
  navInbox: 'Inbox',
  navTransfers: 'Transfers',
  navSettings: 'Settings',
  navBootstrap: 'Bootstrap',
  navAbout: 'About',

  refresh: 'Refresh',
  loading: 'Loading…',
  notLoaded: 'Not loaded yet',
  dismiss: 'Dismiss',
  edit: 'Edit',
  save: 'Save',
  clear: 'Clear',
  remove: 'Remove',
  copyNodeId: 'Copy node id',
  copyAddress: 'Copy address',
  copyPath: 'Copy path',
  noListenAddrs: 'None',

  invites: 'Issued invites',
  invitesHint: 'An invite is valid for 24 hours, survives restarts, and whoever holds it can pair. Revoke one here if it leaked.',
  noInvites: 'No unexpired invites',
  revoke: 'Revoke',
  revokeAll: 'Revoke all',
  inviteConsumed: 'Already used',
  inviteExpiresIn: 'Expires in {minutes} min',

  inboxEmpty: 'The inbox is empty',
  inboxFrom: 'From {device}',
  inboxMissing: 'The files are gone from disk; this cannot be exported.',
  export: 'Export',
  exportTo: 'Export to',

  transfers: 'Transfers',
  noTransfers: 'No transfers yet',
  directionSend: 'Sent',
  directionReceive: 'Received',
  pause: 'Pause',
  resume: 'Resume',
  cancelTransfer: 'Cancel',

  settings: 'This machine',
  settingDeviceName: 'Device name',
  settingReceiveDir: 'Receive directory',
  inEffect: 'In effect',
  valueUnset: 'Not set',
  sourceEnv: 'From an environment variable',
  sourceConfig: 'Set by you',
  sourceDefault: 'Default',
  overriddenBy: 'Held down by {variable} right now — editing this takes effect once that is unset.',

  bootstrapNodes: 'Bootstrap / relay nodes',
  bootstrapHint: 'How this machine reaches the outside. The built-in ones follow the release; your changes layer on top of them.',
  bootstrapEmpty: 'The list is empty — this machine can only find devices on the local network.',
  addBootstrap: 'Add',
  originBuiltin: 'Built-in',
  originCustom: 'Custom',
  relayConnecting: 'Relay connecting',
  relayFailed: 'Relay unreachable',

  about: 'About',
  pluginVersion: 'Plugin version',
  cliVersion: 'swarmdrop version',
  cliMissing: 'Not found (not installed, or not on PATH)',
  checkUpdate: 'Check for updates',
  updateAvailable: 'Version {version} is available — stop the node, then run `swarmdrop update`.',
  updateUpToDate: 'Already up to date.',
  updateUnknown: 'This swarmdrop was installed another way (Homebrew / npm); update it there.',
  binary: 'Executable',
  binaryOverride: 'Set by SWARMDROP_BIN',
  binaryPath: 'Your own install',
  binaryBundled: 'Bundled with this plugin',
  binaryMissing: 'Not found',
  daemonVersion: 'Running node',
  daemonSilent: 'Does not report a version (older)',
  skewDiffers: 'The running node is {daemon}, but this runs {cli}. It may not know newer'
    + ' commands — `swarmdrop stop` then `swarmdrop start -d` so it picks up the current version.',
  skewSilent: 'The running node is older than the swarmdrop this runs. It may not know newer'
    + ' commands — `swarmdrop stop` then `swarmdrop start -d` so it picks up the current version.',
  cliTooOld: 'This swarmdrop is {version}; the plugin needs {minimum} or newer. Upgrade it'
    + ' (`brew upgrade swarmdrop`, `swarmdrop update`), or point SWARMDROP_BIN at another one.',
} satisfies Record<SwarmDropKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The SwarmDrop panel's copy. */
    swarmdrop: SwarmDropKey
  }
}
