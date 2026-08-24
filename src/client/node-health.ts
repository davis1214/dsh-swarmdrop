/**
 * The conclusion layer's one sentence, and one infra link's status word.
 *
 * ## Why this is a copy
 *
 * These two judgments are `summarizeNodeHealth` and `deriveInfraLinkState` from
 * SwarmDrop's `@swarmdrop/shared-view`, which the three graphical builds share.
 * That package is `private: true` and has never been published, and this plugin
 * lives in a different repository, so sharing the artifact is not available —
 * only sharing the *rule*, which `DESIGN.md` fixes as the Node Status Contract.
 *
 * It is therefore the **third** implementation of this ladder: the TS package,
 * `src-tauri/src/node_health.rs` (the tray, which cannot reach the package
 * either), and this. The upstream file says the Rust twin "must be changed
 * together with this one"; the same now applies here. The tests below exist to
 * make a drift loud rather than silent — they encode the tier order and the
 * three-part grace rule, not the wording.
 *
 * ## What must not be re-derived
 *
 * `publicReachable` is the kernel's answer and is consumed, never recomputed.
 * The rule involves `CandidateScope`, and the upstream package deliberately
 * refuses to accept `publicAddr` as an input so that nobody is tempted to
 * reimplement it from an address. Two answers to "can they reach me" is worse
 * than none.
 */

import type { InfraLink, NetworkAnswer } from '../panel-wire.js'

/** Colour band. The token each maps to is the surface's business. */
export type StatusTone = 'neutral' | 'success' | 'warning'

export type NodeHealthLevel =
  | 'notRunning'
  | 'starting'
  | 'reachable'
  | 'lanReachable'
  | 'configuredLanOnly'
  | 'isolated'

/** At most one. `null` is a valid answer — do not invent one for symmetry. */
export type NodeHealthCta = 'startNode' | 'openSettings' | 'openDiagnostics' | null

export interface NodeHealthSummary {
  readonly level: NodeHealthLevel
  readonly tone: StatusTone
  readonly cta: NodeHealthCta
}

const SUMMARY: Record<NodeHealthLevel, Omit<NodeHealthSummary, 'level'>> = {
  notRunning: { tone: 'neutral', cta: 'startNode' },
  starting: { tone: 'neutral', cta: null },
  reachable: { tone: 'success', cta: null },
  // Neutral, not a warning: for most home users LAN reach is entirely enough,
  // and warning about it manufactures anxiety.
  lanReachable: { tone: 'neutral', cta: null },
  configuredLanOnly: { tone: 'neutral', cta: 'openSettings' },
  isolated: { tone: 'warning', cta: 'openDiagnostics' },
}

/**
 * Fold network posture into the sentence the header shows.
 *
 * **The tier order is the priority order**, and each step has a reason:
 *
 * 1. **Not running beats everything.** Reporting a stopped node as "no public
 *    bootstrap" sends the user to audit bootstrap nodes when the thing to press
 *    is "start".
 * 2. **`publicReachable` is the only test for the success tier** — the kernel
 *    has already made it.
 * 3. **A gate the user closed themselves ranks above "connecting"**: those
 *    links will never settle, so waiting is pointless, and only this tier's CTA
 *    (open settings) is an action that changes anything. It also outranks
 *    `lanReachable`, which describes the same reachability but cannot say why.
 * 4. **Something still converging** (or no link in the table yet) → wait
 *    quietly.
 * 5. A connected peer → LAN-reachable.
 * 6. Only what is left is isolation.
 *
 * The three-part alarm rule — not the user's own doing ∧ past the grace window
 * ∧ actually blocking them — is what tier 6 encodes; nothing above it warns.
 * In particular "one of two bootstrap nodes is down" is *not* a degradation:
 * one relay reaches exactly as far as two.
 */
export function summarizeNodeHealth(
  network: NetworkAnswer | null,
  nowMs: number,
): NodeHealthSummary {
  const level = resolveLevel(network, nowMs)
  return { level, ...SUMMARY[level] }
}

function resolveLevel(network: NetworkAnswer | null, nowMs: number): NodeHealthLevel {
  if (network === null || network.status !== 'running') return 'notRunning'
  if (network.publicReachable) return 'reachable'

  const links = network.infraLinks
  const publicLinks = links.filter(link => link.scope === 'public')
  if (publicLinks.length > 0 && publicLinks.every(link => link.excluded)) {
    return 'configuredLanOnly'
  }

  // An empty table lands here too: with no links there is nothing to diagnose,
  // and "check your bootstrap nodes" would be pointing at a blank list. When
  // there genuinely is no configuration, that empty table is itself the answer.
  const settling = links.some(link => deriveInfraLinkState(link, nowMs).state === 'settling')
  if (settling || links.length === 0) return 'starting'

  if (network.connectedPeers > 0) return 'lanReachable'
  return 'isolated'
}

export type InfraLinkState =
  | 'seedOnly'
  | 'excluded'
  | 'settling'
  | 'ok'
  | 'lost'
  | 'unreachable'

export interface InfraLinkPresentation {
  readonly state: InfraLinkState
  readonly tone: StatusTone
  /** The kernel's own string, shown verbatim. `null` when there is none. */
  readonly detail: string | null
}

/**
 * The grace window for a first connection.
 *
 * It only applies when all three conditions below hold, so this number is not
 * "how long before we report an error" — the real anchor is "we have already
 * observed at least one failure".
 */
export const INFRA_GRACE_MS = 10_000

const PRESENTATION: Record<InfraLinkState, StatusTone> = {
  seedOnly: 'neutral',
  excluded: 'neutral',
  settling: 'neutral',
  ok: 'success',
  lost: 'warning',
  unreachable: 'warning',
}

/**
 * Judge one infrastructure link.
 *
 * Tier order is priority order:
 *
 * 1. `excluded` first — it describes a **setting**, not a fault. Any failure
 *    tier above it would render "you turned this off" as "this is broken", and
 *    send the user to retry instead of to the switch.
 * 2. `seedOnly` next — a pure DHT seed has no relay track in the kernel, so
 *    `relay == null` is normal for it rather than "state unknown".
 * 3. Only with a relay track does success or failure mean anything.
 *
 * **All three grace conditions are required**: never active ∧ a failure has
 * been seen ∧ past the window. Time alone declares failure while the first dial
 * is still in flight (a native dial times out at 30s, far longer than any sane
 * grace); "a failure was seen" alone flashes red when the first attempt trips
 * and the second succeeds two seconds later.
 */
export function deriveInfraLinkState(link: InfraLink, nowMs: number): InfraLinkPresentation {
  const detail = link.relay?.kind === 'failed' ? link.relay.lastError : null
  const present = (state: InfraLinkState): InfraLinkPresentation => ({
    state,
    tone: PRESENTATION[state],
    detail: state === 'seedOnly' || state === 'excluded' ? null : detail,
  })

  if (link.excluded) return present('excluded')
  if (!link.roles.relayServer) return present('seedOnly')
  if (link.relay?.kind === 'active') return present('ok')

  // Once it has worked, no grace: the user has seen it good, so say so at once.
  if (link.everActive) return present('lost')

  const sawFailure = link.relay?.kind === 'failed'
  const pastGrace = nowMs - link.firstSeenMs >= INFRA_GRACE_MS
  if (sawFailure && pastGrace) return present('unreachable')

  // `relay == null` here reads as "has the role, kernel has not built a track
  // yet" — the convergence loop starts its first round within a second.
  return present('settling')
}
