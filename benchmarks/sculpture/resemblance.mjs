// IMPURE RUNNER — the E-22 resemblance gate (S-076 / T-076-01). Assembles the TRIPTYCH a human inspects
// (concept | mesh | minecraft), computes the DIAGNOSTIC perceptual row, and runs the metered categorical
// judge → a 3-way verdict + a NAMED gap. The references (concept image + GLB mesh) are IMMUTABLE inputs
// (Rule 1); the triptych is the verdict, the scores explain it (Rule 2); the judge prompt + thresholds are
// fixed in resemblance.mjs (Rule 5); the gap is named, not hidden (Rule 7).
//
// PURITY: the scorer + triptych math + judge prompt/parser are the pure core (src/form/resemblance.mjs,
// unit-tested). This file owns the impure edges only — GL re-render, image decode/encode, the metered
// `claude -p` judge call, label drawing, file I/O. NOT unit-tested (the suite must never pull GL / the
// model); verified by `--offline` (GL- and model-free) + the committed outputs. `runResemblanceGate` is the
// reusable entry S-077 calls per subject.
//
//   node benchmarks/sculpture/resemblance.mjs                 # live: fixed-lens re-render + metered judge
//   node benchmarks/sculpture/resemblance.mjs --offline       # GL-free + model-free: committed render, no judge
//   node benchmarks/sculpture/resemblance.mjs --subject gatehouse

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

import {
  resemblanceRow,
  resampleRgba,
  silhouetteToRgba,
  composeTriptych,
  buildResemblancePrompt,
  parseResemblanceVerdict,
  RESEMBLANCE_DEFAULTS,
  RESEMBLANCE_VERDICT_SCHEMA,
} from "../../src/form/resemblance.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";
import { BUILDING_VIEW_3Q } from "../../src/building.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const GLB_DIR = join(HERE, "glb");
const OUT_DIR = join(HERE, "resemblance");

// node-canvas only resolves from the render package; require it via the render package's location so the
// runner can draw panel labels (cosmetic). Falls back to label-free encode if unavailable.
let _canvasPkg = null;
function canvasLib() {
  if (_canvasPkg) return _canvasPkg;
  try {
    const requireFromRender = createRequire(join(REPO, "render", "src", "headless-canvas.mjs"));
    _canvasPkg = requireFromRender("canvas");
  } catch {
    _canvasPkg = false;
  }
  return _canvasPkg;
}

// The immutable-reference registry (Rule 1). Each subject names its concept image, GLB mesh, build artifact,
// and a committed (pre-lens-fix) render for the --offline path. Paths are relative to the sculpture root
// (HERE). The four E-22 headline subjects: gatehouse + cottage (buildings) and moai + pineapple (the two
// sculpture form-type poles — angular fine-relief vs organic textured). Concept→GLB mapping per glb/README.md.
const SUBJECTS = {
  gatehouse: {
    key: "gatehouse",
    glb: "stone-gatehouse.glb",
    concept: "runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
    // the E-24 durable skin (T-089-01, end-to-end pipeline output) + the refreshed fixed-lens render
    artifact: "durable-skin/gatehouse/artifact.json",
    committedRender: "resemblance/gatehouse-minecraft.png",
  },
  cottage: {
    key: "cottage",
    glb: "cottage.glb",
    concept: "runs/014-vConcept-a-cottage/concept.png",
    // the E-24 durable skin (T-089-01, end-to-end pipeline output) + the refreshed fixed-lens render
    artifact: "durable-skin/cottage/artifact.json",
    committedRender: "resemblance/cottage-minecraft.png",
  },
  moai: {
    key: "moai",
    glb: "moai.glb",
    concept: "runs/003-vConcept-a-moai-statue/concept.png",
    artifact: "e19-build/moai/artifact.json",
    committedRender: "e19-build/moai/render-3q.png",
  },
  pineapple: {
    key: "pineapple",
    glb: "pineapple.glb",
    concept: "runs/004-vConcept-a-pineapple/concept.png",
    artifact: "e19-build/pineapple/artifact.json",
    committedRender: "e19-build/pineapple/render-3q.png",
  },
};

/** Resolve a SUBJECTS entry's relative paths against the sculpture root → absolute paths for the runner. */
function resolveSubject(def) {
  return {
    subject: def.key,
    conceptPath: join(HERE, def.concept),
    glbPath: join(GLB_DIR, def.glb),
    artifactPath: join(HERE, def.artifact),
    committedRenderPath: join(HERE, def.committedRender),
  };
}

async function readJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

