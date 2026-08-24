# `@` 引用为什么是空的：一次排查的中间结论

写于 2026-08-24。**未修复**，记下来是为了下次不必从头查一遍。

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
