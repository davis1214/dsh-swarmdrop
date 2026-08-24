# Changelog

All notable changes to this project are documented here. The entries are
written by hand and the release workflow reads them back: `gh release create`
is given this file's section for the tag being pushed, so a version with
nothing written down does not get published.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-08-24

### Changed

- The settings page is now a header, a tab strip and one content column. It
  used to place its own vertical nav beside dsh's, which read as one nav split
  in two and spent 128px of the content's width on seven short labels.
- Node liveness and start/stop moved from Overview into the page header, where
  every tab can see them. Nothing costlier joined them: the header mounts under
  all seven pages, and the plugin version and CLI path each cost a `swarmdrop`
  process, so they stay on About.
- Group titles are plain 13px headings. They were 11px uppercase with letter
  spacing, and seven groups each wore one.
- Errors and receipts render under the tabs rather than above the header, and
  the dismiss control is an icon. A long message used to leave the word
  "dismiss" no width, so it wrapped one character per line down the edge.
- Error text is ordinary weight on a neutral ground with a red glyph, instead
  of a wall of red. The CLI puts its remedy at the end of the message, which is
  the part a reader has to get through the diagnosis to reach.

- The sidebar panel shows the node id and the public address on one elided
  line each, with a button that copies them. In full they took two lines and
  four, could not be copied out of, and the address alone was a quarter of the
  panel's height.
- Expanding the panel's inbox now shows size and arrival time per entry, in
  the sender-and-time-over-summary shape a mail client uses. It listed the
  device name and a count, which is what made the expansion not worth the
  click — `PanelInboxEntry` was already carrying `totalSize`, `receivedAt` and
  `contentKind`, and none of the three were drawn.
- **Conversation rows speak the user's language.** Direction, file counts, the
  outcome word, the progress line and the pause/resume/cancel buttons were all
  hardcoded English. `nodes.tsx` had argued that these rows "render device names
  and byte counts, so there is nothing here to translate" — true when it was
  written, and no longer true — and named the fix itself: this plugin's own
  locale namespace rather than borrowing `conversation`'s. That is what the
  registration now passes.
- **An arriving transfer now grows a row in the conversation while it is
  arriving.** Only transfers this plugin started were ever attributed to a
  session, so a device pushing files at this machine produced nothing at all
  until it had finished — the transcript was silent for the whole transfer,
  which reads exactly like nothing happening. Arrivals broadcast to every root
  conversation, on the same reasoning `swarmdrop/inbox-received` already
  followed: a send belongs to the conversation that started it, an arrival
  belongs to nobody in particular. The row carries the same progress bar, rate,
  time remaining and pause/resume/cancel controls the send row has, and leads
  with `←` rather than `→`.
- The inbox row says what only it can say — that the item is now addressable
  with `@`. It repeated the device, count and size the transfer row above it had
  just shown, and gained a structured layout in place of one line of text.
- Transfer rows in Settings state what the receive policy decided
  (`policyAction`), with the CLI's own wording behind the title attribute. On
  this host that is worth surfacing: a newly paired device defaults to
  `Collaborator`, which asks for confirmation, and the resident node answers on
  the user's behalf because there is no terminal to hold a prompt. A row reading
  "received" may be one a desktop build would have stopped to ask about.
- The header states **reachability as a consequence**, not an adjective:
  "devices on other networks can reach you" rather than "good" or "limited".
  The six-tier ladder is copied from SwarmDrop's `shared-view` package, which
  this repository cannot import (it is `private: true` and unpublished), so
  `node-health.ts` is its third implementation and carries tests pinning the
  tier order and the three-part grace rule rather than the wording.
- The header states paired and online counts, the conclusion layer's third slot.
- The network disclosure lists every bootstrap/relay link with its status word,
  attribution (scope · sources · roles) and, when a relay has failed, the
  kernel's **verbatim** `lastError` behind a copy button. The contract forbids
  translating it: it is what a user pastes into an issue.
