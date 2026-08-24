# 对着另外三端，dsh-swarmdrop 还缺什么

写于 2026-08-24，对着 SwarmDrop 仓 `DESIGN.md` 的九份跨端契约、`swarmdrop` CLI 0.9.0 的实际
JSON 输出，以及本仓当前代码逐条核实。

**先说一件影响所有结论的事**：另外三端（桌面 / 移动 / Web）直接吃内核的 Rust DTO，字段是全的；
本插件隔着 CLI，**能画什么完全取决于 CLI 那条命令给什么**。所以下面每条缺口都标了它属于哪一类：

- 🟢 **数据已在手** — 纯 UI 工作
- 🟡 **数据在查询命令里，但不在事件流里** — 要多付一次 `swarmdrop` 进程
- 🔴 **CLI 根本不给** — 要先改 SwarmDrop CLI
- ⚪️ **不适用** — dsh 宿主的正当分叉，不是缺口

## 本次已修

| 契约 | 原状 | 现在 |
|---|---|---|
| Node Status | 网络段**对只用设置页的用户永远空白**——`network` 只由侧边栏面板的 `setOpen` 填充，而设置页从不调它 | 设置页有自己的一次性读取入口（`refreshNetwork`），不碰 `panelOpen`、不开定时器 |
| Node Status | 诊断信息平铺在概览页顶部 | 收进一个默认关闭的 disclosure，折叠行仍带结论（中继就绪与否） |
| Device Card 槽 3 | 在线状态只有一个彩色点 | 点**加词**（在线 / 离线 / 未知）。契约原文：「a bare colored dot does not satisfy this」 |
| Transfer List Order | 按 CLI 返回的开始时间排 | 按 `updatedAt` 降序。契约点名过这条：三端曾各用各的键，同一条恢复的会话在两端置顶、在第三端沉底 |

## Device Card Contract：8 个槽，缺 4 个

| # | 槽 | 状态 | 类 |
|---|---|---|---|
| 1 | 设备类型图标 | ❌ | 🟡 `device list` 有 `os`/`arch`，但 `watch` 推的 `DeviceEntry` 只有 `peerId`/`name`/`online` |
| 2 | 显示名 | ✅ | |
| 3 | 在线状态（点+词） | ✅ 本次补 | |
| 4 | 次要身份行 | ⚠️ 有 peerId，无 hostname / 分组 | 🔴 CLI 无分组概念 |
| 5 | 信任徽章 | ❌ | 🔴 `swarmdrop device` 只有 `list` / `forget`，信任策略完全不暴露 |
| 6 | 连接徽章 + 延迟 | ❌ | 🟡 `device list` 有 `connection`（四值：lan/direct/dcutr/relay），事件流没有；**延迟 CLI 完全不给** |
| 7 | 发送动作 | ❌ | ⚪️ dsh 里发送由 agent 工具与 `/swarmdrop send` 承担，设备卡上放按钮反而与宿主的交互模型打架 |
| 8 | 溢出入口（解除配对） | ✅ | |

**槽 6 有个不能踩的坑**：契约明确 `direct` 与 `dcutr` **不可合并成一个词**——前者是「对端地址本来就可拨」
（公网 IP 或 Tailscale），后者是「打洞成功了」，把用户送去查的东西完全相反。三端都曾合并过，
把一条 Tailscale 链路标成「已打洞」。真要做槽 6，照抄 CLI 给的四值，不要自己推导。

## Node Status Contract：结论层缺 2 个，诊断层缺 3 个

**结论层**（契约要求始终可见）：

| # | 槽 | 状态 | 类 |
|---|---|---|---|
| 1 | 状态点 + 词 | ✅ 页头 | |
| 2 | **可达性后果句** | ✅ 本次补 | 六档判据照抄自 `shared-view`，13 条测试钉住分档顺序与宽限三条件 |
| 3 | **已配对 N · 在线 M** | ✅ 本次补 | |
| 4 | 至多一个 CTA | ✅ 启动/停止 | |

