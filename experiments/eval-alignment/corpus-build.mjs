#!/usr/bin/env node
/**
 * STYLE-CORPUS BUILDER (E-46 / S-183 / T-183-01) — generate the pack/concept-DECOUPLED corpus by replay.
 *
 * The corpus is a MANIFEST of (BUILD, PACK, CONCEPT IMAGE) triples + beside-concept renders, NOT new
 * scoring code (S-184 writes the consuming harness). This script:
 *   1. asset-guards every reuse build dir + concept + pack (referee idiom — fail before any work),
 *   2. SYNTHESIZES the controlled hard-middle build (a pure, model-free, single-material mutation of the
 *      fully-faithful gatehouse) and renders it (GL) — the faithful-roof.mjs replay precedent,
 *   3. composes a beside-concept PNG for EVERY state (composeTwo — pure, GL-free, from committed views),
 *   4. assembles the manifest, self-validates it via parseStyleCorpus (no unvalidated manifest is
 *      written), and writes experiments/eval-alignment/corpus/style-corpus.json.
 *
 * THE DECOUPLING (the whole point): each state hands the scorer a pack file and a concept file
 * INDEPENDENTLY — the corpus bypasses recognition, so pack-effect and concept-image-effect are separable
 * by construction. This generalizes corpus-referee.mjs's single-subject 4-condition crater (A-matched /
 * B / C-control) into a multi-subject POPULATION; C-control IS the same-pack/wrong-picture crux cell.
 *
 * Model-free. NOT in `npm test` (the LOADER test is). Renders are evidence, not a byte-gate (GL pixels
 * aren't byte-stable). Nothing under measurements/ is touched.
 *
 *   node experiments/eval-alignment/corpus-build.mjs            # full: synth render + beside + manifest
 *   GUARD_ONLY=1 node experiments/eval-alignment/corpus-build.mjs   # asset guard only, no work
 *   node experiments/eval-alignment/corpus-build.mjs --no-render    # reuse committed synth renders
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { decodeImage } from "../../src/color/palette-extract.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";
import { parseStyleCorpus, STYLE_CORPUS_SCHEMA } from "../../src/workshop/style-corpus.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CORPUS_DIR = join(ROOT, "experiments", "eval-alignment", "corpus");
const BESIDE_DIR = join(CORPUS_DIR, "beside");
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
const NO_RENDER = process.argv.includes("--no-render");

// ---- canonical asset paths (single-sourced so every state references the same strings) ----
const PACKS = { matched: "packs/rustic.json", foreign: "packs/guildhall.json" };
const CONCEPT = {
  gatehouse: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
  cottage: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
  barn: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
  classical: "benchmarks/temple-facade/concepts/arc-A-flash.png",
};
const SYNTH_BUILD = "builds/gatehouse/faithful-covered-mid";
const SYNTH_BASE = "builds/gatehouse/faithful-covered";
// The one-factor mutation: swap the ROOF timber from dark oak (near-black, the concept's roof) to spruce
// (warm medium-brown) — both are wood-shingle roofs, so it is a plausible-but-wrong material, not a
// broken roof. (A first attempt, stone_bricks->cobblestone on the walls, was rejected at inspection:
// grey-on-grey it was INVISIBLE at render distance — it would have scored ~HIGH, mislabeling a "middle".
// Contestability needs a VISIBLE-but-plausible factor; the roof is prominent and a brown timber roof vs a
// dark one is genuinely rank-either-way. Confirmed by inspection, T-183-01 AC #3.)
const MUTATION = [
  { from: "minecraft:dark_oak_stairs", to: "minecraft:spruce_stairs" },
  { from: "minecraft:dark_oak_planks", to: "minecraft:spruce_planks" },
];

// ---- the factorial (design.md table) — id, subject, cellType, build, pack, concept, intended, note ----
const STATES = [
  // match (HIGH) — build · its true pack · the concept it was built for
  { id: "gh-match", subject: "gatehouse", cellType: "match", build: SYNTH_BASE, pack: PACKS.matched, concept: CONCEPT.gatehouse, intendedFaithfulness: "high",
    note: "Fully-faithful gatehouse (E-44/S-177) · rustic pack · its own concept. The HIGH anchor." },
  { id: "ct-match", subject: "cottage", cellType: "match", build: "builds/cottage/roof-covering", pack: PACKS.matched, concept: CONCEPT.cottage, intendedFaithfulness: "high",
    note: "Cottage roof-covering build · rustic pack · cottage concept. Second-subject HIGH anchor." },
  { id: "bn-match", subject: "barn", cellType: "match", build: "builds/barn/roof-covering", pack: PACKS.matched, concept: CONCEPT.barn, intendedFaithfulness: "high",
    note: "Barn roof-covering build · rustic pack · barn concept. Third-subject HIGH anchor." },

  // same-pack, wrong-picture (LOW) — the crux: pack agrees with the build, the PICTURE does not
  { id: "gh-samepack-classical", subject: "gatehouse", cellType: "same-pack-wrong-picture", build: SYNTH_BASE, pack: PACKS.matched, concept: CONCEPT.classical, intendedFaithfulness: "low",
    note: "Rustic gatehouse · rustic pack · CLASSICAL arc concept. The cross-family crux (== referee C-control): if scored HIGH the term reads the pack, not the picture." },
  { id: "gh-samepack-cottage", subject: "gatehouse", cellType: "same-pack-wrong-picture", build: SYNTH_BASE, pack: PACKS.matched, concept: CONCEPT.cottage, intendedFaithfulness: "low",
    note: "Rustic gatehouse · rustic pack · COTTAGE concept. WITHIN-rustic-family wrong picture: same pack, same broad style, wrong subject/form — the decisive 'reads the form not just the materials' cell." },
  { id: "ct-samepack-gatehouse", subject: "cottage", cellType: "same-pack-wrong-picture", build: "builds/cottage/roof-covering", pack: PACKS.matched, concept: CONCEPT.gatehouse, intendedFaithfulness: "low",
    note: "Rustic cottage · rustic pack · GATEHOUSE concept. Cross-subject same-family wrong picture (second subject)." },

  // wrong-pack, right-picture — pack-sensitivity probe: build matches the picture, pack is foreign
  { id: "gh-wrongpack", subject: "gatehouse", cellType: "wrong-pack-right-picture", build: SYNTH_BASE, pack: PACKS.foreign, concept: CONCEPT.gatehouse, intendedFaithfulness: "high",
    note: "Faithful gatehouse · GUILDHALL (foreign) pack · its own gatehouse concept. Build matches the picture; if the foreign pack tanks the score the term is pack-driven not picture-driven." },
  { id: "ct-wrongpack", subject: "cottage", cellType: "wrong-pack-right-picture", build: "builds/cottage/roof-covering", pack: PACKS.foreign, concept: CONCEPT.cottage, intendedFaithfulness: "high",
    note: "Cottage build · guildhall pack · its own cottage concept. Second-subject pack-sensitivity probe." },

  // cross — off-diagonal: a different-subject build vs a non-matching picture, matched pack
  { id: "bn-cross", subject: "barn", cellType: "cross", build: "builds/barn/roof-covering", pack: PACKS.matched, concept: CONCEPT.cottage, intendedFaithfulness: "low",
    note: "Barn build · rustic pack · COTTAGE concept. Off-diagonal: same pack, wrong subject — populates the matrix." },

  // hard-middle (MIDDLE) — partially-faithful, genuinely contestable (inspected on the render, AC #3)
  { id: "gh-mid-material", subject: "gatehouse", cellType: "hard-middle", build: SYNTH_BUILD, pack: PACKS.matched, concept: CONCEPT.gatehouse, intendedFaithfulness: "middle", synthesized: true,
    note: "ONE WRONG MATERIAL: the faithful gatehouse with its dark-oak roof timber swapped to spruce (warm brown vs the concept's near-black dark timber) — a plausible-but-wrong wood-shingle roof, prominent and VISIBLE but rank-either-way. (A first stone_bricks->cobblestone wall swap was invisible grey-on-grey and rejected at inspection.) Contestability call recorded in review.md after render inspection." },
  { id: "gh-mid-gate", subject: "gatehouse", cellType: "hard-middle", build: "builds/gatehouse/new-roof", pack: PACKS.matched, concept: CONCEPT.gatehouse, intendedFaithfulness: "middle",
    note: "MISSING DRESSING: clean stone gatehouse, gable roof reads, but the front gate is an unframed rectangular gap (no arch, no timber surround) vs the concept's arched timber gate. Naturally-partial (defect-corpus gatehouse-gaping-gate)." },
  { id: "ct-mid-plain", subject: "cottage", cellType: "hard-middle", build: "builds/cottage/new-roof", pack: PACKS.matched, concept: CONCEPT.cottage, intendedFaithfulness: "middle",
    note: "MISSING DRESSING: roof + stone base read; the upper storey is plain — missing the concept's half-timber stud grammar. Naturally-partial (defect-corpus cottage-plain-upper)." },
];

const AZIMUTHS = ["+x+z", "+x-z", "-x-z", "-x+z"];

// ---- small local helpers (lifted from corpus-referee.mjs — tiny, kept local per project idiom) ----
async function composeTwo(pathA, pathB, outPath, gutter = 16) {
  const a = await decodeImage(pathA);
  const b = await decodeImage(pathB);
  const W = a.width + gutter + b.width, H = Math.max(a.height, b.height);
  const out = new PNG({ width: W, height: H });
  out.data.fill(0xff);
  const blit = (src, dx) => {
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) << 2, di = (W * y + (x + dx)) << 2;
      out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 0xff;
    }
  };
  blit(a, 0); blit(b, a.width + gutter);
  await mkdir(dirname(outPath), { recursive: true });
  writeFileSync(outPath, PNG.sync.write(out));
}

/** PURE single-factor material mutation: apply each {from,to} pair to every placement and patch the
 *  palette manifest (dedup, drop the now-absent blocks). Deterministic — re-running re-derives
 *  byte-identically. `pairs` is one conceptual change (here: the roof timber family, stairs + planks). */
