#!/usr/bin/env node
/**
 * CLEAN × WRONG-STYLE CRATER (T-166-01, story S-166, epic E-39) — claim 2's referee.
 *
 * The E-38 wrong-style-probe held a build FIXED and varied the concept under the SCALAR defect-eval: it
 * came back flat (gatehouse/barn/cottage/church 22–32, inside ±12 noise) — IDENTITY-BLIND within the
 * building family. The confound it named: that probe scored a *defective* gatehouse against same-STYLE
 * (all-rustic) concepts. The missing asset is a CLEAN build scored against a same-family WRONG-STYLE
 * concept, under the PER-STYLE Layer A judge (T-165). This runs exactly that.
 *
 * FALSIFIABLE (lead with how it fails): the clean rustic gatehouse must score FAR BELOW its matched
 * rustic concept when judged against a classical/wrong-style concept under that style's `expected`. IT
 * FAILS — and that is the most important negative result — if A≈B (the per-style `expected` is cosmetic;
 * the blindness is in the model's READING, route to a deeper-measurement epic).
 *
 * Manipulation: BUILD renders FIXED (clean gatehouse) + PROGRAM FIXED (a synthetic gatehouse program,
 * identical every condition, so it is NOT a variable). Vary only (concept, style_profile):
 *   A  MATCHED   gatehouse concept (rustic) + rustic profile   → expect HIGH (build matches both)
 *   B  WRONG     classical arch (arc-A)     + guildhall profile → expect CRATER (rustic build, classical expected)
 *   B2 WRONG     Gothic cathedral (chapelle)+ guildhall profile → triangulates B against arc-A's palette confound
 *   C  CONTROL   classical arch (arc-A)     + rustic profile    → isolates: profile vs concept-image
 *
 * Spread A−B beside the E-38 scalar baseline. The C control attributes the crater (B≪C ⇒ the per-style
 * `expected` does the work). The `missing` strings are the real proof; the 0-100 is a convenience.
 *
 * One DiagnoseBuild call per (condition, vote), no re-ask (spend caution; a zero-token notice reply only
 * burns budget). NOT in `npm test`. Writes evidence + beside-concept PNGs under this ticket's work dir.
 * Not the frozen instrument.
 *
 *   npm run clean-wrong-style
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, BAKEOFF_SCHEMA } from "../../src/workshop/bakeoff-score.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = fileURLToPath(new URL("./", import.meta.url));
const TIER = "strong";
const VOTES = 2;
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

// The clean build (E-38's "not intrinsically broken" gatehouse, q≈34) — renders held FIXED.
const BUILD_DIR = "builds/gatehouse/new-roof";
const renderPaths = azimuths.map((a) => join(ROOT, BUILD_DIR, `view-${a}.png`));

// A synthetic gatehouse PROGRAM — held FIXED across every condition, so it is a constant, not a variable.
// It only fills diagnose.mjs::programBlock (stringified masses + reading.summary); it is NOT a recognition
// output and is labelled as a stand-in. Faithful to the actual build: stone gatehouse, gable roof, arched gate.
const PROGRAM = Object.freeze({
  reading: { summary: "A small square stone gatehouse: thick masonry walls, a steep gabled roof, and a single arched gate on the front." },
  masses: [
    {
      id: "gatehouse",
      role: "gatehouse",
      roof: { idiom: "roof.gable", pitchClass: 2 },
      walls: { role: "wall.stone" },
      openings: [{ kind: "gate", treatment: "arch", at: "front" }],
    },
  ],
});

const CONDITIONS = [
  { key: "A-matched",  tier: "MATCHED",  pack: "packs/rustic.json",    concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", note: "rustic concept + rustic profile (build matches both)" },
  { key: "B-arc",      tier: "WRONG",    pack: "packs/guildhall.json", concept: "benchmarks/temple-facade/concepts/arc-A-flash.png",      note: "classical arch concept + guildhall profile" },
  { key: "B2-chapelle",tier: "WRONG",    pack: "packs/guildhall.json", concept: "benchmarks/temple-facade/concepts/chapelle-A-flash.png", note: "Gothic cathedral concept + guildhall profile (triangulates arc-A's palette confound)" },
  { key: "C-control",  tier: "CONTROL",  pack: "packs/rustic.json",    concept: "benchmarks/temple-facade/concepts/arc-A-flash.png",      note: "classical concept + RUSTIC profile (isolates profile vs concept-image)" },
];

// Sniff the real media type — the "concept.png" benchmark files are actually JPEG bytes.
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

/** Minimal side-by-side composite (no GL, no model) — concept | build render, for the AC's "renders
 *  beside both concepts". decodeImage sniffs JPEG/PNG. Native size, gutter, top-aligned on white. */