槽 2 是这份契约里最有价值的一条，也是最容易做错的一条。契约要求它是**后果句**而不是形容词：

> 「其他网络的设备可以连到你」——绝不能是「良好」「受限」这类没有主语的形容词

六个态与措辞在契约里逐字写死了（`nodeHealth.reachable` / `lanReachable` / `configuredLanOnly` /
`isolated` / `starting` / `notRunning`）。判断逻辑住在 `@swarmdrop/shared-view` 的
`summarizeNodeHealth`，**但那个包是 `private: true`、没发过 npm**，本仓（独立仓）依赖不到，
只能照着契约自己实现一份。原料 CLI 全给了：`publicReachable`、`publicReachabilityEnabled`
（这两个一起才分得开「连不上」和「你自己关的」）、`bootstrapConnected`、`relayReady`。

契约还附带两条判据，自己实现时容易漏：
- **「有些引导节点连不上」不算降级**。连上 1/2 个中继与连上 2 个后果完全相同，`1/2` 是诊断层的
  事实；持久槽位上报警会让用户学会无视状态色。
- **报警要三条同时成立**：不是用户自己的设置造成的 ∧ 过了宽限窗口 ∧ 确实挡住了用户此刻要做的事。

**诊断层**（契约要求「一个折叠 disclosure，默认关闭」）：

| 项 | 状态 | 类 |
|---|---|---|
| 节点 ID / 公网地址 / NAT / 监听地址 | ✅ 已收进折叠 | |
| 每条 infraLink 一行（状态词 · 来源 · scope · roles） | ✅ 本次补 | 🟢 |
| **逐字 `lastError` + 复制按钮** | ✅ 本次补 | 🟢 ~~没有这个字段~~ **更正**：它在 `relay.lastError` 里，只在 `relay.kind == "failed"` 时出现；当时看不到只是因为 relay 处于 active |
| **身份存放位置**（可复制的绝对路径） | ❌ | 🔴 `status --json` 不给 `identityPath` |
| **运行时长** | ❌ | 🔴 `status --json` 不给 `uptime` |

## 其余契约

| 契约 | 状态 |
|---|---|
| **Transfer Progress** | ⚠️ 速率与 ETA 都画了（契约要的是「别让用户自己做除法」，达标）。缺**准备阶段与传输阶段的视觉区分**——契约要求「灰 = 本机在准备，尚无字节上路；品牌色 = 字节真的在动」，因为两条同色进度条会被读成「一次传输重启了两遍」。🟡 CLI 的 `phase` 目前只有 `active`/`suspended`/`terminal`，分不出 prepare |
| **Transfer List Order** | ✅ 本次修 |
| **Incoming Request** | ✅ 配对请求经 portal 挂在面板之外，关掉面板不会带走它——契约要的「全局可见」成立。它**没有关闭入口**，比契约的「关闭 = 拒绝」更严格，不违反<br>⚪️ 文件 offer 那一半**不适用**：CLI 的接收是节点在线时的被动行为，没有决策点 |
| **Receive Location** | ✅ 「设置」tab 经 `swarmdrop config` 管接收落点 |
| **Send Entry** | ⚪️ 正当分叉，见槽 7 |
| **Received File Reuse** | ✅ 收件箱条目可在输入框 `@` 引用——这条在别的端叫「转发」，在 dsh 里是这个插件存在的理由 |
| **Bottom Action / Layout Density** | ⚪️ 移动端专属 |

## 建议的优先级

