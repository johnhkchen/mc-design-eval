// The design-backlog factory runner, impure half (T-131-01, story S-131, epic E-32).
// `node scripts/design-backlog.mjs --pack packs/<style>.json [--offline] [--rotate-pins]`
// (npm: `npm run backlog:generate -- --pack …` — note the `--`, flags are swallowed without it).
//
// LIVE: formed style + registry digest → DecomposeBrushBacklog rendered through the bridge,
// asked on the subscription shim (STRONG tier, never a metered key), bounded same-prompt
// re-asks (src/baml/reply-policy.mjs; empty backlog = MALFORMED, FX-D1), the registry dedup
// gate, then drafts + records written under docs/active/backlog/ — OUTSIDE lisa's scan dirs
// (E-32 Rule 3; asserted from .lisa.toml by src/factory/backlog.test.mjs). This runner never
// writes into docs/active/tickets/ — promotion is a human act (docs/active/backlog/README.md).
//
// Pins (T-119): the four record rels are preflighted BEFORE any spend. Draft rels are
// reply-dependent, so they are guarded per-file at write time instead — a committed reply
// makes every draft re-derivable without re-spend (`--offline`), so no spend is ever lost to
// a draft-pin refusal.
//
// OFFLINE: re-derive every draft from the committed records (pure rendering), write what is
// missing, BYTE-ASSERT what exists — the deterministic replay (E-31 Rule 5) and the recovery
// path after a per-draft refusal.

import { readFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_TIERS } from "../src/config.mjs";
import { requestText } from "../src/sdk-binding.mjs";
import { runAsyncReplyPolicy, MAX_REPLY_ATTEMPTS } from "../src/baml/reply-policy.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../src/form/pin-guard.mjs";
import { bamlRender, bamlParse } from "../src/baml/bridge.mjs";
import { loadStylePack } from "../src/pack/style-pack.mjs";
import { registryDigest } from "../src/pack/brush-catalog.mjs";
import { brushNames } from "../src/pack/idiom-registry.mjs";
import {
  BACKLOG_DIR,
  BACKLOG_SCHEMA,
  packSummary,
  assertNonEmptyBacklog,
  enforceRegistryDedup,
  backlogFiles,
} from "../src/factory/backlog.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FN = "DecomposeBrushBacklog";
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

const argv = process.argv.slice(2);
const packArg = argv.includes("--pack") ? argv[argv.indexOf("--pack") + 1] : null;
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
if (!packArg) {
  console.error("usage: node scripts/design-backlog.mjs --pack packs/<style>.json [--offline] [--rotate-pins]");
  process.exit(2);
}

const pack = loadStylePack(join(ROOT, packArg));
const styleName = pack.style;
const recordsDir = `${BACKLOG_DIR}/records/${styleName}`;
const recordRels = ["inputs.json", "prompt.txt", "ledger.json", "backlog.json"].map((f) => `${recordsDir}/${f}`);

const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });

/** Write the run's emitted files: drafts always guarded per-file; in offline mode an existing
 * file is byte-asserted instead of written. Returns {written, verified, drifted}. */
async function emitFiles(files, { assertExisting }) {
  const written = [], verified = [], drifted = [];
  for (const f of files) {
    const abs = join(ROOT, f.rel);
    if (assertExisting && existsSync(abs)) {
      const current = readFileSync(abs, "utf8");
      (current === f.content ? verified : drifted).push(f.rel);
      continue;
    }
    await write(f.rel, f.content);
    written.push(f.rel);
  }
  return { written, verified, drifted };
}

