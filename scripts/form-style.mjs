// The style-formation chain runner, impure half (T-130-01, story S-130, epic E-32):
// theme brief → material story → palette → proportions → brush needs → an E-31 style pack
// DRAFT awaiting human ratification (scripts/ratify-pack.mjs is the gate's second half).
//
//   node scripts/form-style.mjs --brief "<text>" | --brief-file <p> | --story-replay vernacular
//                               --slug <style-slug> [--compare packs/<style>.json]
//                               [--offline] [--rotate-pins]
//   (npm: `npm run style:form -- …` — note the `--`, flags are swallowed without it.)
//
// LIVE: each stage renders through the bridge (BAML authority), asks on the subscription shim
// (STRONG tier, never a metered key), bounded same-prompt re-asks via src/baml/ask.mjs with the
// stage's post-parse gate as `classify` (a gate failure is MALFORMED, T-114 semantics). Every
// stage's full record lands under packs/drafts/<slug>/stages/<stage>/ in the mint shape
// (inputs/prompt/reply/expected/ledger) so the chain is reproducible-by-replay (E-31 Rule 5).
// `--story-replay vernacular` seeds stage 1 from the committed T-129 fixture without spend
// (source: "replay-of-fixture" in its stage ledger).
//
// NO OPTICS, BY CONSTRUCTION (E-32 Rule 4): no stage takes an image — the block vocabulary is
// TEXT from the committed table; this file never passes `images` to the bridge (pinned by
// src/pack/formation-guard.test.mjs).
//
// Pins (T-119): every file this run writes is declared to preflightPins BEFORE any spend.
// Drafts land under packs/drafts/ — never in lisa's scan dirs, and structurally rejected by
// parseStylePack until ratified.
//
// OFFLINE: re-render every committed stage prompt (sha vs stage ledger), re-parse every
// committed reply (deep-equal vs expected), re-derive draft/README/comparison and BYTE-ASSERT
// them; exit nonzero on drift.

import { readFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_TIERS } from "../src/config.mjs";
import { requestText } from "../src/sdk-binding.mjs";
import { askParsed } from "../src/baml/ask.mjs";
import { MAX_REPLY_ATTEMPTS } from "../src/form/judge-reply.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../src/form/pin-guard.mjs";
import { bamlRender, bamlBatch } from "../src/baml/bridge.mjs";
import { loadStylePack } from "../src/pack/style-pack.mjs";
import { registryDigest } from "../src/pack/brush-catalog.mjs";
import { brushNames } from "../src/pack/idiom-registry.mjs";
import {
  FORMATION_LEDGER_SCHEMA,
  blockVocabularyDigest,
  storyDigest,
  sourcesFromStory,
  sourceKeysDigest,
  paletteDigest,
  styleSummaryFromParts,
  classifyPalette,
  classifyProportions,
  classifyBacklog,
  deriveDraftFromStages,
  comparePacks,
  draftReadme,
} from "../src/pack/formation.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

const VERNACULAR_FIXTURE = "src/baml/fixtures/vernacular";
const STAGES = ["vernacular", "palette", "proportions", "decompose"];
const STAGE_FILES = ["inputs.json", "prompt.txt", "reply.txt", "expected.json", "ledger.json"];
const FN_OF = {
  vernacular: "AuthorMaterialStory",
  palette: "DerivePalette",
  proportions: "DeriveProportions",
  decompose: "DecomposeBrushBacklog",
};

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
const flagVal = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const brief = flagVal("--brief");
const briefFile = flagVal("--brief-file");
const storyReplay = flagVal("--story-replay");
const slug = flagVal("--slug");
const comparePath = flagVal("--compare");
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);

const usage = () => {
  console.error(
    "usage: node scripts/form-style.mjs (--brief <text> | --brief-file <path> | --story-replay vernacular)\n" +
    "                                   --slug <style-slug> [--compare packs/<style>.json] [--offline] [--rotate-pins]",
  );
  process.exit(2);
};
const sourceModes = [brief, briefFile, storyReplay].filter((x) => x !== null);
if (!offline && sourceModes.length !== 1) usage();
if (storyReplay !== null && storyReplay !== "vernacular") usage();
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) usage();

const draftDir = `packs/drafts/${slug}`;
const stageDir = (stage) => `${draftDir}/stages/${stage}`;
const stageRels = (stage) => STAGE_FILES.map((f) => `${stageDir(stage)}/${f}`);
const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });
const readRel = (rel) => readFileSync(join(ROOT, rel), "utf8");

// ---------------------------------------------------------------- shared derivation tail

/** Stage expecteds → the emitted artifacts {rel → content}. ONE derivation for live and
 *  offline (deriveDraftFromStages + the curated comparison when --compare names a pack). */