function mutateMaterial(artifact, pairs) {
  const map = new Map(pairs.map((p) => [p.from, p.to]));
  const placements = artifact.placements.map((p) => (map.has(p.block) ? { ...p, block: map.get(p.block) } : p));
  const manifest = [...new Set((artifact.palette?.manifest ?? []).map((b) => map.get(b) ?? b))].sort();
  return { ...artifact, placements, palette: { ...artifact.palette, manifest } };
}

async function synthesize() {
  const base = JSON.parse(await readFile(join(ROOT, SYNTH_BASE, "artifact.json"), "utf8"));
  const mutated = mutateMaterial(base, MUTATION);
  const froms = new Set(MUTATION.map((p) => p.from));
  const nFrom = base.placements.filter((p) => froms.has(p.block)).length;
  const swap = MUTATION.map((p) => `${p.from}->${p.to}`).join(", ");
  const outDir = join(ROOT, SYNTH_BUILD);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "artifact.json"), JSON.stringify(mutated));
  const source = [
    `# ${SYNTH_BUILD} — controlled hard-middle (one wrong material) (E-46 / S-183 / T-183-01)`,
    "",
    `A pure single-factor mutation of ${SYNTH_BASE}: the ROOF timber family swapped`,
    `${swap} on every placement (${nFrom} roof cells). Dark oak (near-black, the`,
    "concept's roof) becomes spruce (warm medium-brown) — both are wood-shingle roofs, so it is a",
    "plausible-but-wrong material, NOT a broken roof. The roof is prominent, so the change is VISIBLE",
    "(unlike a first stone_bricks->cobblestone attempt that was invisible grey-on-grey); a brown-timber",
    "gatehouse vs a dark-timber concept is genuinely rank-either-way — the contestable hard middle.",
    "",
    "Model-free, deterministic. Reproduce: `node experiments/eval-alignment/corpus-build.mjs`.",
    "Contestability confirmed by render inspection (T-183-01 AC #3); call recorded in the work review.",
    "",
    `## Numbers`,
    `- roof placements rewritten: ${nFrom} / ${base.placements.length}`,
    `- palette manifest: ${(mutated.palette.manifest || []).join(", ")}`,
    "",
  ].join("\n");
  writeFileSync(join(outDir, "SOURCE.md"), source);

  if (NO_RENDER) { console.log(`[synth] --no-render: reused committed renders in ${SYNTH_BUILD}`); return; }
  await renderViews(mutated, AZIMUTHS, { outDir, label: (a) => a, width: 512, height: 512 });
  await renderBesideConcept(mutated, join(ROOT, CONCEPT.gatehouse), join(outDir, "beside-concept.png"), { label: "gatehouse-mid-material" });
  console.log(`[synth] ${SYNTH_BUILD}: ${swap} (${nFrom} cells) rendered`);
}

