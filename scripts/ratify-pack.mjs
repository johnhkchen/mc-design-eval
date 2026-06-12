// Ratify a formed style draft into a pack of record (T-130-01, story S-130, epic E-32) — the
// human taste gate's second half (E-32 Rule 4: taste enters ONCE per style, here). Reads
// packs/drafts/<style>/draft.json (structurally NOT a pack — parseStylePack rejects its tag),
// swaps the tag to style-pack/v1, stamps the ratification receipt {by, date, note?}, runs the
// FULL pack gates fail-loud (assertStylePack + validateStylePack), and pin-guard-writes
// packs/<style>.json. Echoes the draft README so the ratifier sees what they are signing.
//
//   node scripts/ratify-pack.mjs --style <slug> --by "<who>" [--note "<text>"] [--rotate-pins]
//   (npm: `npm run style:ratify -- …` — the `--` matters.)
//
// Ratifying over an existing committed pack REFUSES without --rotate-pins (T-119: a committed
// record changes only inside a ticket that owns it).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { guardedWriteRecord, loadTrackedSet, isTracked, preflightPins, ROTATE_FLAG } from "../src/form/pin-guard.mjs";
import { assertStylePack, validateStylePack, STYLE_PACK_SCHEMA } from "../src/pack/style-pack.mjs";
import { DRAFT_SCHEMA_TAG } from "../src/pack/formation.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

const argv = process.argv.slice(2);
const flagVal = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const style = flagVal("--style");
const by = flagVal("--by");
const note = flagVal("--note");
const rotate = argv.includes(ROTATE_FLAG);

if (!style || !by) {
  console.error('usage: node scripts/ratify-pack.mjs --style <slug> --by "<who>" [--note "<text>"] [--rotate-pins]');
  process.exit(2);
}

const draftRel = `packs/drafts/${style}/draft.json`;
const readmeRel = `packs/drafts/${style}/README.md`;
const packRel = `packs/${style}.json`;
if (!existsSync(join(ROOT, draftRel))) {
  console.error(`[ratify] no draft at ${draftRel} — form the style first (npm run style:form).`);
  process.exit(1);
}

const draft = JSON.parse(readFileSync(join(ROOT, draftRel), "utf8"));
if (draft.schema !== DRAFT_SCHEMA_TAG) {
  console.error(`[ratify] ${draftRel} is not a ${DRAFT_SCHEMA_TAG} draft (schema: "${draft.schema}").`);
  process.exit(1);
}

// The ratifier sees what they sign: the draft's ratification sheet, verbatim.
if (existsSync(join(ROOT, readmeRel))) {
  console.error(`\n${readFileSync(join(ROOT, readmeRel), "utf8")}\n`);
}

// Refuse a silent pack overwrite BEFORE doing any work (T-119).
const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: [{ rel: packRel, tracked: isTracked(trackedSet, packRel) }],
  rotate,
  intent: `ratify style "${style}"`,
});

const pack = {
  ...draft,
  schema: STYLE_PACK_SCHEMA,
  ratification: { by, date: new Date().toISOString(), ...(note ? { note } : {}) },
};

// FAIL-LOUD: a draft that cannot pass the full pack gates must not become a pack of record.
const valid = assertStylePack(pack);
const { ok, findings } = validateStylePack(valid);
if (!ok) {
  const lines = findings.filter((f) => f.level === "error").map((f) => `  at ${f.where}: ${f.msg}`);
  console.error(`[ratify] draft "${style}" failed semantic validation:\n${lines.join("\n")}`);
  process.exit(1);
}
for (const f of findings.filter((x) => x.level === "warn")) {
  console.error(`[ratify] warn at ${f.where}: ${f.msg}`);
}

await guardedWriteRecord({ root: ROOT, rel: packRel, content: jsonOf(pack), rotate });
console.error(`[ratify] ${style}: ratified by "${by}" — pack of record written to ${packRel}.`);
console.error(`[ratify] the draft stays under packs/drafts/${style}/ as the formation record (raw replies, ledger).`);
