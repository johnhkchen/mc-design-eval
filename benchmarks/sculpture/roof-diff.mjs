// Roof-region diff runner (T-118-01, story S-118, epic E-30) — the standing instrument beside the
// gate records. `npm run diff:roof [-- --subject <s>] [--path generated|reconstructed] [--repro]`
//
// Per subject × path it loads the committed build + fit records + GLB, runs the PURE core
// (src/view/roof-region-diff.mjs) twice (E-24 Rule 2: the two outputs must be byte-identical,
// sha256 recorded, re-checked by --repro), and writes:
//   roof-diff/<subject>-<path>.json   committed record (per-azimuth region-attributed mismatch +
//                                     ridge/rake height profiles)
//   roof-diff/<subject>-<path>.md     human summary beside the JSON (record-pair convention)
//   roof-diff/<subject>-<path>/*.png  per-view overlay renders (gitignored, regenerable)
//   pr/assets/frames/roof-diff-<subject>-<path>.png  committed contact sheet (4 azimuths)
//
// NO JUDGE RUNS (S-121 owns verdicts), no GL (the pure rasterizer is the lens), no subject keys,
// constants, branches, or thresholds in this file — subjects come from the durable-skin registry;
// params are ROOF_DIFF_DEFAULTS, shared across subjects. A subject/path whose committed inputs are
// absent gets a NAMED skip record — never a silent omission (a subject whose chain has not run).
//
// Gables sources (recorded in each record's `inputs.gablesSource`):
//   generated      — provision-fit.json roofs[].gables (revived; ends already merged by the fit)
//   reconstructed  — gablesFromRecord(components/<s>.json) + accepted end coords from
//                    roof/<s>.json swap.generated.endCoords (the rung the cage accepted);
//                    bandFloor = the roof record's swap.bandFloor

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { voxelSilhouettes } from "../../src/view/shell-regularize.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import {
  ROOF_DIFF_SCHEMA, ROOF_DIFF_DEFAULTS,
  roofRegions, projectRegions, attributeMismatch, roofRegionDiff,
} from "../../src/view/roof-region-diff.mjs";
import { gablesFromRecord } from "../../src/form/roof-fit.mjs";
import { alignedTriangles } from "../../src/form/roof-end-fit.mjs";
import { aabbAlignment } from "../../src/form/component-glb-fit.mjs";
import { parseGlbMesh } from "../../src/form/glb-mesh.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { reviveProvisionFit } from "../../src/form/provision-fit.mjs";
import { runCells } from "../../src/form/component-decompose.mjs";
import { composeSheet, RESEMBLANCE_DEFAULTS } from "../../src/form/resemblance.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "roof-diff");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const PATHS = ["generated", "reconstructed"];
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

// fixed overlay palette (display only — region identity, not data): missing = full, extra = dark
const REGION_COLORS = {
  ridge: [230, 60, 60], ends: [240, 150, 40], eaves: [225, 210, 50],
  slopes: [150, 90, 200], unpartitioned: [220, 70, 180], wall: [120, 120, 120],
};
const MATCH_COLOR = [205, 205, 205];
const SCALE = 4; // 128-grid → 512 panels (the render contract's size)

// --- input loaders (one per path; missing files → named skip) -------------------------------

async function readJson(rel) {
  return JSON.parse(await readFile(join(HERE, rel), "utf8"));
}

function missing(rels) {
  return rels.filter((r) => !existsSync(join(HERE, r)));
}

/** generated path: the provision-fit record carries the gables (ends merged) and mass wallTops. */
async function loadGenerated(def) {
  const buildRel = `generated/${def.key}/artifact.json`;
  const fitRel = `generated/${def.key}/provision-fit.json`;
  const absent = missing([buildRel, fitRel]);
  if (absent.length) return { skip: absent };
  const pf = reviveProvisionFit(await readJson(fitRel));
  const gables = (pf.roofs ?? []).flatMap((r) => r.gables ?? []).filter((g) => g?.sides?.length && g.sane !== false);
  const masses = (pf.masses ?? []).filter((m) => m.wallTop != null);
  const bandFloor = masses.length ? Math.min(...masses.map((m) => m.wallTop)) : null;
  const colTop = new Map();
  for (const m of masses) {
    for (const [x, z] of runCells(m.runs ?? [])) colTop.set(`${x},${z}`, m.wallTop);
  }
  const wallTopOf = colTop.size ? (x, z) => colTop.get(`${x},${z}`) ?? bandFloor : null;
  return {
    buildRel, gables, bandFloor, wallTopOf,
    inputs: { build: buildRel, fitRecord: fitRel, gablesSource: "provision-fit roofs[].gables", bandFloorSource: "provision-fit masses[].wallTop (per-column)" },
  };
}

