# Design

本插件**没有自己的设计系统**，它借宿主的。这份文件记录的是「在宿主约束下怎么决策」，
不是一套独立的令牌表。

## Theme

跟随 DSH。亮色/暗色都由宿主的 `--dsw-*` 自定义属性给出，本插件一处硬编码颜色都不写——
写了就会在暗色下变成一块污渍。

## Color

全部取自宿主 alias 层，不新增：

| 角色 | Token |
|---|---|
| 正文 | `--dsw-alias-label-primary` |
| 次要文字、标签 | `--dsw-alias-label-secondary` |
| 弱化、路径、单位 | `--dsw-alias-label-tertiary` |
| 分隔线 | `--dsw-alias-border-l2` |
| 悬停底 | `--dsw-alias-interactive-bg-hover` |
| 选中态 / 强调 | `--dsw-alias-state-business-primary` |
| 成功 / 警告 / 错误 | `--dsw-alias-state-{success,warn,error}-primary` |

**策略：Restrained。** 强调色只出现在一处——选中态的 tab（文字与下划线）。按钮用宿主自己的
variant，不覆写；状态色只用于状态，不做装饰。

⚠️ **不要用 `--dsw-alias-brand-primary`。** 它在 dsh 的令牌表里解析成中性墨色，不是品牌色，
所以拿它画的「品牌」下划线与正文同色。dsh 自己两处栽过并留了注释
（`ConversationRoot.module.css` 的 tab、`InputBar.module.css` 的光标），都改用了
`state-business-primary`——在明暗两种主题下都保持为蓝的最近语义令牌。本插件同此。

SwarmDrop 的品牌绿（`#0F8F7A`）**不进代码**：那会是本包唯一一处硬编码颜色，且在暗色下
未经验证。品牌标识靠形状承载（`SwarmDropMark`），颜色跟随 `currentColor`。

## Typography

宿主字体，不引入字族。产品界面一个字族足够。

| 用途 | 尺寸 | 字重 | 颜色 |
|---|---|---|---|
| 页头标题 | 15px | 600 | label-primary |
| 分组标题 | 13px | 600 | label-primary |
| 正文 / 行 | 13px | 400 | label-primary |
| 次要说明 | 12px | 400 | label-secondary |
| 单调值（ID、路径、地址） | 11px mono | 400 | label-tertiary |

**分组标题不做 eyebrow。** 曾经是 11px + `textTransform: uppercase` + `letterSpacing`，
七个分组各顶一个。全大写小字是装饰性 kicker，不是层次；层次由字重与尺寸给。

## Layout

- **页头 → tab → 内容**，三段竖向。不再有第二列导航（宿主已经有一列，插件不该再立一列）。
- 页头只放**零成本**信息（名称、节点状态、启停），因为它在七个 tab 下都常驻，而带 fetch 的
  字段会让常驻元素每次都触发一次请求。版本、CLI 路径这类要取数的留在「关于」。
- 内容区全宽，`gap: 20` 分组间距，`gap: 8` 组内。
- tab 在窄容器下横向滚动，不换行——换行会把页头顶成两层高。

## Components

宿主 primitives 优先，不自造：`Button` `Pill` `Input` `Modal` `StateDot` `Tooltip` `Menu`。
本插件只拥有四个共享元件（`console-ui.tsx`）：`Fact`（标签—值行）、`Group`（带标题的块）、
`Empty`（空态一句话）、`Copyable`（值 + 复制按钮），外加页头与 tab。

**圆角一套到底**：卡片 8px、输入与小控件 6px。不混。

**状态齐全**：每个取数的 section 都有 loading（「读取中…」）、empty（一句话说明为什么空）、
error（宿主 error token + 可关闭）三态。没有骨架屏——七个 section 的内容形状差异太大，
骨架屏会比内容还长。

## Motion

150–250ms，`ease-out`。只用于状态变化（tab 切换的下划线滑动、复制成功的图标互换）。
全部在 `prefers-reduced-motion: reduce` 下退化为瞬时。

无入场编排：设置页是任务界面，用户不想看它加载。