if (offline) {
  // ---------------------------------------------------------------- OFFLINE: replay from records
  const ledgerAbs = join(ROOT, recordsDir, "ledger.json");
  const backlogAbs = join(ROOT, recordsDir, "backlog.json");
  if (!existsSync(ledgerAbs) || !existsSync(backlogAbs)) {
    console.error(`[backlog] offline: no committed records under ${recordsDir} — run live first.`);
    process.exit(1);
  }
  const ledger = JSON.parse(await readFile(ledgerAbs, "utf8"));
  const backlog = JSON.parse(await readFile(backlogAbs, "utf8"));
  const provenance = { function: ledger.fn, model: ledger.model, prompt_sha256: ledger.promptSha256, generated: ledger.generatedAt };
  const files = backlogFiles({ styleName, backlog, provenance });
  const { written, verified, drifted } = await emitFiles(files, { assertExisting: true });
  console.error(`[backlog] offline ${styleName}: ${verified.length} byte-identical, ${written.length} (re)written, ${drifted.length} drifted.`);
  if (drifted.length) {
    for (const rel of drifted) console.error(`[backlog]   DRIFT: ${rel}`);
    process.exit(1);
  }
  process.exit(0);
}

// ---------------------------------------------------------------- LIVE
// Render first (no spend), then declare the records BEFORE any spend (T-119).
const args = { style_summary: packSummary(pack), registry_state: registryDigest() };
const { prompt } = await bamlRender({ fn: FN, args });
const promptSha256 = sha256(prompt);

const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: recordRels.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
  rotate,
  intent: `design-backlog factory run (${styleName})`,
});

const model = MODEL_TIERS.strong;
console.error(`[backlog] ${styleName}: asking ${FN} (budget ${MAX_REPLY_ATTEMPTS}, model ${model})…`);
const { accepted, expected, replies, rawTexts, askCount } = await runAsyncReplyPolicy({
  ask: () => requestText({ prompt, model }),
  // FX-D1: the all-array class never rejects — the empty union is MALFORMED, not a verdict.
  parse: async (text) => assertNonEmptyBacklog(await bamlParse({ fn: FN, text })),
});

const generatedAt = new Date().toISOString();
const deduped = accepted ? enforceRegistryDedup(expected, brushNames()) : null;

// The committed decompose fixture pins this prompt for rustic — recorded as a cross-check,
// never asserted (registry growth legitimately changes the digest).
const fixtureLedgerAbs = join(ROOT, "src/baml/fixtures/decompose/ledger.json");
const fixturePromptMatch = existsSync(fixtureLedgerAbs)
  ? JSON.parse(readFileSync(fixtureLedgerAbs, "utf8")).promptSha256 === promptSha256
  : null;

await mkdir(join(ROOT, recordsDir), { recursive: true });
await write(`${recordsDir}/inputs.json`, jsonOf(args));
await write(`${recordsDir}/prompt.txt`, prompt);
await write(`${recordsDir}/ledger.json`, jsonOf({
  schema: "design-backlog-ledger/v1",
  ticket: "T-131-01",
  fn: FN,
  styleName,
  pack: packArg,
  model,
  transport: "claude -p subscription shim (sdk-binding requestText) — no metered API key",
  promptSha256,
  fixturePromptMatch,
  generatedAt,
  budget: MAX_REPLY_ATTEMPTS,
  askCount,
  accepted,
  dedup: deduped ? { demotions: deduped.demotions, warnings: deduped.warnings } : null,
  counts: deduped ? { items: deduped.items.length, notes: deduped.parametrization_notes.length } : null,
  replies,
  rawTexts, // FULL raw texts, one per live ask (the AC's committed raw replies)
}));

if (!accepted) {
  console.error(`[backlog] ${styleName}: REFUSED — every reply malformed within the budget (ledger committed).`);
  process.exit(1);
}

await write(`${recordsDir}/backlog.json`, jsonOf({ schema: BACKLOG_SCHEMA, styleName, ...deduped }));

const provenance = { function: FN, model, prompt_sha256: promptSha256, generated: generatedAt };
const files = backlogFiles({ styleName, backlog: deduped, provenance });
const { written } = await emitFiles(files, { assertExisting: false });
console.error(
  `[backlog] ${styleName}: accepted on attempt ${askCount} — ${deduped.items.length} draft(s), ` +
  `${deduped.parametrization_notes.length} note(s), ${deduped.demotions.length} demotion(s), ` +
  `${deduped.warnings.length} warning(s); ${written.length} file(s) under ${BACKLOG_DIR}/.`
);