/** Compose the triptych RGBA (pure) and encode to PNG, drawing panel labels when node-canvas is available. */
function encodeTriptych(panels, labels) {
  const P = RESEMBLANCE_DEFAULTS.panel;
  const composed = composeTriptych(panels, { gutter: RESEMBLANCE_DEFAULTS.gutter });
  const lib = canvasLib();
  if (!lib) return { buf: encodeRgbaToPng(composed.data, composed.w, composed.h), labeled: false };

  const barH = 28;
  const c = lib.createCanvas(composed.w, composed.h + barH);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, composed.w, composed.h + barH);
  // paste the composed RGBA below the label bar
  const imgData = ctx.createImageData(composed.w, composed.h);
  imgData.data.set(composed.data);
  ctx.putImageData(imgData, 0, barH);
  // labels, centered over each panel
  ctx.fillStyle = "#202020";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((label, i) => {
    const cx = i * (P + RESEMBLANCE_DEFAULTS.gutter) + P / 2;
    ctx.fillText(label, cx, barH / 2);
  });
  return { buf: c.toBuffer("image/png"), labeled: true };
}

/**
 * THE GATE (reusable; S-077 calls this per subject). References passed as IMMUTABLE inputs (Rule 1).
 * @param {{subject:string, conceptPath:string, glbPath:string, artifactPath:string,
 *          committedRenderPath?:string, outDir?:string, offline?:boolean, samples?:number}} p
 */
export async function runResemblanceGate(p) {
  const { subject, conceptPath, glbPath, artifactPath, committedRenderPath, offline = false } = p;
  const outDir = p.outDir ?? OUT_DIR;
  await mkdir(outDir, { recursive: true });

  if (!existsSync(conceptPath)) throw new Error(`concept image absent: ${conceptPath} (immutable reference — Rule 1)`);
  if (!existsSync(artifactPath)) throw new Error(`build artifact absent: ${artifactPath}`);

  const blockTable = loadBlockTable();
  const artifact = await readJson(artifactPath);

  // --- mesh reference silhouette (CPU, GL-free) ---
  let meshSil = null;
  if (existsSync(glbPath)) {
    meshSil = rasterizeSilhouette(loadMeshFromGlb(await readFile(glbPath)), { view: BUILDING_VIEW_3Q });
  } else {
    console.error(`WARN: GLB absent (${glbPath}) — gitignored; provision via T-067 / trellis-glb.mjs. ` +
      `Mesh panel + meshIoU will be omitted.`);
  }

  // --- minecraft render at the fixed lens ---
  let renderPath;
  if (offline) {
    renderPath = committedRenderPath;
    if (!renderPath || !existsSync(renderPath)) throw new Error(`--offline needs a committed render: ${renderPath}`);
    console.error(`offline: using committed render ${renderPath} (no GL re-render, no judge)`);
  } else {
    const { renderArtifact } = await import("../../render/src/render-tool.mjs");
    renderPath = join(outDir, `${subject}-minecraft.png`);
    await renderArtifact(artifact, { outPath: renderPath, view: BUILDING_VIEW_3Q });
  }

  const renderImg = await decodeImage(renderPath);
  const conceptImg = await decodeImage(conceptPath);

  // --- perceptual row (DIAGNOSTIC, Rule 2) ---
  const references = { concept: conceptPath, glb: existsSync(glbPath) ? glbPath : null };
  const row = resemblanceRow({ renderImg, conceptImg, meshSil, artifact, blockTable, subject, references });
  await writeFile(join(outDir, `${subject}-perceptual.json`), JSON.stringify(row, null, 2) + "\n");

  // --- triptych (the verdict a human inspects, Rule 2) ---
  const P = RESEMBLANCE_DEFAULTS.panel;
  const conceptPanel = resampleRgba(conceptImg, P, P, "aspect");
  const renderPanel = resampleRgba(renderImg, P, P, "aspect");
  const meshPanel = meshSil
    ? resampleRgba(silhouetteToRgba(meshSil), P, P, "aspect")
    : { w: P, h: P, data: solidPanel(P, [235, 235, 235, 255]) }; // placeholder when GLB absent
  const { buf: triptychBuf, labeled } = encodeTriptych([conceptPanel, meshPanel, renderPanel], ["concept", "mesh", "minecraft"]);
  const triptychPath = join(outDir, `${subject}-triptych.png`);
  await writeFile(triptychPath, triptychBuf);

  // --- categorical judge (metered; skipped offline) ---
  let verdict;
  if (offline) {
    verdict = { schema: RESEMBLANCE_VERDICT_SCHEMA, verdict: "(not run)", gap: null, rationale: "offline: metered judge not called", judge: null };
  } else {
    verdict = await runJudge(triptychBuf, p.samples);
  }
  await writeFile(join(outDir, `${subject}-verdict.json`), JSON.stringify(verdict, null, 2) + "\n");

  // --- human summary ---
  await writeFile(join(outDir, `${subject}-resemblance.md`), renderSummaryMd({ subject, row, verdict, triptychPath, labeled, offline }));

  console.error(`resemblance[${subject}]: form meshIoU=${row.form.meshIoU} conceptIoU=${row.form.conceptIoU} · ` +
    `material set=${row.material.set.score} zone=${row.material.zone.score} · verdict=${verdict.verdict}` +
    (verdict.gap ? ` · gap=${verdict.gap.attribute}@${verdict.gap.region}` : ""));
  return { row, verdict, triptychPath };
}