async function main() {
  // Each state carries renderDir (== build) + beside (the composeTwo output we will write).
  const states = STATES.map((s) => ({ ...s, renderDir: s.build, beside: `experiments/eval-alignment/corpus/beside/${s.id}.png` }));

  // ---- asset guard (before any work): every reuse build's views, every concept, every pack ----
  const guard = new Set();
  for (const s of states) {
    guard.add(join(ROOT, s.pack));
    guard.add(join(ROOT, s.concept));
    if (s.build !== SYNTH_BUILD) for (const a of AZIMUTHS) guard.add(join(ROOT, s.build, `view-${a}.png`));
  }
  const missing = [...guard].filter((p) => !existsSync(p));
  if (missing.length) throw new Error(`missing assets:\n  ${missing.join("\n  ")}`);
  console.log(`[guard] ${guard.size} reuse assets present; ${states.length} states`);
  if (GUARD_ONLY) { console.log("[guard] GUARD_ONLY — no work; exiting clean."); return; }

  // ---- synthesize the controlled hard-middle build (+ render) ----
  await synthesize();

  // ---- compose a beside-concept PNG for every state (pure, GL-free, from the view-+x+z.png) ----
  await mkdir(BESIDE_DIR, { recursive: true });
  for (const s of states) {
    const buildView = join(ROOT, s.renderDir, "view-+x+z.png");
    if (!existsSync(buildView)) throw new Error(`state ${s.id}: missing ${buildView} (synth render failed?)`);
    await composeTwo(join(ROOT, s.concept), buildView, join(ROOT, s.beside));
  }
  console.log(`[beside] wrote ${states.length} beside-concept composites`);

  // ---- assemble + SELF-VALIDATE + write the manifest ----
  const manifest = {
    schema: STYLE_CORPUS_SCHEMA,
    rater: "single-rater: claude (agent), 2026-06-17. Intended faithfulness labels are ONE rater's, set by render inspection beside each concept — NOT human-agreement ground truth (that is S-184, the human gate). Recorded as such (anti-hedge: the corpus's labels can refute a term but only human labels license a promote).",
    notes: [
      "E-46 / S-183 decoupling corpus. 12 states, 3 subjects (gatehouse, cottage, barn), 2 packs (rustic matched, guildhall foreign).",
      "DECOUPLING IS BY CONSTRUCTION: every state hands the scorer a pack file and a concept file as INDEPENDENT diagnose() arguments — the corpus bypasses recognition, so pack-effect and concept-image-effect are separable. This generalizes corpus-referee.mjs's single-subject crater (A-matched/B/C-control); C-control IS the same-pack/wrong-picture crux cell.",
      "CONSTRUCTIBILITY (AC, honest): all four crux cell types were constructible — NONE refused. The S-183 'recognition always re-derives a matching pack -> inseparable' failure does NOT occur here because the corpus never runs recognition; it supplies (pack, concept) by hand. That structural-confound risk is a PRODUCTION-PIPELINE property (where the pack is derived from the concept), not a corpus one — which is also why this corpus can REFUTE the term (a same-pack/wrong-picture cell scored high = reads the pack) but cannot by itself prove the production path reads the picture.",
      "HARD MIDDLE: 3 partially-faithful states. gh-mid-material is a CONTROLLED single-factor mutation (synthesized, roof timber dark_oak->spruce — a visible-but-plausible wrong material); gh-mid-gate and ct-mid-plain are naturally-partial reuse builds (gatehouse with a gaping unframed gate / cottage with a plainer wall missing the half-timber grammar). Each was inspected on the render and confirmed genuinely contestable (a first invisible stone_bricks->cobblestone synth was rejected). Calls recorded in the T-183-01 review.",
    ].join("\n"),
    packs: PACKS,
    states,
  };
  const res = parseStyleCorpus(manifest);
  if (!res.ok) throw new Error(`refusing to write invalid manifest:\n${res.errors.join("\n")}`);
  await writeFile(join(CORPUS_DIR, "style-corpus.json"), JSON.stringify(manifest, null, 2) + "\n");

  // ---- summary ----
  console.log("\n================ STYLE CORPUS ================");
  const byType = {};
  for (const s of states) (byType[s.cellType] ??= []).push(s.id);
  for (const [t, ids] of Object.entries(byType)) console.log(`  ${t.padEnd(26)} ${ids.length}  ${ids.join(", ")}`);
  console.log(`  subjects: ${[...new Set(states.map((s) => s.subject))].join(", ")}`);
  console.log("=============================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
