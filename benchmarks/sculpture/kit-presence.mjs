// IMPURE RUNNER — the kit-presence proof, both ways (T-100-01, story S-100, epic E-26).
//
// THE CLAIM THIS RECORD PROVES (AC #3): the kit-presence checker (src/form/kit-presence.mjs)
// FAILS the current kit-less cottage with NAMED absences (the durable skin sealed the windows and
// never framed the lines — expected gaps: frame on the frame lines, fence infill and trapdoor
// shutters at the concept-declared openings) and PASSES a build that actually contains its
// ingredients. The positive is not a hand-made fixture: it is the recorded E-26 pipeline order
// (durable-skin → placement-grammar → T-099 dressing) COMPOSED — the committed grammar artifact
// dressed by the committed kit's treatments — and committed here as
// kit-presence/<subj>/dressed-artifact.json.
//
// DETERMINISM (E-24 Rule 2): no LLM, no GL on this path — every input is a committed record or
// artifact and the checker is pure. The checker runs TWICE per side and must be byte-identical;
// the dressed-positive artifact sha256 is recorded and re-asserted by --offline.
//
// THE KIT IS IMMUTABLE INPUT (AC #4, E-26 Rule 2): this runner loads the committed kit/v1 record
// and hands it to the checker verbatim — there is no extraction call and no re-ranking on this
// path, and no flag to point the proof at a different kit.
//
// GENERALIZATION (E-25 Rule 3): subjects come from the durable-skin registry; paths are derived,
// not branched.
//
//   npm run presence:cottage                # the proof: negative gaps + positive pass + record
//   npm run presence:cottage -- --offline   # re-assert the committed record + artifact hash
//
// Exit codes: 0 = both directions behave as claimed · 1 = a direction failed its expectation.
// Writes kit-presence/<subj>.{json,md} + kit-presence/<subj>/dressed-artifact.json (committed).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { zonesFromBands } from "../../src/view/zone-map.mjs";
import {
  extractApertures, dressOpenings, applyDressing,
} from "../../src/view/opening-dressing.mjs";
import { kitPresence, KIT_PRESENCE_SCHEMA } from "../../src/form/kit-presence.mjs";
import { composeVocabulary } from "../../src/form/material-vocabulary.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "kit-presence");