/** reconstructed path: base gables re-derived from the component record (the same pure call
 *  roof-program makes), accepted end coords merged from the roof record's swap. */
async function loadReconstructed(def) {
  const buildRel = `challenge/${def.key}/artifact.json`;
  const compRel = `components/${def.key}.json`;
  const roofRel = `roof/${def.key}.json`;
  const absent = missing([buildRel, compRel, roofRel]);
  if (absent.length) return { skip: absent };
  const comp = await readJson(compRel);
  if (comp.schema !== "component-record/v1") throw new Error(`${compRel}: unexpected schema ${comp.schema}`);
  const roofRec = await readJson(roofRel);
  const fit = gablesFromRecord(comp);
  const endsById = new Map((roofRec.swap?.generated?.endCoords ?? []).map((e) => [e.id, e]));
  const gables = fit.gables.filter((g) => g.sane !== false).map((g) => {
    const e = endsById.get(g.id);
    if (!e) return g;
    const ends = {};
    if (e.lo) ends.lo = e.lo;
    if (e.hi) ends.hi = e.hi;
    return Object.keys(ends).length ? { ...g, ends } : g;
  });
  return {
    buildRel, gables, bandFloor: roofRec.swap?.bandFloor ?? null, wallTopOf: null,
    inputs: { build: buildRel, componentRecord: compRel, roofRecord: roofRel, gablesSource: "gablesFromRecord(component record) + swap.generated.endCoords", bandFloorSource: "roof record swap.bandFloor" },
  };
}

// --- overlay rendering (display only — the record never depends on these) -------------------

let _canvasPkg = null;
function canvasLib() {
  if (_canvasPkg !== null) return _canvasPkg;
  try {
    _canvasPkg = createRequire(join(ROOT, "render", "src", "headless-canvas.mjs"))("canvas");
  } catch {
    _canvasPkg = false;
  }
  return _canvasPkg;
}

/** Grid-space overlay → RGBA panel (×SCALE nearest): matched grey, missing full region color,
 *  extra dark region color, background white. */
function overlayPanel(field) {
  const G = Math.sqrt(field.nb.data.length) | 0;
  const W = G * SCALE;
  const out = new Uint8Array(W * W * 4).fill(255);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = ((y / SCALE) | 0) * G + ((x / SCALE) | 0);
      const b = field.nb.data[i] ? 1 : 0;
      const r = field.nr.data[i] ? 1 : 0;
      let c = null;
      if (b && r) c = MATCH_COLOR;
      else if (b || r) {
        const name = field.regionOf[i] >= 0 ? field.names[field.regionOf[i]] : "wall";
        const base = REGION_COLORS[name] ?? REGION_COLORS.wall;
        c = b ? base.map((v) => (v * 0.45) | 0) : base; // extra dark, missing full
      }
      if (c) {
        const o = (y * W + x) * 4;
        out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
      }
    }
  }
  return { w: W, h: W, data: out };
}

function encodeLabeledSheet(composed, labels, panelW, gutter, encodeRgbaToPng) {
  const lib = canvasLib();
  if (!lib) return encodeRgbaToPng(composed.data, composed.w, composed.h);
  const barH = 28;
  const c = lib.createCanvas(composed.w, composed.h + barH);
  const ctx = c.getContext("2d");
  const img = new lib.ImageData(new Uint8ClampedArray(composed.data), composed.w, composed.h);
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, composed.h, composed.w, barH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "13px sans-serif";
  ctx.textBaseline = "middle";
  labels.forEach((label, i) => ctx.fillText(label, i * (panelW + gutter) + 8, composed.h + barH / 2, panelW - 16));
  return c.toBuffer("image/png");
}