- Network facts on Overview collapse into one disclosure, closed by default,
  whose collapsed row still states relay readiness. SwarmDrop's Node Status
  Contract fixes this split: a conclusion layer that is always visible, and one
  collapsed disclosure for the diagnostics. Expanded, this machine lists 17
  listen addresses.
- Paired devices state their online status as a **word** beside the dot, in
  both surfaces. The Device Card Contract's third slot is explicit that "a bare
  colored dot does not satisfy this"; the state had been encoded in colour
  alone, which a screen reader cannot read at all.
- Panel group titles are 12px secondary rather than 11px tertiary uppercase.
  `text-transform` does nothing to the Chinese these read in, so all it bought
  was the lowest-contrast text on the panel for the elements meant to be
  scannable.

### Fixed

- The dictionaries were registered inside the panel's `['connection', 'locale']`
  fiber, tying this plugin's copy to a service that has nothing to do with copy:
  a deployment with `locale` but no `connection` got conversation rows and no
  words for them. They now register under `locale` alone.
- **The Network section was permanently empty for anyone who only opened
  Settings.** `network` is filled by a timer that `PanelPort.setOpen` starts,
  and `setOpen` is called by the sidebar panel — which the settings console is
  not. The console now has its own one-shot read (`refreshNetwork`), which does
  not claim the panel is open and does not start the timer: two surfaces sharing
  one boolean would have the first to close stop polling for the one still
  watching.
- The transfer list sorts by `updatedAt`, not by the start order the CLI returns.
  Per the Transfer List Order Contract: a session started three days ago and
  resumed a minute ago is the most relevant row on the screen, and start order
  buries it. The three graphical builds were reconciled onto this key on
  2026-08-12; this one had not been.
- **Six design tokens did not exist and had been failing silently.** An
  unresolved `var()` falls back to the inherited value or to nothing, which
  looks like a design decision:
  - `fill-tertiary` and `fill-brand` (dsh has no `fill-*` at all) drew the
    transfer progress bar as a transparent groove with a transparent fill. An
    invisible bar looks exactly like a transfer that is not moving.
  - `state-warning-primary` (the token is `state-warn-*`) left the
    stale-subscription notice and one panel warning in the body colour.
  - `bg-primary` left every text input without a background of its own.
  - `border-secondary` left a button without its outline.
- Tab selection and the progress fill ride `--dsw-alias-state-business-primary`.
  `brand-primary` exists but resolves to neutral ink in dsh's sheet, so an
  underline drawn with it is indistinguishable from text; dsh's own conversation
  tabs moved off it for the same reason.

### Added

- The tab strip follows the WAI-ARIA tabs pattern: `role="tab"`, arrow keys,
  Home and End, and a roving `tabIndex` so one stop covers the strip.
- `scripts/check-tokens.mjs` fails the build on a `--dsw-*` name dsh does not
  define, checked against the installed theme package rather than a list kept
  here. It runs as part of `typecheck`, so CI covers it. The one case it cannot
  catch is a token that exists and resolves to something unexpected —
  `brand-primary` above; DESIGN.md carries that one.

## [0.6.0] - 2026-08-22

### Changed

- **BREAKING**: the minimum `swarmdrop` is now 0.9.0, up from 0.5.0 — 0.9.0 is
  where `invite qr` arrived, and the pairing dialog's QR code comes from it.
  The floor is not uniform and About says so: below 0.5.0 the plugin is inert,
  while a 0.8.x install keeps working and can still pair — the dialog states
  that it cannot draw a code and leaves the link.
- Pairing moved out of the sidebar popover into two dialogs. Issuing an invite
  now shows a scannable **QR code** rather than several hundred characters of
  link, with copy and open buttons beside it; the link text itself is gone.
- An inbound pairing request now opens a dialog **regardless of whether the
  panel is showing**. It used to render inside the popover, so closing the
  panel meant nobody could answer and the far side timed out.
- Closing the invite dialog no longer ends the pairing. Only "Cancel pairing"
  does. The Pairing section keeps a row saying a desk is open, with a way back
  into it — you close that dialog every time you go paste the link somewhere.

