# `@` 引用为什么是空的

写于 2026-08-24，**已在 0.7.1 修复**。保留全过程，因为真凶在八个合理怀疑全部排除之后才出现，
而且它属于「静默失效」那一类——没有任何一处报错。

## 症状

输入框打 `@`，菜单里只有 dsh 自带的 Session / 文件候选，**没有 SwarmDrop 分组**。
收件箱里明明有条目。

## 已经排除的（逐条实测，不是推断）

| 怀疑 | 结论 |
|---|---|
| 今天的改动引入的回归 | ❌ **`git stash` 回到未改动的 0.6.0，同样是 undefined**。这是个已经发布出去的既存缺陷 |
| `inputTriggers` 服务缺失 | ❌ 已在 `dsh.client.inject` 里 |
| `sessionProjections` 服务缺失 | ❌ 服务在 **base bundle**（`packages/bundle/base/cordis.patch.yml:126`），profile 里有 |
| projection 没注册 | ❌ Node 侧探针三行全打印：inject 执行、服务可用、`register()` effect 运行 |
| baseline 事件没写 | ❌ 会话日志里有 `swarmdrop/inbox-baseline`，`seq: 3`，**`items: 1`** |
| projection key 两侧不一致 | ❌ 两边都是 `swarmdropInbox` |
| schema 与 view 不匹配 | ❌ `view: state => state`，state 就是 `{items, hasMore}`，与 zod schema 逐字对应 |
| zod 跨实例（插件与 dsh 各有一份 4.4.3） | ❌ dsh 调的是 `def.schema.parse(...)`，**duck typing，不做 `instanceof`** |
| 浏览器侧拿不到 session / face | ❌ 探针：`hasScope: true, hasSession: true, hasFace: true` |

## 症状的准确形状

同一个会话、同一次读取，四个 key 的客户端快照：

```
{"permissions":"object","goal":"object","tokenUsage":"object","swarmdropInbox":"undefined"}
```

**第一方三个都有值，只有我们的没有。** 且是 `undefined`（key 根本不存在），不是
`{items:[],hasMore:false}`（那会是「折叠跑了但没数据」）——这个区别很关键：如果 unit 在
服务端的 registrations 里，哪怕 `apply` 一次没跑，初始快照也会带上 `view(init())` 的空值。
**拿到 undefined 说明这个 key 从没进过发给客户端的那份 values。**

## 下一步该查哪里

客户端的 projection 值有两条路径（`packages/client/runtime/src/client/sessions/session.ts:115`）：

> initial projections block and updated by `session/projection` frames under the one
> higher-seq-wins rule

- **初始 block**：`installWindow(events, hasMore, result.value.projections)`（session.ts:630）
- **增量帧**：`manager.ts:701` 的 `projectionStore(frame.sessionId).apply(frame.key, ...)`

服务端产出这份 values 的地方遍历 `this.registrations`（`dsh-session-projection/lib/index.js`
里四处 `.parse(` 中的第一处）。两个方向：

1. **时序**：初始 window 查询发生时，我们的 unit 在不在 registrations 里？第一方插件在 base
   bundle 里注册，我们是 profile 里的第三方 bundle，加载顺序靠后。
2. **增量推送的门槛**：`if (changed && this.listeners.size > 0)`。baseline 写在会话创建的
   一瞬间，那时客户端可能还没订阅——错过这一次，之后再没有 swarmdrop 事件，状态引用不变，
   就永远不推。

第 2 条能解释「为什么 items 明明有 1 条却没推」，但解释不了 key 完全缺席；第 1 条能解释
key 缺席。**优先查第 1 条**，办法是在 Node 侧 hook 那个初始 values 的产出点，打印它遍历到的
key 集合。

若查实是「第三方 bundle 注册得太晚，赶不上初始 window」，那是 dsh 侧的时序问题，应当给上游
提 issue——第三方插件没有办法把自己的注册提到 base bundle 之前。


## 真凶：`ProjectionDefinition` 改过名，而 `wire` 是可选的

运行时的 `@deepseek-ai/dsh-session-projection@0.1.1-rc.2` 与本包编译所对的
`0.1.0-rc.8` 之间，这个接口改了两个字段：

| 编译时（rc.8） | 运行时（rc.2） |
|---|---|
| `schema` | `stateSchema` |
| `view` | `wire.view`（旁边还多了 `wire.viewSchema`） |

**关键在于 `wire` 是可选的。** 没有 `wire` 的 unit 是合法的**服务端专用单元**——注册成功、
折叠正确、`checkpoint()` 里看得见，只是**永远不推给客户端**。于是：

- 注册成功（key 在表里）✅
- `apply` 正常跑，state 正确 ✅
- `checkpoint()` 能看到它 ✅
- **`snapshot()`（构造发给客户端那份值的调用）跳过它** ❌
- 客户端读到 `undefined`，`@` 菜单没有 SwarmDrop 组，**没有任何一行日志说明原因**

这正是 dsh 自己在 `api-catalog.ts` 里写的那句话的含义——「a changed state reference
**in a client-visible unit** notifies the change feed」。「client-visible」不是形容词，
是一个由 `wire` 在不在决定的**开关**。

### 定位它的那一步

前面所有探针都在问「注册成功了吗」，答案一直是「成功了」。转折点是改问**表里存的到底长什么样**：

```
[probe] definition BEFORE register {"keys":["key","schema","init","apply","view","stateVersion"],
                                    "view":"function","schema":"object"}
[probe] read back IMMEDIATELY     {"defKeys":["key","stateSchema","init","apply","wire","stateVersion"],
                                    "view":"undefined"}
```

传进去六个字段俱全，读回来字段名换了一套、且函数没了。字段名对不上，是唯一能解释这个的原因。

### 为什么版本会错配

`peerDependencies` 写的是 `^0.1.0-rc.8`。按 node-semver，**一个 caret 范围不会匹配到
`major.minor.patch` 元组不同的预发布版本**：`^0.1.0-rc.8` 展开成
`>=0.1.0-rc.8 <0.2.0`，其中没有任何比较符落在 `0.1.1` 这个元组上并带预发布标签，
所以 `0.1.1-rc.2` 被静默排除。

结果就是：编译时对着一套契约，运行时跑在另一套上，而 peer 检查只出一句 warning。
awesome-dsh-plugin 的 contributing 里专门警告过这条，方向正好相反（那边讲的是漏掉更旧的线）。

### 修法

1. definition **双写两套字段名**（`schema` + `stateSchema`，`view` + `wire`），各版本读各自认识的那对。
2. peer 范围补上 0.1.1 分支：`^0.1.0-rc.8 || ^0.1.1-rc.1`。

第 1 条可以在 peer 范围不再接纳 rc.8 那条线之后删掉。

### 留给下次的判据

**dsh 的扩展点里，可选字段是静默失效的温床。** 一个必填字段拼错会当场报错；一个可选字段
拼错，等于主动声明「我不要这个能力」。碰到「注册成功了但功能没出现」，先去比对
**运行时**（不是 node_modules 里那份）的接口定义有没有多出可选字段。

同日抽查过另外两个扩展点，字段与本包用法一致，没有同类问题：`InputTriggerSource`
（`packages/client/ui-input-trigger/src/types.ts`）与 `ConversationNodeDefinition`
（`packages/client/runtime/src/client/contract/conversation.ts`）。
