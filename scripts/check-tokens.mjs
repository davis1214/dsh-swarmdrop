/**
 * Fail on a `--dsw-*` custom property this package references but dsh does not
 * define.
 *
 * ## Why this exists
 *
 * The browser half is styled with inline `style` objects (see `panel.tsx` for
 * why), so every design token is a string inside a `var()`. TypeScript has
 * nothing to check it against and CSS has no error for it: a name that does not
 * resolve falls back to the inherited value, or to nothing. Both look like a
 * design decision.
 *
 * Six of these had accumulated before anyone noticed, and none of them
 * announced itself:
 *
 * - `state-warning-primary` (the token is `state-warn-*`) left two warnings
 *   rendering in the body colour.
 * - `fill-tertiary` and `fill-brand` do not exist in any form, so the transfer
 *   progress bar drew a transparent groove with a transparent fill — an
 *   invisible bar looks exactly like a transfer that is not moving.
 * - `bg-primary` left every text input with no background of its own.
 * - `border-secondary` left a button with no outline.
 * - `brand-primary` is the exception that this script *cannot* catch: it
 *   exists, and resolves to neutral ink rather than to a brand hue. See
 *   DESIGN.md.
 *
 * The authority is the installed `@deepseek-ai/dsh-client-ui-theme`, not a list
 * copied into this repo — a hand-kept list is one more thing that silently goes
 * stale when dsh renames a token.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const THEME = 'node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js'

/** Every token dsh assigns a value to. */
function defined() {
  let source
  try {
    source = readFileSync(THEME, 'utf8')
  } catch {
    console.error(`check-tokens: cannot read ${THEME} — run \`pnpm install\` first.`)
    process.exit(2)
  }
  const found = new Set(
    [...source.matchAll(/(--dsw-[a-z0-9-]+)\s*:/g)].map(match => match[1]),
  )
  if (found.size === 0) {
    // The theme package ships CSS inside JS; if that ever stops being true this
    // script would pass everything rather than fail loudly, which is worse than
    // not having it.
    console.error('check-tokens: found no token definitions in the theme package.')
    process.exit(2)
  }
  return found
}

/** Every token this package actually reads, with where it reads it. */
function referenced(dir, into = new Map()) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      referenced(path, into)
      continue
    }
    if (!/\.tsx?$/.test(entry)) continue
    const source = readFileSync(path, 'utf8')
    for (const line of source.split('\n').entries()) {
      const [index, text] = line
      // Only real reads. A token named in a comment is usually there to say
      // why it is *not* being used.
      for (const match of text.matchAll(/var\((--dsw-[a-z0-9-]+)/g)) {
        const list = into.get(match[1]) ?? []
        list.push(`${path}:${String(index + 1)}`)
        into.set(match[1], list)
      }
    }
  }
  return into
}

const known = defined()
const used = referenced('src')
const unknown = [...used].filter(([token]) => !known.has(token))

if (unknown.length > 0) {
  console.error(`check-tokens: ${String(unknown.length)} token(s) dsh does not define:\n`)
  for (const [token, sites] of unknown) {
    console.error(`  ${token}`)
    for (const site of sites) console.error(`    ${site}`)
  }
  console.error('\nThese resolve to nothing at runtime. Pick a token the theme defines.')
  process.exit(1)
}

console.log(`check-tokens: ${String(used.size)} token(s), all defined by dsh.`)
