// E-09 stage-1 concept-art series orchestrator. For each reference × variant, generate a
// concept image via baml-concept.mts (BAML-composed prompt → Nano Banana). Eyeball-only this
// phase — outputs land in concepts/<ref>-<variant>-<model>.png for side-by-side review.
//
//   node benchmarks/temple-facade/conceptart.mjs --variant A          # all refs, variant A
//   node benchmarks/temple-facade/conceptart.mjs --variant B --ref taj
//   node benchmarks/temple-facade/conceptart.mjs --variant C --pro
//
// Variants (what's attached to Nano Banana, in order):
//   A    = [reference]            reference photo as inspiration only (fresh generation)
//   B    = [reference, ourRender] everything: reference for inspiration + our prismarine render to refine
//   C    = [ourRender]            upscale: refine our blocky render into a clean concept
//   base = []                     design-doc only (no image)

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(HERE, "concepts"), { recursive: true });

const TARGET_BLOCKS = 48; // held CONSTANT across this series (resolution is not the variable)

// reference → its grounded design doc + our prior prismarine render (champion-era runs)
const REFS = {
  taj: { ref: "references/taj_mahal.png", run: "015" },
  horyuji: { ref: "references/horyu_ji.JPG", run: "019" },
  chapelle: { ref: "references/St_Chapelle.png", run: "020" },
  arc: { ref: "references/arc_de_triomph.JPG", run: "021" },
  mausoleum: { ref: "references/sys_mausoleum.JPG", run: "022" },
};
const docPath = (run) => `benchmarks/temple-facade/runs/${run}-vRefRevise-designdoc/design-doc.md`;
const renderPath = (run) => `benchmarks/temple-facade/runs/${run}-vRefRevise-designdoc/render.png`;

const REF_ONLY =
  "A reference photograph of a real building is attached as INSPIRATION ONLY — borrow its proportion, " +
  "rhythm, and character, but do NOT copy it literally and do NOT adopt its colors; the document's palette wins.";
const REF_PLUS_RENDER =
  "TWO images are attached: (1) a real-building reference photo — INSPIRATION ONLY for proportion, rhythm, " +
  "and character (do not copy it or its colors); (2) a rough, low-detail Minecraft render of the CURRENT " +
  "build of this very design — REFINE it: keep its design, massing, and palette, but sharpen the massing, " +
  "fix flaws, and make it clean and cleanly-segmentable. The document's palette wins.";
const RENDER_ONLY =
  "An image is attached: a rough, low-detail Minecraft render of the CURRENT build of this design. REFINE " +
  "it into a polished, cleanly-segmentable concept that keeps its design, massing, and palette and fixes " +
  "its flaws — true to the document.";
const NONE = "No image is attached — design purely from the document above.";

const VARIANTS = {
  A: (r) => ({ images: [r.ref], attached: REF_ONLY }),
  B: (r) => ({ images: [r.ref, renderPath(r.run)], attached: REF_PLUS_RENDER }),
  C: (r) => ({ images: [renderPath(r.run)], attached: RENDER_ONLY }),
  base: () => ({ images: [], attached: NONE }),
};

function runCell(job) {
  return new Promise((resolve, reject) => {
    const c = spawn("npx", ["tsx", join(HERE, "baml-concept.mts")], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.on("error", reject);
    c.on("close", (code) => (code === 0 ? resolve(JSON.parse(out)) : reject(new Error(`cell exit ${code}`))));
    c.stdin.end(JSON.stringify(job));
  });
}

const argv = process.argv.slice(2);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : (argv.includes(`--${k}`) ? true : d); };
const model = arg("pro", false) ? "pro" : "flash";
const variant = arg("variant", "A");
const only = arg("ref", null);
if (!VARIANTS[variant]) { console.error(`unknown --variant ${variant} (A|B|C|base)`); process.exit(1); }

for (const [name, r] of Object.entries(REFS)) {
  if (only && name !== only) continue;
  const { images, attached } = VARIANTS[variant](r);
  const outPath = `benchmarks/temple-facade/concepts/${name}-${variant}-${model}.png`;
  process.stdout.write(`${name} [${variant}/${model}] ... `);
  try {
    const res = await runCell({ designDocPath: docPath(r.run), images, targetBlocks: TARGET_BLOCKS, model, outPath, attached });
    console.log(`ok ${res.ms}ms (${res.imageCount} img, ${res.promptChars} chars) → ${outPath}`);
  } catch (e) {
    console.log("FAILED:", e.message);
  }
}
