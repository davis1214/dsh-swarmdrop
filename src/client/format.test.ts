import { describe, expect, it } from 'vitest'

import { isSameLocalDay, versionSkew } from './format.js'

/**
 * The About page's version comparison.
 *
 * Two of these arms are conditions the page cannot easily be put into by hand
 * — you would need a daemon of a specific vintage — and getting one backwards
 * produces a confident sentence about the wrong thing.
 */
describe('versionSkew', () => {
  it('says nothing when the versions match', () => {
    expect(versionSkew('0.7.1', { state: 'known', version: '0.7.1' }))
      .toEqual({ kind: 'aligned' })
  })

  it('names the daemon version when they differ', () => {
    expect(versionSkew('0.7.1', { state: 'known', version: '0.6.0' }))
      .toEqual({ kind: 'differs', daemon: '0.6.0' })
  })

  it('treats a node that reports no version as older', () => {
    expect(versionSkew('0.8.0', { state: 'silent' })).toEqual({ kind: 'silent' })
  })

  /**
   * **Two old ones agree.** A binary that predates the version field asking a
   * daemon that predates it too is not skew — but "no version reported" looks
   * identical to the real thing, so without the floor every such pair gets
   * warned about a machine that is fine.
   */
  it('says nothing when the binary is too old to expect a version', () => {
    expect(versionSkew('0.7.1', { state: 'silent' })).toEqual({ kind: 'aligned' })
  })

  it('does not warn on an unparsable version', () => {
    expect(versionSkew('main-4f2a1c', { state: 'silent' })).toEqual({ kind: 'aligned' })
  })

  it('reads a version past the floor as new enough', () => {
    expect(versionSkew('0.10.0', { state: 'silent' })).toEqual({ kind: 'silent' })
    expect(versionSkew('1.0.0', { state: 'silent' })).toEqual({ kind: 'silent' })
  })

  /**
   * **No node is not a version problem.** Report one here and every user who
   * has not started SwarmDrop is told their node is out of date.
   */
  it('says nothing when no node is running', () => {
    expect(versionSkew('0.7.1', { state: 'none' })).toEqual({ kind: 'aligned' })
  })

  /**
   * The binary could not be run at all — already its own row on the page.
   * A comparison with one side missing is the same finding, said worse.
   */
  it('says nothing when the binary itself could not be read', () => {
    expect(versionSkew(null, { state: 'known', version: '0.6.0' }))
      .toEqual({ kind: 'aligned' })
  })
})

describe('isSameLocalDay', () => {
  it('separates two instants that share a day from ones that do not', () => {
    const morning = new Date(2026, 7, 24, 9, 30).getTime()
    const evening = new Date(2026, 7, 24, 23, 59).getTime()
    const nextDay = new Date(2026, 7, 25, 0, 1).getTime()

    expect(isSameLocalDay(morning, evening)).toBe(true)
    expect(isSameLocalDay(evening, nextDay)).toBe(false)
  })

  /**
   * The reason this compares local components instead of dividing by a day's
   * worth of milliseconds: across a DST boundary a local day is not 24 hours,
   * so the arithmetic version reports two instants on the same calendar day as
   * different days (or the reverse) depending on which side of the shift they
   * fall.
   */
  it('holds across a day whose length is not 24 hours', () => {
    const before = new Date(2026, 2, 8, 1, 0).getTime()
    const after = new Date(2026, 2, 8, 23, 0).getTime()
    expect(isSameLocalDay(before, after)).toBe(true)
  })

  it('separates the same clock time one year apart', () => {
    const now = new Date(2026, 7, 24, 12, 0).getTime()
    const lastYear = new Date(2025, 7, 24, 12, 0).getTime()
    expect(isSameLocalDay(now, lastYear)).toBe(false)
  })
})