function deriveOutputs({ story, palette, proportions, backlog, compare }) {
  const { draft, deduped, owned, nearTone } = deriveDraftFromStages({
    story, palette, proportions, backlog, styleSlug: slug, ownedNames: brushNames(),
  });
  const comparison = compare ? comparePacks(draft, loadStylePack(join(ROOT, compare))) : null;
  const files = {
    [`${draftDir}/draft.json`]: jsonOf(draft),
    [`${draftDir}/README.md`]: draftReadme({ pack: draft, nearTone, needs: deduped, comparison }),
    ...(comparison ? { [`${draftDir}/comparison.json`]: jsonOf(comparison) } : {}),
  };
  return { draft, deduped, owned, files };
}

// ---------------------------------------------------------------- OFFLINE replay

if (offline) {
  const ledgerRel = `${draftDir}/ledger.json`;
  if (!existsSync(join(ROOT, ledgerRel))) {
    console.error(`[form-style] offline: no committed run under ${draftDir} — run live first.`);
    process.exit(1);
  }
  const runLedger = JSON.parse(readRel(ledgerRel));
  const drifted = [];
  // one batched bridge spawn: 4 renders + 4 parses
  const inputs = Object.fromEntries(STAGES.map((s) => [s, JSON.parse(readRel(`${stageDir(s)}/inputs.json`))]));
  const ops = [
    ...STAGES.map((s) => ({ fn: FN_OF[s], mode: "render", args: inputs[s] })),
    ...STAGES.map((s) => ({ fn: FN_OF[s], mode: "parse", text: readRel(`${stageDir(s)}/reply.txt`) })),
  ];
  const R = await bamlBatch(ops);
  const expected = {};
  STAGES.forEach((s, i) => {
    const render = R[i];
    const parse = R[i + STAGES.length];
    const stageLedger = JSON.parse(readRel(`${stageDir(s)}/ledger.json`));
    if (!render.ok || sha256(render.prompt) !== stageLedger.promptSha256) {
      drifted.push(`${stageDir(s)}/prompt.txt (render ${render.ok ? "sha mismatch" : render.error})`);
    }
    const committed = readRel(`${stageDir(s)}/expected.json`);
    if (!parse.ok || jsonOf(parse.parsed) !== committed) {
      drifted.push(`${stageDir(s)}/expected.json (${parse.ok ? "re-parse differs" : parse.error})`);
    }
    expected[s] = JSON.parse(committed);
  });
  const { files } = deriveOutputs({
    story: expected.vernacular,
    palette: expected.palette,
    proportions: expected.proportions,
    backlog: expected.decompose,
    compare: runLedger.compare ?? null,
  });
  for (const [rel, content] of Object.entries(files)) {
    if (!existsSync(join(ROOT, rel)) || readRel(rel) !== content) drifted.push(rel);
  }
  if (drifted.length) {
    for (const rel of drifted) console.error(`[form-style] DRIFT: ${rel}`);
    process.exit(1);
  }
  console.error(`[form-style] offline ${slug}: prompts, parses, and artifacts byte-identical (${STAGES.length} stages).`);
  process.exit(0);
}

// ---------------------------------------------------------------- LIVE

// BEFORE ANY SPEND (T-119): declare every record this run writes.
const allRels = [
  ...STAGES.flatMap(stageRels),
  `${draftDir}/draft.json`,
  `${draftDir}/README.md`,
  `${draftDir}/ledger.json`,
  ...(comparePath ? [`${draftDir}/comparison.json`] : []),
];
const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: allRels.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
  rotate,
  intent: `style formation run (${slug})`,
});

const model = MODEL_TIERS.strong;
const stageSummaries = {};

/** Run one LIVE stage: render → bounded gated asks → commit the full mint-shape record.
 *  Refusal (budget exhausted) commits the honest ledger and exits nonzero. */
async function runStage(stage, args, classify) {
  const fn = FN_OF[stage];
  const { prompt } = await bamlRender({ fn, args });
  console.error(`[form-style] ${slug}/${stage}: asking ${fn} (budget ${MAX_REPLY_ATTEMPTS}, model ${model})…`);
  const { expected, replies, rawTexts, askCount } = await askParsed({ fn, prompt, model, classify, transport: requestText });
  await mkdir(join(ROOT, stageDir(stage)), { recursive: true });
  await write(`${stageDir(stage)}/inputs.json`, jsonOf(args));
  await write(`${stageDir(stage)}/prompt.txt`, prompt);
  await write(`${stageDir(stage)}/ledger.json`, jsonOf({
    schema: "style-formation-stage/v1",
    ticket: "T-130-01",
    fn,
    model,
    source: "live",
    transport: "claude -p subscription shim (sdk-binding requestText) — no metered API key",
    promptSha256: sha256(prompt),
    budget: MAX_REPLY_ATTEMPTS,
    askCount,
    accepted: expected !== null,
    replies,
    rawTexts, // FULL raw texts, one per live ask (the AC's committed raw replies)
  }));
  stageSummaries[stage] = { fn, source: "live", promptSha256: sha256(prompt), askCount, accepted: expected !== null };
  if (expected === null) {
    console.error(`[form-style] ${slug}/${stage}: REFUSED — every reply malformed within the budget (ledger committed).`);
    await writeRunLedger({ accepted: false, refusedStage: stage });
    process.exit(1);
  }
  await write(`${stageDir(stage)}/reply.txt`, rawTexts[rawTexts.length - 1]);
  await write(`${stageDir(stage)}/expected.json`, jsonOf(expected));
  return expected;
}

