#!/usr/bin/env node
// LISA CLAIM CLI (T-157-01, S-157) — the checkable surface for the per-ticket claim. A lisa thread
// (or a human, or an on-idle hook) runs this before producing a phase artifact; a fresh foreign
// claim means defer. Date.now() lives HERE (the CLI), so the pure core (src/form/lisa-claim.mjs)
// stays deterministic under the test glob.
//
//   node scripts/lisa-claim.mjs --ticket T-x --check                 # exit 0 free|mine, 3 held-by-other
//   node scripts/lisa-claim.mjs --ticket T-x --claim [--phase p]     # take/refresh my claim
//   node scripts/lisa-claim.mjs --ticket T-x --release               # drop my claim
//   (session defaults to $LISA_PANE_ID; override with --session)

import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { existsSync, rmSync } from "node:fs";

import { checkClaim, writeClaim, readClaim, claimRel, decideClaim, DEFAULT_TTL_MS } from "../src/form/lisa-claim.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const argv = process.argv.slice(2);
const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const has = (f) => argv.includes(f);

const ticket = argOf("--ticket");
const session = argOf("--session") ?? process.env.LISA_PANE_ID ?? "unknown-session";
const phase = argOf("--phase");
const now = Date.now();

if (!ticket) {
  console.error("lisa-claim: --ticket <id> is required (--check | --claim [--phase p] | --release)");
  process.exit(2);
}

if (has("--release")) {
  const existing = readClaim(ROOT, ticket);
  if (existing && existing.session !== session) {
    console.error(`lisa-claim: refusing to release ${ticket} — held by ${existing.session}, not ${session}`);
    process.exit(3);
  }
  const abs = join(ROOT, claimRel(ticket));
  if (existsSync(abs)) rmSync(abs);
  console.error(`lisa-claim: released ${ticket}`);
  process.exit(0);
}

if (has("--claim")) {
  const { status } = checkClaim(ROOT, { ticket, mySession: session, now });
  if (status === "held-by-other") {
    const holder = readClaim(ROOT, ticket);
    console.error(`lisa-claim: NOT claiming ${ticket} — fresh claim held by ${holder?.session} (phase ${holder?.phase}). Defer.`);
    process.exit(3);
  }
  const rec = writeClaim(ROOT, { ticket, phase, session, now });
  console.error(`lisa-claim: claimed ${ticket} as ${session}${phase ? ` (phase ${phase})` : ""} [was ${status}]`);
  console.log(JSON.stringify(rec));
  process.exit(0);
}

// default: --check
const existing = readClaim(ROOT, ticket);
const status = decideClaim({ existing, now, mySession: session, ttlMs: DEFAULT_TTL_MS });
if (status === "held-by-other") {
  console.error(`lisa-claim: ${ticket} HELD by ${existing?.session} (phase ${existing?.phase}) — defer, don't race.`);
  process.exit(3);
}
console.error(`lisa-claim: ${ticket} is ${status} for ${session} — clear to produce.`);
process.exit(0);