// --- record assembly --------------------------------------------------------------------------

function summaryMd(subject, path, record) {
  const lines = [`# roof-diff — ${subject} (${path})`, ""];
  if (record.status === "skipped") {
    lines.push(`**SKIPPED** — ${record.reason}`, "");
    return lines.join("\n");
  }
  const d = record.diff;
  lines.push(
    `Band floor ${d.regions.bandFloor}; regions ${JSON.stringify(d.regions.counts)}` +
    (d.regions.fallback ? ` — FALLBACK: ${d.regions.fallback.reason}` : ""),
    "",
    "| view | IoU | mismatch px | top region (px) |",
    "|---|---|---|---|",
  );
  for (const [a, v] of Object.entries(d.views)) {
    const top = Object.entries(v.byRegion).sort((p, q) => (q[1].extra + q[1].missing) - (p[1].extra + p[1].missing))[0];
    lines.push(`| ${a} (${resolveAngle(a).azimuthDeg}°) | ${v.iou} | ${v.mismatchPx} (extra ${v.extra} / missing ${v.missing}) | ${top ? `${top[0]} ${top[1].extra + top[1].missing}` : "—"} |`);
  }
  lines.push("", `Cross-azimuth: ${d.summary.mismatchPx} px, roof share ${d.summary.roofSharePct}%, worst view ${d.summary.worstView}.`, "");
  for (const p of d.profiles) {
    lines.push(`- **${p.gable}** ridge Δ(eave-rel) rmse ${p.ridge.stats.rmse} max ${p.ridge.stats.maxAbs}; rakes: ` +
      p.rakes.map((k) => `${k.end}@${k.at}${k.fitted ? "" : " (unfitted)"} rmse ${k.stats.rmse}`).join(", "));
  }
  lines.push("", `Reproducible: ${record.reproducible.byteIdentical ? "byte-identical ×2" : "DIVERGED"} (sha256 ${record.reproducible.sha256.slice(0, 12)}…).`, "");
  return lines.join("\n");
}