1. **可达性后果句 + 已配对 N·在线 M**（🟢，结论层，用户最常问的那个问题现在没人回答）
2. **infraLinks 收进诊断折叠**（🟢，「引导节点」tab 的内容本就属于那里）
3. **设备的 os 图标与连接类型**（🟡，代价是概览页多付一次 `device list` 进程；或者说服 CLI 把这两个字段加进 `DeviceEntry`，那样零代价且三端受益）
4. **给 SwarmDrop CLI 提**：`infraLink.lastError`、`status.identityPath`、`status.uptime`、
   `DeviceEntry` 补 `os`/`connection` — 🔴 那一列全部卡在这里，且都是 CLI 内部已有、只是没往外送的信息


## 信任模型：要不要跟桌面 / 移动端对齐

**先纠正一个容易得出的错误结论**：不是「CLI 没有信任模型，所以什么都放行」。

信任策略住在 `crates/transfer/src/policy.rs`，而 CLI 复用同一个 crate，所以**策略照常求值**。
区别只在决策落到哪一档：

| 策略决策 | 触发条件 | 桌面 / 移动 | CLI（含本插件） |
|---|---|---|---|
| `reject` | Blocked · 临时授权过期 · 超 `max_transfer_bytes` · 策略禁目录 | 内核拒 | **内核拒，一样生效** |
| `require_confirmation` | 默认档 `Collaborator` · `trust_confirmed == false` · 经中继 | 弹框问人 | **常驻节点代答接受** |
| `auto_accept` | `Owned`，且有落点 | 直接收 | 直接收 |

也就是说：**Temporary 的 512 MB 上限、禁目录、24 小时过期、Blocked，在 CLI 下全部有效**——
它们走的是硬拒绝那条路，根本不产生 offer 事件。安全底线在。

差的只有中间那一档的人工环节，而 CLI 对此有明确且有文档的立场
（`crates/cli/src/runtime/receive.rs` 的模块注释）：

> 常驻节点必须自己应答入站请求：没有界面可以弹确认框，等一个不会到来的人工确认，结果就是
> 对端一直卡在「等待接受」。**判据是已配对**：能发起传输的对端必然已经过配对握手，那一步
> 才是信任边界。

那段注释还记了一个坑：新配对设备默认就是 `Collaborator`（带 `require_confirmation`），
所以少了自动应答这一支，「其余三端能给 CLI 发文本」这句话在默认配置下**一次都不成立**，
且失败得像网络问题。

### 结论：不做整套对齐，做只读的那一半

判据很简单——**一致性的收益几乎全在「看得见」，复杂度几乎全在「能改」和「能拦」**。

**建议做（🟢 数据都在）：**

1. **`trustLevel` 只读展示**（Device Card 槽 5）。用户在桌面端把某台设备降成 Temporary，
   在 dsh 里完全看不出来——而那台设备的传输确实会被 512 MB 上限拒掉，用户却看不到原因。
   `device list --json` 现在不给这个字段，要 CLI 补；补上后是纯展示，零新概念。
2. **传输行画出 `policyAction` / `policyReason`**。数据**已经在** `transfer list` 里，本插件
   只是没取。「这条是常驻节点代你接受的，因为设备策略本来要求确认」——在一个无人值守的宿主上，
   这正是最该让用户看见的审计痕迹。

**不建议做：**

- **信任档位的编辑 UI**。CLI 没有 `device trust` 命令，要先给 CLI 加一套（4 档 × 9 个策略
  字段），再在插件里做编辑面。这是把一个桌面端概念整体搬进命令行宿主，而它在这里能影响的
  只有 `reject` 那半边——收益与工作量不成比例。
- **入站确认委托给插件**。表面上看 dsh-swarmdrop 有 UI、能弹框（配对请求就是这么做的），
  但它是 CLI 的**客户端**，不是节点持有者：等它应答，就要引入超时、多客户端竞争、以及
  「没有客户端连着时怎么办」的降级——而降级的答案只能是「照旧自动接受」，绕一圈回到原地。
  真要做，得先在 CLI 上开一个显式的 `--defer-confirmation` 模式，那是 CLI 的产品决策，
  不是插件能单方面对齐的。