export const PROOF_SCHEMA = "kit-presence-proof/v1";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** The gap families the negative direction must name (the ticket's expected absences). */
const EXPECTED_NEGATIVE_FAMILIES = ["frame", "infill", "shutters"];

async function loadJson(rel) {
  return JSON.parse(await readFile(join(HERE, rel), "utf8"));
}

async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const dressedPath = join(subjDir, "dressed-artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(dressedPath)) {
      throw new Error(`committed record/artifact absent — run npm run presence:${def.key} first`);
    }
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(dressedPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const gapText = (rec.negative?.gaps ?? []).join("\n");
    const checks = {
      schema: rec.schema === PROOF_SCHEMA,
      sha: sha256(artBytes) === rec.positive?.artifactSha256,
      negativeFails: rec.negative?.passed === false && (rec.negative?.gaps ?? []).length > 0,
      negativeNames: EXPECTED_NEGATIVE_FAMILIES.every((f) => gapText.includes(` ${f} @ `)),
      positivePasses: rec.positive?.passed === true && (rec.positive?.gaps ?? []).length === 0,
      deterministic: rec.reproducible?.doubleRun === true,
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: schema ${checks.schema ? "OK" : "BAD"}; dressed sha ` +
      `${checks.sha ? "MATCHES" : "DIVERGES"}; negative ${checks.negativeFails ? "fails" : "VIOLATED"} ` +
      `(${checks.negativeNames ? "named families OK" : "FAMILIES MISSING"}); positive ` +
      `${checks.positivePasses ? "passes" : "VIOLATED"}; double-run ${checks.deterministic ? "OK" : "VIOLATED"}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  // --- committed inputs (every one a prior ticket's durable output) -------------------------------
  const paths = {
    negative: `durable-skin/${def.key}/artifact.json`,
    grammar: `placement-grammar/${def.key}/artifact.json`,
    ref: def.build, // the raw pre-seal build whose openings the concept declared (T-099's ref)
    kit: def.kitRecord,
    skinRecord: `durable-skin/${def.key}.json`,
  };
  for (const [what, rel] of Object.entries(paths)) {
    if (!rel || !existsSync(join(HERE, rel))) throw new Error(`${what} input absent: ${rel}`);
  }
  const negative = await loadJson(paths.negative);
  const grammarArt = await loadJson(paths.grammar);
  const ref = await loadJson(paths.ref);
  const kitRec = await loadJson(paths.kit);
  const skinRec = await loadJson(paths.skinRecord);
  assertArtifact(negative);
  assertArtifact(grammarArt);
  if (kitRec.schema !== "kit/v1") throw new Error(`${paths.kit} is not a kit/v1 record`);
  if (skinRec.zoneMap?.source !== "concept" || !skinRec.zoneMap.bands) {
    throw new Error("durable-skin record has no concept-derived zone map — presence binds to the T-092 bands");
  }

  // the grammar runner's exact composition, via the AUTHORITY (T-113-01): the committed skin
  // record holds the already-shipped policy; the renaming point and the shipped treatments
  // compose in the one module.
  const bandNames = skinRec.zoneMap.bands.map((b) => b.name);
  const vocab = composeVocabulary({
    policyNamed: skinRec.fill.policy, policySpace: "shipped",
    substitution: skinRec.valueTrue?.substitution ?? {},
    kitOverrides: kitRec.overrides ?? {}, kit: kitRec.kit ?? [],
  });
  const policy = vocab.zones;
  const sub = vocab.sub;
  const apertures = extractApertures(artifactOccupancy(ref));
  if (!apertures.length) throw new Error("no apertures on the reference build — wiring bug, not a result");
  const treatments = vocab.treatments;

  /** The checker over one artifact — geometry re-read from THAT artifact (AC #1). */
  const check = (artifact) => {
    const occ = artifactOccupancy(artifact);
    const sz = structuralZones(occ, def.zoneOpts ?? {});
    const zb = zonesFromBands({
      bands: skinRec.zoneMap.bands, roof: skinRec.zoneMap.roof,
      roofKeys: sz.roofKeys, upperTop: sz.upperTop,
    });
    return kitPresence(occ, {
      kit: kitRec.kit, bandNames, policy, zoneOf: zb.zoneOf,
      floorLines: sz.floorLines, upperTop: sz.upperTop, roofKeys: sz.roofKeys, sub,
      apertures, treatments,
    });
  };

  // --- the POSITIVE: the recorded pipeline order, composed --------------------------------------
  const dress = dressOpenings(artifactOccupancy(grammarArt), apertures, treatments);
  const dressed = applyDressing(grammarArt, dress.placements);
  assertArtifact(dressed);
  const dressedJson = JSON.stringify(dressed, null, 2) + "\n";
  const dressedSha = sha256(dressedJson);
  console.error(`[${def.key}] positive composed: grammar artifact + ${dress.placements.length} dressing ` +
    `placements (pipeline order: durable-skin → placement-grammar → T-099) — sha256 ${dressedSha.slice(0, 12)}…`);

  // --- both directions, double-run (byte-identical or no record) --------------------------------
  const run = (artifact, label) => {
    const a = check(artifact);
    const b = check(artifact);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error(`NON-DETERMINISTIC: two checker runs diverged on the ${label} artifact`);
    }
    return a;
  };
  const neg = run(negative, "negative");
  const pos = run(dressed, "positive");

  console.error(`[${def.key}] NEGATIVE (${paths.negative}): ${neg.passed ? "PASSED (unexpected)" : "fails"}`);
  for (const gap of neg.gaps) console.error(`  gap: ${gap}`);
  for (const s of neg.skips) console.error(`  skip: ${s.feature} — ${s.reason}`);
  console.error(`[${def.key}] POSITIVE (composed): ${pos.passed ? "passes" : "FAILED (unexpected)"}`);
  for (const gap of pos.gaps) console.error(`  gap: ${gap}`);

  // --- expectations (a failed proof writes a failing record and exits 1) -------------------------
  const gapText = neg.gaps.join("\n");
  const expectations = {
    negativeFails: neg.passed === false,
    negativeNamesFamilies: EXPECTED_NEGATIVE_FAMILIES.every((f) => gapText.includes(` ${f} @ `)),
    positivePasses: pos.passed === true,
  };
  const proven = Object.values(expectations).every(Boolean);

  await mkdir(subjDir, { recursive: true });
  await writeFile(dressedPath, dressedJson);
  const record = {
    schema: PROOF_SCHEMA,
    subject: def.key,
    proven,
    expectations,
    inputs: {
      ...paths,
      kitSha256: sha256(JSON.stringify(kitRec)),
      note: "the kit is IMMUTABLE input (E-26 Rule 2) — loaded committed, handed to the checker verbatim",
    },
    pipelineOrder: "durable-skin → placement-grammar → T-099 (openings) → kit-presence gate",
    treatments: { slots: treatments.slots, derivations: treatments.derivations, unfulfilled: treatments.unfulfilled },
    apertures: apertures.map((a) => ({ dir: a.dir, kind: a.kind, bbox: a.bbox, region: a.region })),
    negative: { artifact: paths.negative, ...neg },
    positive: {
      artifact: `kit-presence/${def.key}/dressed-artifact.json`,
      artifactSha256: dressedSha,
      composedFrom: { grammar: paths.grammar, dressingPlacements: dress.placements.length },
      ...pos,
    },
    reproducible: {
      doubleRun: true,
      determinism: "no LLM, no GL — committed inputs, pure checker; two executions byte-matched per side.",
    },
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), recordMd(record));
  console.error(`\n${proven ? "✓ PROOF HOLDS" : "✗ PROOF FAILED"} — wrote ${recPath.replace(ROOT, "")}`);
  process.exitCode = proven ? 0 : 1;
}

