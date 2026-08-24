import { describe, expect, it } from 'vitest'

import { deriveInfraLinkState, INFRA_GRACE_MS, summarizeNodeHealth } from './node-health.js'
import type { InfraLink, NetworkAnswer } from '../panel-wire.js'

/**
 * These pin the **tier order and the grace rule**, not the wording.
 *
 * This ladder is the third implementation of one rule (see the module note),
 * and the other two live in a repository this one cannot import from. Nothing
 * makes a drift fail a build, so what these tests are for is making it fail a
 * *test* — each case below is one of the reasons the upstream file gives for
 * why a tier sits where it does.
 */

const NOW = 1_700_000_000_000

function link(over: Partial<InfraLink> = {}): InfraLink {
  return {
    peerId: 'peer',
    scope: 'public',
    connected: true,
    everActive: false,
    firstSeenMs: NOW,
    relay: { kind: 'active', circuitAddr: '/ip4/1.2.3.4/p2p-circuit' },
    excluded: false,
    roles: { relayServer: true, kadServer: true },
    sources: ['hostConfigured'],
    ...over,
  }
}

function network(over: Partial<NetworkAnswer> = {}): NetworkAnswer {
  return {
    status: 'running',
    peerId: 'self',
    natStatus: 'unknown',
    listenAddrs: [],
    publicAddr: null,
    relayReady: true,
    bootstrapConnected: true,
    connectedPeers: 0,
    publicReachable: true,
    infraLinks: [link()],
    ...over,
  }
}

describe('summarizeNodeHealth', () => {
  it('reports a stopped node as stopped, whatever the links say', () => {
    // The upstream reason for this tier being first: mobile once reported a
    // stopped node as "no public bootstrap connected", and users went auditing
    // bootstrap nodes when the thing to press was "start".
    const summary = summarizeNodeHealth(
      network({ status: 'stopped', publicReachable: false, infraLinks: [] }),
      NOW,
    )
    expect(summary.level).toBe('notRunning')
    expect(summary.cta).toBe('startNode')
  })

  it('treats a null answer as not running rather than as isolation', () => {
    expect(summarizeNodeHealth(null, NOW).level).toBe('notRunning')
  })

  it('takes publicReachable as the sole test for the success tier', () => {
    const summary = summarizeNodeHealth(network({ publicReachable: true }), NOW)
    expect(summary.level).toBe('reachable')
    expect(summary.tone).toBe('success')
    expect(summary.cta).toBeNull()
  })

  /**
   * The tier that is easiest to get wrong. A gate the user closed themselves
   * has to outrank both "connecting" (those links never settle, so waiting is
   * pointless) and `lanReachable` (same reachability, but it cannot say why or
   * where to change it).
   */
  it('ranks a user-closed gate above connecting and above LAN reach', () => {
    const summary = summarizeNodeHealth(network({
      publicReachable: false,
      connectedPeers: 3,
      infraLinks: [link({ excluded: true, relay: null })],
    }), NOW)
    expect(summary.level).toBe('configuredLanOnly')
    expect(summary.cta).toBe('openSettings')
  })

  it('waits quietly while a link is still settling', () => {
    const summary = summarizeNodeHealth(network({
      publicReachable: false,
      infraLinks: [link({ relay: null })],
    }), NOW)
    expect(summary.level).toBe('starting')
  })

  /**
   * An empty table is "nothing to diagnose", not "everything is broken":
   * pointing at a blank list and saying "check your bootstrap nodes" is worse
   * than saying nothing.
   */
  it('treats an empty link table as starting, never as isolated', () => {
    const summary = summarizeNodeHealth(
      network({ publicReachable: false, infraLinks: [] }),
      NOW,
    )
    expect(summary.level).toBe('starting')
  })

  it('warns only when nothing is reachable and nothing is still trying', () => {
    const dead = link({ everActive: true, relay: { kind: 'failed', lastError: 'refused' } })
    expect(summarizeNodeHealth(
      network({ publicReachable: false, connectedPeers: 1, infraLinks: [dead] }),
      NOW,
    ).level).toBe('lanReachable')

    const summary = summarizeNodeHealth(
      network({ publicReachable: false, connectedPeers: 0, infraLinks: [dead] }),
      NOW,
    )
    expect(summary.level).toBe('isolated')
    expect(summary.tone).toBe('warning')
  })

  /**
   * "One of two bootstrap nodes is down" is a diagnostic-layer fact, never a
   * degradation: one relay reaches exactly as far as two. Warning on it teaches
   * users to ignore the status colour.
   */
  it('does not degrade when one of two relays is down but the node is reachable', () => {
    const summary = summarizeNodeHealth(network({
      publicReachable: true,
      infraLinks: [link(), link({ peerId: 'other', everActive: true, relay: { kind: 'failed', lastError: 'x' } })],
    }), NOW)
    expect(summary.level).toBe('reachable')
    expect(summary.tone).toBe('success')
  })
})

describe('deriveInfraLinkState', () => {
  it('reports a user exclusion as configuration, never as a fault', () => {
    const state = deriveInfraLinkState(
      link({ excluded: true, relay: { kind: 'failed', lastError: 'refused' } }),
      NOW,
    )
    expect(state.state).toBe('excluded')
    expect(state.tone).toBe('neutral')
    // Even with a failure on the track, an excluded link shows no error: the
    // user turned it off, so there is nothing to debug.
    expect(state.detail).toBeNull()
  })

  it('treats a seed with no relay role as normal, not as unknown', () => {
    const state = deriveInfraLinkState(
      link({ roles: { relayServer: false, kadServer: true }, relay: null }),
      NOW,
    )
    expect(state.state).toBe('seedOnly')
    expect(state.tone).toBe('neutral')
  })

  it('skips the grace window once a link has ever worked', () => {
    const state = deriveInfraLinkState(
      link({ everActive: true, relay: { kind: 'failed', lastError: 'reset' } }),
      NOW,
    )
    expect(state.state).toBe('lost')
    expect(state.detail).toBe('reset')
  })

  /** All three conditions, or it is still settling. */
  it('requires a seen failure AND the elapsed window to call a link unreachable', () => {
    const failing = link({ everActive: false, relay: { kind: 'failed', lastError: 'timeout' } })

    // Failure seen, but inside the window.
    expect(deriveInfraLinkState({ ...failing, firstSeenMs: NOW }, NOW).state).toBe('settling')

    // Past the window, but no failure observed yet.
    expect(deriveInfraLinkState(
      { ...failing, relay: null, firstSeenMs: NOW - INFRA_GRACE_MS - 1 },
      NOW,
    ).state).toBe('settling')

    // Both.
    expect(deriveInfraLinkState(
      { ...failing, firstSeenMs: NOW - INFRA_GRACE_MS - 1 },
      NOW,
    ).state).toBe('unreachable')
  })

  it('carries the kernel string through untouched', () => {
    const state = deriveInfraLinkState(
      link({ everActive: true, relay: { kind: 'failed', lastError: 'Connection refused (os error 61)' } }),
      NOW,
    )
    expect(state.detail).toBe('Connection refused (os error 61)')
  })
})