### Added

- The settings console can pair a device too, from Invites. It drives the same
  desk as the panel: one machine, one desk, no way to open a second.
- The bundled `swarmdrop` optional dependency moves to `^0.9.0`, matching the
  floor above — the copy someone with nothing installed ends up running has to
  be one that can draw a code too.

## [0.5.0] - 2026-08-22

### Changed

- A `swarmdrop` on `PATH` now outranks the copy bundled with this package.
  SwarmDrop allows one node per user and its local channel has no version
  negotiation, so running a different binary than the user's terminal does is
  what produced the mismatch. `SWARMDROP_BIN` still overrides both.
- The bundled binary is no longer pre-fetched when it is not the one that will
  be run.

### Added

- About names the executable in use and where it came from, the running node's
  version, and warns when the two are out of step.
- About says so when the `swarmdrop` in use is older than 0.5.0, which the
  plugin needs to subscribe and to pair. Deferring to `PATH` makes a long-idle
  install the one that gets used, and its failures do not look like a version
  problem from the outside.
- A subscription that fails because the binary predates `swarmdrop watch` says
  that, instead of reporting exit code 2.

### Fixed

- Exit codes 2 and 3 carried the wrong hint for a version mismatch — "check the
  arguments" for a client with none to fix, and "start a node" for one that is
  already running. Both cases are now named, in English.

## [0.4.1] - 2026-08-22

### Fixed

- `swarmdrop_transfer_status` reported no failure code. `FailureCode` is a tagged
  object on the wire, and it was read as a string, so every failed transfer came
  back with `null` where the reason belonged.
- The conversation row could not show that a transfer had ended: it read the
  phase from the live channel, which drops a session the moment it reaches
  `terminal`. The log decides that now.
- The panel discarded a `recoverable` change, leaving Resume offered on a
  transfer whose checkpoint was gone.
- An inbound transfer awaiting the user's own confirmation was labelled "waiting
  for the other end". `offered` and `waiting_accept` point in opposite
  directions and no longer share a string.
- `transfer.control` accepted `toString`, `constructor` and three other
  prototype keys as actions, and any string as a transfer id — `--help` among
  them, which the CLI answers with exit 0 and the panel reported as success.
- A progress frame without a total zeroed the row's total for the rest of the
  transfer.
- Exit code 2 has a hint. It is how the CLI refuses a transfer verb the phase
  does not allow, and without one a model reads the usage text as its own
  mistake and retries forever.
- `waitingAccept` is not a phase; the wire is `waiting_accept`. Four documents
  and the model-facing schema said otherwise.
- `InviteRow`'s timestamps are seconds, not milliseconds — 0.4.0 swept them into
  a correction that only applied to the inbox and transfer ones.

## [0.4.0] - 2026-08-22

### Added

- Eight tools, bringing the agent surface level with SwarmDrop's own MCP server:
  `swarmdrop_node_status`, `swarmdrop_search_inbox`, `swarmdrop_inbox_item`,
  `swarmdrop_list_transfers`, `swarmdrop_transfer_status`, and
  `swarmdrop_pause_transfer` / `_resume_transfer` / `_cancel_transfer`.
- Live transfers in the sidebar panel: progress, rate and time remaining, folded
  from the subscription. The rate requires `swarmdrop` 0.7.0.
- `swarmdrop_list_inbox` reports `rootPath`, `contentKind`, `title` and `missing`.
- `swarmdrop_list_devices` takes `onlineOnly`.
- Every tool names what its call is doing on the pending card, with a category
  icon, instead of falling back to the tool name over raw arguments.
- The conversation row for a transfer shows live progress, rate and time
  remaining while it runs, and offers pause / resume / cancel — the verbs the
  CLI will accept in that phase. Requires `swarmdrop` 0.7.0 for the rate; the
  row falls back to the session log when no channel is available or on replay.
- `swarmdrop_search_inbox` requires `swarmdrop` 0.7.0; an older one is reported
  as a version requirement rather than a usage error. The bundled binary moves
  to `^0.7.0` with it — `^0.6.0` does not match 0.7.0, so leaving it would have
  shipped a tool that no bundled install could ever satisfy.

