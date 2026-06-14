// Palette-aware concept A/B (T-040-01 / S-040 / E-14) — the concept end of the co-design loop.
//
// For each subject (moai + one organic), this:
//   1. reads the E-13 run's artifact.json → resolveValueTruePalette → a value-honest card,
//   2. renders the card to a swatch grid PNG (the REAL block values; reuses E-10 renderGridSwatch),
//   3. generates a .v2 concept (SculptureConceptPromptV2, value-matched to the swatch) via Nano
//      Banana PRO, attaching the swatch grid as a multimodal input,
//   4. copies the run's existing .v1 concept.png (also PRO) as the control arm,
//   5. writes a per-subject ab.json (card + L* stats + paths).
//
// LIVE & METERED: 2 Nano Banana PRO image calls (one per subject). The .v1 arm is free (on disk);
// design docs are reused (no claude -p). Same model + same doc + same target_blocks for both arms —
// the ONLY change is the swatch grid + value instruction (spec §7). Needs GEMINI_API_KEY.
//
//   node benchmarks/sculpture/concept-ab.mjs            # live A/B → docs/active/work/T-040-01/
//   node benchmarks/sculpture/concept-ab.mjs --dry      # deterministic half only (no Nano Banana)

import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { resolveValueTruePalette } from "../../src/color/value-palette.mjs";
import { buildPaletteSwatch } from "../../src/color/palette-swatch.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const OUT = join(HERE, "../../docs/active/work/T-040-01");

const SUBJECTS = [
  { key: "moai", run: "001-vConcept-moai", scale: 32 },
  { key: "pineapple", run: "013-vConcept-a-pineapple", scale: 48 },
];

const DRY = process.argv.includes("--dry");

// Shell out to the tsx BAML concept stage (mirrors run.mjs's runBamlConcept; local copy by design —
// this live runner stays off the unit-test path).
function runBamlConcept(input) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(HERE, "baml-concept.mts")], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-concept exited ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`baml-concept: unparseable output (${e.message})\n${out.slice(0, 400)}`));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

// Encode an RGBA swatch buffer to a PNG file (lazy pngjs — devDep, off the core path).
async function writeSwatchPng(swatch, path) {
  const { PNG } = await import("pngjs");
  const png = new PNG({ width: swatch.width, height: swatch.height });
  png.data = Buffer.from(swatch.data.buffer, swatch.data.byteOffset, swatch.data.byteLength);
  writeFileSync(path, PNG.sync.write(png));
}

function valueStats(card) {
  const ls = card.map((c) => c.value);
  return {
    meanL: Math.round((ls.reduce((a, b) => a + b, 0) / ls.length) * 10) / 10,
    minL: Math.min(...ls),
    maxL: Math.max(...ls),
  };
}

async function main() {
  if (!DRY && !process.env.GEMINI_API_KEY && !existsSync(join(HERE, "../../.env"))) {
    console.error("GEMINI_API_KEY not set (env or .env) — re-run with --dry for the offline half.");
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  console.log(`palette-aware concept A/B (${DRY ? "DRY — no Nano Banana" : "LIVE — Nano Banana PRO"})\n`);

  for (const s of SUBJECTS) {
    const runDir = join(RUNS_DIR, s.run);
    const artifact = JSON.parse(readFileSync(join(runDir, "artifact.json"), "utf8"));
    const { card, snappedCount, manifest } = resolveValueTruePalette(artifact);
    const { swatch, legend, cols, rows } = buildPaletteSwatch(card);

    const swatchPath = join(OUT, `${s.key}.swatch.png`);
    await writeSwatchPng(swatch, swatchPath);

    console.log(`▸ ${s.key} (${s.run}) — ${card.length} blocks, ${snappedCount} snapped, swatch ${cols}×${rows}`);
    console.log(legend.split("\n").map((l) => "    " + l).join("\n"));

    // Control arm — the existing .v1 concept (already PRO).
    const v1Path = join(OUT, `${s.key}.v1.png`);
    copyFileSync(join(runDir, "concept.png"), v1Path);

    const ab = {
      subject: s.key,
      run: s.run,
      schema: "concept-ab/v1",
      blocks: card.length,
      snappedCount,
      manifest,
      valueStats: valueStats(card),
      card,
      paths: { v1: `${s.key}.v1.png`, v2: `${s.key}.v2.png`, swatch: `${s.key}.swatch.png` },
    };

    if (!DRY) {
      // Experimental arm — .v2 value-matched concept, swatch grid attached as a multimodal input.
      const v2Path = join(OUT, `${s.key}.v2.png`);
      const res = await runBamlConcept({
        designDocPath: join(runDir, "design-doc.md"),
        images: [swatchPath],
        targetBlocks: s.scale,
        model: "pro",
        variant: "v2",
        paletteSwatches: legend,
        outPath: v2Path,
      });
      ab.v2gen = { model: res.model, ms: res.ms, promptChars: res.promptChars, imageCount: res.imageCount };
      console.log(`    .v2 concept: ${res.model}, ${res.ms}ms, ${res.imageCount} img attached → ${s.key}.v2.png`);
    } else {
      console.log(`    [dry] skipped .v2 Nano Banana call`);
    }

    writeFileSync(join(OUT, `${s.key}.ab.json`), JSON.stringify(ab, null, 2) + "\n");
    console.log(`    wrote ${s.key}.ab.json + ${s.key}.swatch.png + ${s.key}.v1.png\n`);
  }
  console.log(`done → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