function solidPanel(P, c) {
  const d = new Uint8Array(P * P * 4);
  for (let i = 0; i < P * P; i++) { const o = i << 2; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c[3]; }
  return d;
}

/** Metered categorical judge: one `claude -p` call over the triptych → parsed verdict. The METERED seam. */
async function runJudge(triptychBuf) {
  const { requestTextWithImage } = await import("../../src/sdk-binding.mjs");
  const prompt = buildResemblancePrompt();
  const { text, raw } = await requestTextWithImage({
    prompt,
    images: [{ data: triptychBuf, mediaType: "image/png" }],
    model: PHASE1_MODEL_ID,
  });
  const usage = raw?.usage
    ? { input_tokens: raw.usage.input_tokens, output_tokens: raw.usage.output_tokens, cost_usd: raw.total_cost_usd ?? null }
    : null;
  try {
    return { ...parseResemblanceVerdict(text), judge: { model: PHASE1_MODEL_ID, usage } };
  } catch (e) {
    console.error(`judge: unparsed verdict — ${e.message}`);
    return { schema: RESEMBLANCE_VERDICT_SCHEMA, verdict: "unparsed", gap: null, rationale: e.message, raw: text?.slice(0, 400), judge: { model: PHASE1_MODEL_ID, usage } };
  }
}

function renderSummaryMd({ subject, row, verdict, triptychPath, labeled, offline }) {
  const f = row.form, s = row.material.set, z = row.material.zone;
  const rel = triptychPath.replace(REPO + "/", "");
  const gapLine = verdict.gap ? `**${verdict.gap.attribute}** — _${verdict.gap.region}_` : "_(none)_";
  return [
    `# Resemblance gate — ${subject} (T-076-01)`,
    "",
    "The E-22 gate: does the build LOOK LIKE its immutable references? The **triptych is the verdict a human",
    "inspects** (Rule 2); the perceptual numbers below only EXPLAIN it.",
    "",
    `## Triptych (the verdict) — \`concept | mesh | minecraft\`${labeled ? " (labeled)" : " (fixed left→right order)"}`,
    "",
    `![triptych](${rel.split("/").pop()})  \`${rel}\``,
    "",
    "## Categorical judge" + (offline ? " — _offline: not run_" : " (metered)"),
    "",
    `- **verdict:** \`${verdict.verdict}\``,
    `- **named gap (Rule 7):** ${gapLine}`,
    `- **rationale:** ${verdict.rationale || "—"}`,
    "",
    "## Perceptual diagnostics (Rule 2 — NOT the verdict)",
    "",
    "| axis | value | reads against |",
    "| ---- | ----- | ------------- |",
    `| form IoU (vs mesh) | ${fmt(f.meshIoU)} | the 3-D form reference |`,
    `| form IoU (vs concept) | ${fmt(f.conceptIoU)} | the concept (approx. 3/4 view) |`,
    `| material set agreement | ${fmt(s.score)} | same materials at all? (0..1) |`,
    `| material zone agreement | ${fmt(z.score)} | materials in the same places? (0..1) |`,
    `| mean zone ΔE | ${fmt(z.meanDeltaE)} | per-cell Lab drift (lower better) |`,
    "",
    `Build dominant blocks: ${s.build.map((b) => `${b.block}×${b.count}`).join(", ") || "—"}.`,
    `Concept snapped blocks: ${s.concept.join(", ") || "—"}.`,
    "",
    "> Honesty: concept is an APPROXIMATE 3/4 view (camera mismatch depresses IoU/zone ΔE); zoning is read",
    "> from render pixels, not 3-D block positions. These are diagnostic — the triptych + judge are the verdict.",
    "",
  ].join("\n");
}
const fmt = (v) => (v == null ? "—" : String(v));

function parseArgs(argv) {
  const offline = argv.includes("--offline");
  const i = argv.indexOf("--subject");
  const subject = i >= 0 && argv[i + 1] ? argv[i + 1] : "gatehouse";
  return { offline, subject };
}

async function main() {
  const { offline, subject } = parseArgs(process.argv.slice(2));
  const def = SUBJECTS[subject];
  if (!def) throw new Error(`unknown subject "${subject}" (known: ${Object.keys(SUBJECTS).join(", ")})`);
  await runResemblanceGate({ ...resolveSubject(def), offline });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("resemblance gate failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { SUBJECTS, resolveSubject };