async function runSubjectPath(def, path, { repro }) {
  const slug = `${def.key}-${path}`;
  const loaded = path === "generated" ? await loadGenerated(def) : await loadReconstructed(def);

  if (loaded.skip) {
    let reason = `missing committed inputs: ${loaded.skip.join(", ")}`;
    if (!def.zoneMapRecord || !def.kitRecord) {
      reason += " — first-run bootstrap not landed upstream (registry zone-map/kit pins absent; role-aware zone lens, T-117)";
    }
    const record = { schema: ROOF_DIFF_SCHEMA, subject: def.key, path, status: "skipped", reason };
    await writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(record, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${slug}.md`), summaryMd(def.key, path, record));
    console.log(`[roof-diff] ${slug}: SKIPPED — ${reason}`);
    return { slug, status: "skipped" };
  }

  const buildRaw = await readFile(join(HERE, loaded.buildRel), "utf8");
  const occ = artifactOccupancy(JSON.parse(buildRaw));
  const glbBytes = await readFile(join(HERE, def.glb));
  const mesh = loadMeshFromGlb(glbBytes);
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });
  const meshTris = parseGlbMesh(glbBytes);
  const aTris = alignedTriangles(meshTris, aabbAlignment(meshTris.bounds, occ.bounds));

  // the pure core, twice (determinism is part of the record)
  const measure = () => roofRegionDiff({ occ, gables: loaded.gables, refSils, aTris, bandFloor: loaded.bandFloor, wallTopOf: loaded.wallTopOf });
  const diff = measure();
  const diffJson = JSON.stringify(diff);
  const byteIdentical = diffJson === JSON.stringify(measure());
  const diffSha = sha256(diffJson);

  if (repro) {
    const recPath = join(OUT_DIR, `${slug}.json`);
    if (!existsSync(recPath)) throw new Error(`--repro: no committed record at roof-diff/${slug}.json`);
    const committed = JSON.parse(await readFile(recPath, "utf8"));
    const ok = committed.reproducible?.sha256 === diffSha && byteIdentical;
    console.log(`[roof-diff] ${slug}: repro ${ok ? "PASS" : "FAIL"} (committed ${committed.reproducible?.sha256?.slice(0, 12)}…, recomputed ${diffSha.slice(0, 12)}…)`);
    return { slug, status: ok ? "repro-pass" : "repro-fail" };
  }

  const record = {
    schema: ROOF_DIFF_SCHEMA,
    subject: def.key,
    path,
    status: "measured",
    inputs: { ...loaded.inputs, buildSha256: sha256(buildRaw), glb: def.glb, gableCount: loaded.gables.length },
    params: {
      ...ROOF_DIFF_DEFAULTS, precedence: [...ROOF_DIFF_DEFAULTS.precedence],
      azimuths: [...MULTI_ANGLE_GATE.azimuths],
      note: "shared across subjects — no tuning; azimuths config-frozen; attribution is nearest projected exposed cell (evidence, not a gate)",
    },
    diff,
    reproducible: { runs: 2, byteIdentical, sha256: diffSha },
    renders: {
      views: MULTI_ANGLE_GATE.azimuths.map((a) => `roof-diff/${slug}/view-${a}.png`),
      sheet: `pr/assets/frames/roof-diff-${slug}.png`,
      legend: "missing (GLB∖build) = full region color; extra (build∖GLB) = dark region color; matched = grey",
    },
  };

  // overlays (display only): re-derive per-view fields through the same exported pieces
  const { encodeRgbaToPng } = await import("../../render/src/headless-canvas.mjs");
  const regions = roofRegions(loaded.gables, occ, { bandFloor: loaded.bandFloor });
  const buildSils = voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);
  const viewDir = join(OUT_DIR, slug);
  await mkdir(viewDir, { recursive: true });
  const panels = [];
  const labels = [];
  for (const a of MULTI_ANGLE_GATE.azimuths) {
    const points = projectRegions(regions, occ, resolveAngle(a), { width: buildSils[a].w, height: buildSils[a].h, wallTopOf: loaded.wallTopOf });
    const att = attributeMismatch({ buildSil: buildSils[a], refSil: refSils[a], points, withField: true });
    const panel = overlayPanel(att.field);
    panels.push(panel);
    labels.push(`${a} (${resolveAngle(a).azimuthDeg}°)  IoU ${att.iou}  miss ${att.missing}px / extra ${att.extra}px`);
    await writeFile(join(viewDir, `view-${a}.png`), encodeRgbaToPng(panel.data, panel.w, panel.h));
  }
  const composed = composeSheet(panels, { gutter: RESEMBLANCE_DEFAULTS.gutter });
  await mkdir(FRAMES_DIR, { recursive: true });
  await writeFile(join(FRAMES_DIR, `roof-diff-${slug}.png`), encodeLabeledSheet(composed, labels, panels[0].w, RESEMBLANCE_DEFAULTS.gutter, encodeRgbaToPng));

  await writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${slug}.md`), summaryMd(def.key, path, record));

  const s = diff.summary;
  console.log(`[roof-diff] ${slug}: ${s.mismatchPx}px mismatch, roof share ${s.roofSharePct}%, worst ${s.worstView}` +
    `${byteIdentical ? "" : " — WARNING: double-run diverged"}`);
  return { slug, status: "measured" };
}

// --- CLI ----------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const onlySubject = argOf("--subject");
const onlyPath = argOf("--path");
const repro = argv.includes("--repro");

if (onlyPath && !PATHS.includes(onlyPath)) throw new Error(`--path must be one of ${PATHS.join("|")}`);
if (onlySubject && !SUBJECTS[onlySubject]) throw new Error(`--subject must be one of ${Object.keys(SUBJECTS).join("|")}`);

await mkdir(OUT_DIR, { recursive: true });
const results = [];
for (const def of Object.values(SUBJECTS)) {
  if (onlySubject && def.key !== onlySubject) continue;
  for (const path of PATHS) {
    if (onlyPath && path !== onlyPath) continue;
    results.push(await runSubjectPath(def, path, { repro }));
  }
}
const failed = results.filter((r) => r.status === "repro-fail");
console.log(`[roof-diff] done: ${results.map((r) => `${r.slug}=${r.status}`).join(", ")}`);
if (failed.length) process.exit(1);