### Fixed

- `swarmdrop_inbox_files` always returned an empty list. It read `files` off the
  entry detail; the CLI reports them under `content.entries`.
- Timestamps are milliseconds, not seconds. Seven doc comments and the tool
  schema said otherwise; the code was already correct.

### Changed

- `tools.ts` is now `tools/`, split by domain (send · inbox · transfer · device)
  over shared projection and failure-translation modules.
- `controlsOf` — which of pause / resume / cancel a transfer's phase allows —
  moved to `console-wire.ts`, where both the settings page and the conversation
  row read it. It mirrors the CLI's own rule and there is now one copy of it.
- A transfer's `speed` is `null` rather than `0` when nothing can be said.

## [0.3.0] - 2026-08-21

### Added

- **A SwarmDrop page in dsh's Settings.** Seven sections behind a nav column:
  overview (node, network, devices), invites, inbox, transfers, this machine's
  settings, bootstrap nodes, and about. The sidebar panel stays what it was —
  a status light — and the page carries everything that needs room.
- **Invites can be revoked from the UI.** An invite is valid for 24 hours,
  survives restarts, and whoever holds it can pair; revoking was previously
  possible only from a terminal.
- **The inbox is listed in full**, with where each item landed and an export
  destination.
- **Transfers can be paused, resumed and cancelled**, with only the controls
  the CLI will actually accept offered per row.
- **The device name and receive directory are editable**, showing which of the
  three sources (environment variable / persisted / built-in default) a value
  comes from — and what is being held down when an environment variable wins.
  Requires `swarmdrop` 0.6.0.
- **Bootstrap / relay nodes can be listed, added and removed**, each with its
  connection and relay state and the kernel's own error text when a relay will
  not come up. Requires `swarmdrop` 0.6.0.
- **The panel's inbox count expands in place** to the newest few entries. It
  does not link to the page: dsh gives `openSection` only to onboarding
  entries, so a plugin cannot open Settings on its own section.
- **A section needing a newer `swarmdrop` says so in one sentence**, instead of
  surfacing clap's usage text to someone who typed nothing.

### Changed

- The panel's state answer now carries the newest few inbox entries, so
  expanding the count costs no process.

### Fixed

- **The panel's controls could stop responding, with nothing on screen saying
  why.** Two independent causes, both structural. `busy` was one flag for the
  whole panel, so a single unsettled call disabled node start/stop, unpair
  *and* pairing at once; it is now keyed per control, and a slow unpair leaves
  the node buttons usable. And browser-side RPC has no timeout of its own, so a
  request that never settled left the `finally` clearing `busy` unrun — the
  control stayed disabled for the life of the page. Every call now has a
  deadline, set above the matching Host-side bound so it is a watchdog on the
  transport rather than a policy on how long an action may take.

- **The machine subscription died silently and never came back.** `swarmdrop
  watch` exits 0 after handling SIGTERM, and the stream layer exempted exit 0
  from being reported — so any end of that process read as an expected one.
  Nothing restarted it, and the panel went on presenting a frozen mirror as
  current. Exits are now reported unless the caller asked for the stop, the
  subscription is supervised with exponential backoff (1 s to 30 s, reset on a
  frame rather than on a spawn), and while it is down the panel says so above
  the facts it qualifies — a mirror that stopped updating is otherwise
  indistinguishable from a machine where nothing is happening.

- **The sidebar entry used a generic share icon.** It is SwarmDrop's own mark
  now, drawn in `currentColor` so it follows the theme and hover state.

## [0.2.1] - 2026-08-21

### Fixed