function recordMd(r) {
  const checkRows = (res) => res.checks.map((c) =>
    `| ${c.feature} | ${c.shipped ?? c.block ?? "—"} | ${c.gating ? "gating" : "evidence"} | ` +
    `${c.passed === null ? "—" : c.passed ? "pass" : "**MISSING**"} | ` +
    `${c.missing ?? (c.missingAt ? `@ ${c.missingAt.join("/") || "—"}` : c.placed ?? "—")} |`).join("\n");
  const section = (title, res) =>
    `## ${title}\n\n**${res.passed ? "PASS" : "FAIL"}**` +
    (res.gaps.length ? ` — named gaps:\n${res.gaps.map((g) => `- \`${g}\``).join("\n")}` : " — zero gaps") +
    `\n\n| feature | shipped block | kind | verdict | missing |\n|---|---|---|---|---|\n${checkRows(res)}\n` +
    (res.skips.length ? `\nSkips (recorded, never silent): ${res.skips.map((s) => `${s.feature} (${s.reason})`).join("; ")}\n` : "");
  return `# Kit-presence proof — ${r.subject} (T-100-01)\n\n` +
    `**${r.proven ? "PROOF HOLDS" : "PROOF FAILED"}**: the kit-less build fails with named absences; ` +
    `the composed pipeline build (${r.pipelineOrder}) passes.\n\n` +
    `Kit: \`${r.inputs.kit}\` (sha256 \`${r.inputs.kitSha256.slice(0, 12)}…\`, immutable at gate time). ` +
    `Apertures: ${r.apertures.length} concept-declared (measured on \`${r.inputs.ref}\`). ` +
    `Positive artifact: \`${r.positive.artifact}\` (sha256 \`${r.positive.artifactSha256.slice(0, 12)}…\`, ` +
    `${r.positive.composedFrom.dressingPlacements} dressing placements over \`${r.positive.composedFrom.grammar}\`).\n\n` +
    section(`Negative — \`${r.negative.artifact}\``, r.negative) + "\n" +
    section("Positive — the composed pipeline build", r.positive) + "\n" +
    `> ${r.reproducible.determinism}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
}
