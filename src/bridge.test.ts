import { describe, expect, it, vi } from 'vitest'

import { SwarmDropBridge } from './bridge.js'
import type { WatchFrame } from './cli.js'

/**
 * What the bridge routes where.
 *
 * The rule these pin is the one a reader of a transcript depends on: **a send
 * belongs to the conversation that started it; an arrival belongs to every
 * conversation.** Before the arrival half existed, a device pushing two
 * gigabytes at this machine produced no row at all until it had finished — the
 * transcript was silent for the entire transfer, which is indistinguishable
 * from nothing happening.
 */

interface Appended {
  readonly agent: string
  readonly type: string
  readonly data: Record<string, unknown>
}

/** A stand-in for one root agent, recording what lands in its session. */
function agentStub(name: string, log: Appended[]) {
  return {
    name,
    session: {
      append: (type: string, data: Record<string, unknown>) => {
        log.push({ agent: name, type, data })
      },
    },
  }
}

function bridgeWith(roots: string[]) {
  const log: Appended[] = []
  const agents = roots.map(name => agentStub(name, log))
  const ctx = {
    agents: { roots: () => agents },
    logger: () => ({ debug: vi.fn() }),
  }
  // The machine half is not consulted on these paths; the bridge only reads it
  // for inbox frames, which have their own coverage.
  const machine = {} as never
  return { bridge: new SwarmDropBridge(ctx as never, machine), log, agents }
}

function transferFrame(over: Partial<Record<string, unknown>> = {}): WatchFrame {
  return {
    // Every line on the stream carries these; the bridge ignores them, but
    // leaving them out would make this fixture a shape the stream never emits.
    v: 1,
    seq: 1,
    kind: 'transferChanged',
    sessionId: 'session-1',
    direction: 'receive',
    peerName: '光印-华为410',
    contentKind: 'files',
    phase: 'active',
    fileCount: 3,
    transferredBytes: 100,
    totalBytes: 900,
    ...over,
  } as WatchFrame
}

describe('SwarmDropBridge — inbound transfers', () => {
  it('opens a row on every root conversation, then updates it', () => {
    const { bridge, log } = bridgeWith(['a', 'b'])

    bridge.accept(transferFrame())

    // Both roots get the opening event and the first update.
    expect(log.filter(e => e.type === 'swarmdrop/receiving').map(e => e.agent)).toEqual(['a', 'b'])
    expect(log.filter(e => e.type === 'swarmdrop/transfer').map(e => e.agent)).toEqual(['a', 'b'])

    const opening = log.find(e => e.type === 'swarmdrop/receiving')
    expect(opening?.data).toMatchObject({
      transferId: 'session-1',
      peerName: '光印-华为410',
      fileCount: 3,
      totalBytes: 900,
    })
  })

  /**
   * The opening row is written once. Emitting it on every progress frame would
   * grow one row per second of transfer.
   */
  it('opens the row once, however many frames arrive', () => {
    const { bridge, log } = bridgeWith(['a'])

    bridge.accept(transferFrame({ transferredBytes: 100 }))
    bridge.accept(transferFrame({ transferredBytes: 400 }))
    bridge.accept(transferFrame({ transferredBytes: 800 }))

    expect(log.filter(e => e.type === 'swarmdrop/receiving')).toHaveLength(1)
    expect(log.filter(e => e.type === 'swarmdrop/transfer')).toHaveLength(3)
  })

  /**
   * A send opened from another terminal is none of this conversation's
   * business — appending it puts a row in the transcript the reader cannot
   * account for. Only arrivals are broadcast.
   */
  it('ignores an unattributed send', () => {
    const { bridge, log } = bridgeWith(['a'])

    bridge.accept(transferFrame({ direction: 'send' }))

    expect(log).toHaveLength(0)
  })

  it('stops tracking once the transfer reaches its terminal phase', () => {
    const { bridge, log } = bridgeWith(['a'])

    bridge.accept(transferFrame())
    bridge.accept(transferFrame({ phase: 'terminal', terminalReason: 'completed' }))
    // A late frame for the same id opens a fresh row rather than silently
    // updating a node that has already ended.
    bridge.accept(transferFrame())

    expect(log.filter(e => e.type === 'swarmdrop/receiving')).toHaveLength(2)
  })

  it('carries the terminal reason through and omits it while running', () => {
    const { bridge, log } = bridgeWith(['a'])

    bridge.accept(transferFrame())
    expect(log.at(-1)?.data).not.toHaveProperty('terminalReason')

    bridge.accept(transferFrame({ phase: 'terminal', terminalReason: 'completed' }))
    expect(log.at(-1)?.data).toMatchObject({ phase: 'terminal', terminalReason: 'completed' })
  })
})

describe('SwarmDropBridge — attributed sends', () => {
  it('sends progress only to the conversation that claimed it', () => {
    const { bridge, log, agents } = bridgeWith(['a', 'b'])

    bridge.claim('session-1', agents[0] as never)
    bridge.accept(transferFrame({ direction: 'send' }))

    const updates = log.filter(e => e.type === 'swarmdrop/transfer')
    expect(updates.map(e => e.agent)).toEqual(['a'])
    // A claimed transfer is already open — `swarmdrop/sent` was written when
    // the tool ran — so no second opening event is emitted.
    expect(log.filter(e => e.type === 'swarmdrop/receiving')).toHaveLength(0)
  })
})