async function composeTwo(pathA, pathB, outPath, gutter = 16) {
  const a = await decodeImage(pathA);
  const b = await decodeImage(pathB);
  const W = a.width + gutter + b.width;
  const H = Math.max(a.height, b.height);
  const out = new PNG({ width: W, height: H });
  out.data.fill(0xff); // white
  const blit = (src, dx) => {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const si = (src.width * y + x) << 2;
        const di = (W * y + (x + dx)) << 2;
        out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1];
        out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 0xff;
      }
    }
  };
  blit(a, 0);
  blit(b, a.width + gutter);
  writeFileSync(outPath, PNG.sync.write(out));
}

async function main() {
  const outDir = join(ROOT, "docs/active/work/T-166-01");
  await mkdir(outDir, { recursive: true });

  // ---- asset guard before any spend ----
  for (const p of renderPaths) if (!existsSync(p)) throw new Error(`missing build render: ${p}`);
  for (const c of CONDITIONS) if (!existsSync(join(ROOT, c.concept))) throw new Error(`missing concept: ${c.concept}`);

  // ---- beside-concept renders (no model) — write FIRST so the evidence exists even if the live calls stop ----
  const buildView = join(ROOT, BUILD_DIR, "view-+x+z.png");
  await composeTwo(join(ROOT, CONDITIONS[0].concept), buildView, join(outDir, "clean-vs-matched.png"));
  await composeTwo(join(ROOT, CONDITIONS[1].concept), buildView, join(outDir, "clean-vs-wrongstyle.png"));
  await composeTwo(join(ROOT, CONDITIONS[2].concept), buildView, join(outDir, "clean-vs-wrongstyle-2.png"));
  console.log("[crater] wrote beside-concept PNGs (clean-vs-matched / -wrongstyle / -wrongstyle-2)");

  const renders = await Promise.all(renderPaths.map(toB64));

  const results = [];
  for (const cond of CONDITIONS) {
    const pack = loadStylePack(join(ROOT, cond.pack));
    const concept = await toB64(join(ROOT, cond.concept));
    const args = diagnoseRenderArgs({ program: PROGRAM, pack, azimuths });
    const votes = [];
    for (let v = 0; v < VOTES; v++) {
      const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept, renders } });
      const { text } = await runTieredOp({ tier: TIER, prompt, images });
      const critique = await bamlParse({ fn: "DiagnoseBuild", text });
      const ev = critiqueEvidence(critique);
      votes.push(ev);
      console.log(`[crater] ${cond.key} (${cond.tier}) vote ${v + 1}/${VOTES}: score=${ev.score} nMajor=${ev.nMajor} depts=[${ev.departments.join(",")}]`);
    }
    const scoreMean = Math.round(mean(votes.map((e) => e.score)));
    results.push({ ...cond, style: loadStylePack(join(ROOT, cond.pack)).style, scoreMean, votes });
    console.log(`[crater] ${cond.key}: mean score ${scoreMean}  missing(sample)="${votes[0].missing.slice(0, 3).join(" | ")}"`);
  }

  const scoreOf = (k) => results.find((r) => r.key === k)?.scoreMean ?? null;
  const A = scoreOf("A-matched"), B = scoreOf("B-arc"), B2 = scoreOf("B2-chapelle"), C = scoreOf("C-control");
  const spreads = { "A-B": A - B, "A-B2": A - B2, "A-C": A - C, "B-vs-C (profile effect)": C - B };

  // E-38 scalar baseline for the side-by-side (flat 22–32)
  let e38 = null;
  try { e38 = JSON.parse(readFileSync(join(HERE, "results", "wrong-style-probe.json"), "utf8")); } catch { /* optional */ }

  const NOISE = 12; // the E-38 per-call noise band
  const cratered = A != null && B != null && (A - B) > 2 * NOISE;
  const profileDrivesIt = B != null && C != null && (C - B) > NOISE;
  const verdict = !cratered
    ? "DID NOT CRATER — per-style `expected` is cosmetic; blindness is in the model's reading → deeper-measurement epic"
    : profileDrivesIt
      ? "CRATERED, profile-driven — the per-style `expected` produces the within-family gradient the scalar eval lacked"
      : "CRATERED, concept-image-driven — the gradient exists but the per-style profile adds little beyond the concept image";

  await mkdir(join(HERE, "results"), { recursive: true });
  await writeFile(join(HERE, "results", "clean-wrong-style.json"),
    JSON.stringify({ schema: BAKEOFF_SCHEMA, tier: TIER, votes: VOTES, build: BUILD_DIR, program: "synthetic-gatehouse (fixed)",
      results, spreads, noiseBand: NOISE, cratered, profileDrivesIt, verdict,
      e38Baseline: e38 ? e38.results.map((r) => ({ key: r.key, tier: r.tier, q: r.q })) : "not found" }, null, 2) + "\n");

  console.log("\n================ CRATER VERDICT ================");
  console.log(`A matched=${A}  B arc=${B}  B2 chapelle=${B2}  C control=${C}`);
  console.log(`spread A−B=${A - B}  A−B2=${A - B2}  profile effect C−B=${C - B}  (noise band ±${NOISE})`);
  console.log(`-> ${verdict}`);
  console.log("===============================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