/** Stage 1 by replay: copy the committed vernacular fixture into the run's stage dir —
 *  deterministic, spend-free (E-31 Rule 5); the brief stays recorded in inputs.json. */
async function replayVernacular() {
  await mkdir(join(ROOT, stageDir("vernacular")), { recursive: true });
  const fixtureLedger = JSON.parse(readRel(`${VERNACULAR_FIXTURE}/ledger.json`));
  for (const f of ["inputs.json", "prompt.txt", "reply.txt", "expected.json"]) {
    await write(`${stageDir("vernacular")}/${f}`, readRel(`${VERNACULAR_FIXTURE}/${f}`));
  }
  await write(`${stageDir("vernacular")}/ledger.json`, jsonOf({
    schema: "style-formation-stage/v1",
    ticket: "T-130-01",
    fn: FN_OF.vernacular,
    model: fixtureLedger.model,
    source: "replay-of-fixture",
    fixture: VERNACULAR_FIXTURE,
    promptSha256: fixtureLedger.promptSha256,
    budget: fixtureLedger.budget,
    askCount: 0,
    accepted: true,
    replies: [],
    rawTexts: [],
  }));
  stageSummaries.vernacular = {
    fn: FN_OF.vernacular, source: "replay-of-fixture", promptSha256: fixtureLedger.promptSha256, askCount: 0, accepted: true,
  };
  return JSON.parse(readRel(`${VERNACULAR_FIXTURE}/expected.json`));
}

async function writeRunLedger({ accepted, refusedStage = null, dedup = null, counts = null }) {
  await write(`${draftDir}/ledger.json`, jsonOf({
    schema: FORMATION_LEDGER_SCHEMA,
    ticket: "T-130-01",
    styleSlug: slug,
    briefSource: storyReplay ? `story-replay (${VERNACULAR_FIXTURE})` : briefFile ? `brief-file ${briefFile}` : "brief (inline)",
    compare: comparePath,
    model,
    transport: "claude -p subscription shim (sdk-binding requestText) — no metered API key",
    generatedAt: new Date().toISOString(),
    accepted,
    refusedStage,
    stages: stageSummaries,
    dedup,
    counts,
  }));
}

// --- stage 1: the material story
const story = storyReplay
  ? await replayVernacular()
  : await runStage(
      "vernacular",
      { theme_brief: brief ?? (await readFile(join(ROOT, briefFile), "utf8")).trim() },
      (s) =>
        typeof s?.style_name === "string" && s.style_name.trim() !== "" &&
        Array.isArray(s?.available_materials) && s.available_materials.length > 0
          ? { ok: true }
          : { ok: false, reason: "story without a style name or any available materials" },
    );

// --- stage 2: palette derivation (diegetic; vocabulary + citations gated)
const sources = sourcesFromStory(story);
const vocab = blockVocabularyDigest();
const storyD = storyDigest(story);
const palette = await runStage(
  "palette",
  { story_digest: storyD, source_keys: sourceKeysDigest(sources), block_vocabulary: vocab.text },
  (p) => classifyPalette(p, { sourceKeys: Object.keys(sources), vocabNames: vocab.names }),
);

// --- stage 3: proportion rules
const proportions = await runStage(
  "proportions",
  { story_digest: storyD, palette_digest: paletteDigest(palette.roles) },
  classifyProportions,
);

// --- stage 4: brush needs (FX-D1: the empty union is MALFORMED)
const backlog = await runStage(
  "decompose",
  { style_summary: styleSummaryFromParts({ story, roles: palette.roles, proportions }), registry_state: registryDigest() },
  classifyBacklog,
);

// --- pure assembly + the draft record
const { deduped, owned, files } = deriveOutputs({ story, palette, proportions, backlog, compare: comparePath });
for (const [rel, content] of Object.entries(files)) await write(rel, content);
await writeRunLedger({
  accepted: true,
  dedup: { demotions: deduped.demotions, warnings: deduped.warnings },
  counts: { roles: palette.roles.length, idioms: owned.length, newItems: deduped.items.length, notes: deduped.parametrization_notes.length },
});

console.error(
  `[form-style] ${slug}: draft assembled — ${palette.roles.length} roles, ${owned.length} owned idioms, ` +
  `${deduped.items.length} new brush need(s), ${deduped.parametrization_notes.length} note(s).` +
  `\n[form-style] ratification sheet: ${draftDir}/README.md` +
  `\n[form-style] NOT a pack until ratified: npm run style:ratify -- --style ${slug} --by "<who>"`,
);