- **Cancelling a pairing window left the process running, so the door stayed
  open.** The npm package's `bin` is a Node shim that spawns the real platform
  binary; spawning the shim meant SIGTERM landed on it and the real process,
  its child, kept going. For the pairing desk that is not a slow shutdown — it
  is the one thing that must not survive the user pressing Cancel, because the
  running process *is* what makes the node accept inbound requests.

  The plugin now resolves the real binary through `binary-install`'s own
  accessor and only falls back to the shim before the platform binary has been
  fetched. It also warms that fetch at load, so the fallback is a first-run
  detail rather than a standing condition.

  Only reachable through a real install: a developer pointing `SWARMDROP_BIN` at
  a build has no shim in the path, which is why it survived until the first
  clean end-to-end run.

## [0.2.0] - 2026-08-21

### Added

- **A SwarmDrop panel at the sidebar foot.** A dot beside Settings says whether a
  node is running; opening it gives node status and network posture, start/stop,
  the paired devices, and pairing — none of which previously existed anywhere in
  the dsh UI. Before this, the only way to see whether SwarmDrop was even running
  was to leave dsh for a terminal.

- **Pairing without a terminal.** "Add a device" issues an invite and staffs the
  desk; the link it shows opens SwarmDrop's own page, which draws the QR code.
  When a device shows up you see its name, system, link type and full node id
  before deciding.

  The security model is unchanged, only relocated: an invite is a one-shot
  capability that travels as a link, so a person still has to look at the far
  side's identity, and SwarmDrop's node still refuses every inbound request
  unless someone is at the desk. Closing the pairing view closes the desk.

  **Needs `swarmdrop` 0.5.0**, which added `invite create --decide-from-stdin`.
  On 0.4.0 everything else works and pairing says the CLI is too old.

### Fixed

- **A session containing this plugin's events could not be opened.** dsh refuses
  to read a log carrying event types it does not know, and neither escape it
  offers is available to a third-party plugin: the known set is generated from
  the types declared inside the dsh repository, and `Session.append()` has no way
  to mark an event `ignorable`. Sending one file was enough to make that
  conversation unreadable — not just its SwarmDrop rows, the whole thing.

  The plugin now announces its four event types to the running harness at load.
  See the README's "A limitation you should know about" for what this does *not*
  fix: uninstalling still leaves those conversations unopenable, and the
  announcement does not survive a dsh run from a source checkout under `tsx`.

- **The `swarmdrop watch` subscription could wedge and stay wedged.** Its stderr
  was piped and never read, so once the pipe's buffer filled — 64 KiB of the
  CLI's own tracing output — the child blocked writing to it and stopped
  delivering. Nothing reported anything; inbox arrivals simply stopped showing
  up. Both long-lived subprocesses now drain stderr and keep only a tail for the
  exit message.

- **A large transfer was killed at two minutes and reported as a plain
  failure.** `swarmdrop send` blocks until the transfer finishes, and it was
  running under the timeout meant for queries — so a file that legitimately took
  longer was SIGTERMed, and the user was told "failed" with no cause, which
  invites a retry that takes just as long. Transfers now get their own bound, and
  a timeout says it timed out.

### Changed

- `bridge.ts` no longer owns the `swarmdrop watch` subscription or folds state.
  The subscription is spawned once in `index.ts` and every frame goes to two
  readers: `machine.ts` folds what this machine looks like, `bridge.ts` decides
  which happenings deserve a row in which conversation. The panel needed the
  first half and had no business reaching through the second.

- The README's claim that dsh gives third-party plugins no Client→Node RPC was
  wrong and is corrected. `ctx.connection.rpc.handle` mounts a channel of the
  plugin's own; what remains true is that the *transcript* must rebuild from the
  session log, and nothing bypasses that.

## [0.1.1] - 2026-08-21

### Fixed

- Find the bundled `swarmdrop` binary instead of relying on `PATH`. The optional
  dependency lands in the profile's `node_modules/.bin`, which is not on dsh's
  `PATH`, so the previous release only worked for people who also had a global
  install.

## [0.1.0] - 2026-08-21

First release: tools, the `/swarmdrop` command, conversation rows for transfers
and received items, and the `@` inbox source.

[Unreleased]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/swarm-apps/dsh-swarmdrop/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/swarm-apps/dsh-swarmdrop/releases/tag/v0.1.0
