// IMPURE RUNNER — E-24 durable consolidation (S-089 / T-089-01). THE DURABLE RULE: a result the pipeline
// can't reproduce is not a result. The four E-24 stages landed as separate per-ticket runners whose
// on-disk records chain by hand (spray:paint → value:select / pattern:cottage fork — no artifact is
// simultaneously value-true AND patterned); this runner composes their PURE CORES end-to-end, per
// subject, in ONE named command:
//
//   value-true selection (T-086) → seal (S-084) → CONCEPT-DERIVED ZONE MAP (T-092: bands + dominants
//   read from the concept aligned to floor-lines; the registry prior is a recorded fallback) →
//   full-shell zone-fill base coat (T-085, skin upgraded to "exposure" by T-090) → secondaries splat
//   (E-23, zone-gated, dominants excluded) → coherent surface (T-087: course basin-fill + stray-salt
//   strip) → coverage-aware gate (T-088, terminal THROW)
//
// Value-true runs FIRST (a palette transform): selection happens in the ORIGINAL name space (the named
// block must locate its own concept region — the T-086 locator), then the substitution renames the
// build + the zone policy once, so every later stage (fill dominants, concept quantize, splat palettes,
// coverage gate) operates in the shipped palette with no translation layer at the end.
//
// DETERMINISM (E-24 Rule 2): no LLM call is on this path — the concept PNG and the material-map roles
// are committed upstream artifacts (frozen data), spray-paint's --refine stub is not carried over, and
// every stage is a pure function of the committed inputs. The deterministic core runs TWICE per live
// invocation and the two artifacts must be byte-identical (recorded as reproducible + a sha256 of the
// written artifact, re-checked by --offline). GL renders are evidence, never inputs to a decision.
//
// THE SEAM INVARIANT: everything that transforms the build is a unit-tested pure core under src/; this
// file is impure wiring only (file I/O, GL renders, frame copies, the durable record). Mirrors
// spray-paint.mjs / value-select.mjs / surface-pattern.mjs — which stay untouched as the per-ticket
// measurement records (T-090-01 owns spray-paint.mjs concurrently).
//
// GL — run on demand, NOT in `npm test`:
//   npm run skin:cottage                # the full pipeline + renders + frames
//   npm run skin:gatehouse
//   npm run skin:cottage -- --offline   # re-assert the committed record + artifact hash, no GL/decode
//
// Writes durable-skin/<subj>.{json,md} (committed) + durable-skin/<subj>/artifact.json (the final
// skinned build) + PNGs (gitignored) + pr/assets/frames/durable-<subj>-{before,after,strip}.png
// (committed evidence frames).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { projectSurface } from "../../src/view/surface-grid.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { sealRoof, sealWalls, applyDeltas } from "../../src/view/surface-coherence.mjs";
import {
  zoneFill, surfaceZoneHistogram, dominantCoverage, exposedVoxelEntries,
} from "../../src/view/zone-fill.mjs";
import { extractConceptZoneMap } from "../../src/color/band-profile.mjs";
import { layerCounts, zonesFromBands, diffZoneMaps } from "../../src/view/zone-map.mjs";
import { quantizeToFace, bareList } from "../../src/view/reference-quantize.mjs";
import { loadGlbSplat, resampleBlockGrid } from "../../src/view/glb-splat.mjs";
import { paintFace, mergePaints, applyPaint } from "../../src/view/face-paint.mjs";
import { allowedPalette } from "../../src/view/palette-cans.mjs";
import { regularizeRoofCourses, stripStraySalt } from "../../src/view/surface-pattern.mjs";
import { planCensusZoneOf, programConformance } from "../../src/view/component-plan.mjs";
import {
  faceResemblance, coverageGate, DEFAULT_COVERAGE_THRESHOLD,
} from "../../src/view/face-resemblance.mjs";
import {
  SAMPLE_GRID_N, estimateBorderColor, sampleRoleSwatches, selectValueTrueMap,
} from "../../src/color/value-select.mjs";
import { gridFromPixels } from "../../src/color/image-grid.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";
import { paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { resampleRgba, composeTriptych, RESEMBLANCE_DEFAULTS } from "../../src/form/resemblance.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "durable-skin");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const COVERAGE_THRESHOLD = DEFAULT_COVERAGE_THRESHOLD; // T-088: the dominant is actually dominant
const ROOF_BAND_TARGET = 0.9;   // T-090 band evidence: roof reads >= 90% roof materials on the shell
const UPPER_RESIDUE_MAX = 0.05; // and the upper band's displaced-field residue is bounded
const MIN_KEEP = 3, MIN_EXTENT = 3; // T-087 salt-strip shape rule
const OBLIQUE_ANGLE = "-x-z";   // azimuth 225° — the angle the projection-skin fill failed on (T-090)

// THE SUBJECT REGISTRY. Policies are written in the NAMED (pre-substitution) block space of each
// subject's E-21 material map and mapped through the value-true substitution at exactly one point
// (mapPolicy). T-092: the zone map is DERIVED FROM THE CONCEPT by default (band-profile +
// zonesFromBands); `policy` is the recorded FALLBACK prior — used only when the concept region is
// unreadable (recorded, never overriding a readable concept) and as the diff baseline / the legacy
// replay's zone source. `zoneMapRecord` = the committed zone-map/v1 record (npm run zone:map) —
// agreement asserted like valueSelectRecord. `legacy` = the would-have-been E-23 splat-only palettes
// (dominants included) — replayed solely as the before-baseline; for the gatehouse no E-23 skin ever
// shipped, so the replay is the honest counterfactual, labeled as such in the record.
// `plasterInvariant` (cottage) names the block that must appear ONLY on zones whose policy includes
// it (T-079-02 guard generalized; vacuous where null).
export const SUBJECTS = {
  cottage: {
    key: "cottage",
    build: "concept-materials/cottage/after-artifact.json",
    concept: "runs/014-vConcept-a-cottage/concept.png",
    glb: "glb/cottage.glb",
    map: "material-map/cottage.json",
    valueSelectRecord: "value-select/cottage.json", // T-086's committed result — agreement asserted
    zoneMapRecord: "zone-map/cottage.json", // T-092's committed result — agreement asserted
    kitRecord: "kit/cottage.json", // T-096's recognized kit — verified overrides beat the snap
    policy: { // FALLBACK PRIOR (spray-paint.mjs ZONE_POLICY verbatim, incl. the T-090 gable-framing preserve)
      base: {
        dominant: "stone_bricks",
        preserve: ["cobblestone", "dark_oak_log"],
        splat: ["cobblestone", "dark_oak_log"],
      },
      upper: {
        dominant: "white_terracotta",
        preserve: ["dark_oak_log", "spruce_planks", "dark_oak_planks"],
        splat: ["dark_oak_log"],
      },
      roof: {
        dominant: "spruce_planks",
        preserve: ["dark_oak_planks", "cobblestone", "bricks", "dark_oak_log"],
        splat: ["dark_oak_planks", "cobblestone", "bricks"],
      },
    },
    legacy: {
      base: ["stone_bricks", "cobblestone", "dark_oak_log"],
      upper: ["white_terracotta", "dark_oak_log", "stone_bricks"],
      roof: ["spruce_planks", "dark_oak_planks", "cobblestone", "bricks"],
    },
    plasterInvariant: "white_terracotta",
    frontDir: "+z", sideDir: "+x",
  },
  gatehouse: {
    key: "gatehouse",
    build: "concept-materials/gatehouse/after-artifact.json",
    concept: "runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
    glb: "glb/stone-gatehouse.glb",
    map: "material-map/gatehouse.json",
    valueSelectRecord: null, // no committed T-086 record — this run IS the gatehouse value-true result
    zoneMapRecord: "zone-map/gatehouse.json", // T-092's committed result — agreement asserted
    kitRecord: "kit/gatehouse.json", // T-096's recognized kit — verified overrides beat the snap
    policy: { // FALLBACK PRIOR, from material-map/gatehouse.json roles (1:1 rule→block, the E-21 "restored" case)
      base: {
        dominant: "stone_bricks",                                        // smooth coursed wall field
        preserve: ["cobblestone", "dark_oak_log", "dark_oak_planks"],    // corners + arch ring + door leaf
        splat: ["cobblestone", "dark_oak_log", "dark_oak_planks"],
      },
      upper: {
        dominant: "stone_bricks",                                        // same field — single-material body
        preserve: ["cobblestone"],                                       // the under-eave rough band
        splat: ["cobblestone"],
      },
      roof: {
        dominant: "deepslate_tiles",                                     // uniform dark tile slope
        preserve: [],                                                    // anything else on the roof is salt
        splat: [],
      },
    },
    legacy: {
      base: ["stone_bricks", "cobblestone", "dark_oak_log", "dark_oak_planks"],
      upper: ["stone_bricks", "cobblestone"],
      roof: ["deepslate_tiles"],
    },
    plasterInvariant: null,
    frontDir: "+z", sideDir: "+x",
  },
  // THE E-25 CHALLENGE SUBJECT (T-094-01 registered concept+GLB; T-095-01 ran it). UNTUNED
  // CONTRACT: this entry is registry DATA only — paths, the working scale, and a fallback prior
  // transcribed 1:1 from the committed material-map/church.json roles (the gatehouse precedent;
  // transcription, not tuning): walls=cobblestone field, corners-edges/base=stone_bricks,
  // trim=polished_andesite, openings=black_stained_glass, roof=dark_oak_planks. The live path is
  // the concept-derived zone map; no committed zone-map/value-select/kit records exist (first
  // contact — nullable by design). `build` is provisioned BY the challenge runner (GLB + map at
  // `provision.scale`, the smoke-checked voxelization scale); `provision` is consumed only there.
  church: {
    key: "church",
    build: "challenge/church/base-artifact.json",
    concept: "runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png",
    glb: "glb/church.glb",
    map: "material-map/church.json",
    valueSelectRecord: null, // first run IS the value-true result (gatehouse precedent)
    zoneMapRecord: null,     // no committed derivation — the challenge record carries the first one
    kitRecord: null,         // kits are E-26 scope; optional in buildSkin
    provision: { scale: 48 },
    // T-106-01: the chain-canonical caged shell — the standalone T-102 record was cut from the
    // PRE-cage-wiring challenge shell (stale input; its expect pins describe that shell), so the
    // component layer (T-103/104/105) pins THIS file, which every chain run reproduces.
    regularizedShell: "challenge/church/shell-artifact.json",
    policy: { // FALLBACK PRIOR, from material-map/church.json roles (1:1 rule→block transcription)
      base: {
        dominant: "cobblestone",                                            // structural wall body
        preserve: ["stone_bricks", "polished_andesite", "black_stained_glass"], // quoins/plinth + trim + glazing
        splat: ["stone_bricks", "polished_andesite", "black_stained_glass"],
      },
      upper: {
        dominant: "cobblestone",                                            // same field — single-material body
        preserve: ["stone_bricks", "polished_andesite", "black_stained_glass"],
        splat: ["stone_bricks", "polished_andesite", "black_stained_glass"],
      },
      roof: {
        dominant: "dark_oak_planks",                                        // roof mass + tower cap
        preserve: [],                                                       // anything else on the roof is salt
        splat: [],
      },
    },
    legacy: { // the E-23 splat-only counterfactual (no E-23 skin ever existed — labeled in the record)
      base: ["cobblestone", "stone_bricks", "polished_andesite", "black_stained_glass"],
      upper: ["cobblestone", "stone_bricks", "polished_andesite", "black_stained_glass"],
      roof: ["dark_oak_planks"],
    },
    plasterInvariant: null,
    frontDir: "+z", sideDir: "+x",
  },
};

const bare = (id) => String(id).replace(/^minecraft:/, "");

/** Map a named-space zone policy through the value-true substitution — THE one renaming point. */
function mapPolicy(policy, sub) {
  return Object.fromEntries(Object.entries(policy).map(([z, p]) => [z, {
    dominant: sub(p.dominant),
    preserve: [...new Set(p.preserve.map(sub))],
    splat: [...new Set(p.splat.map(sub))],
  }]));
}

/** Rename switched blocks across manifest + placements (value-select.mjs precedent). */
function applySubstitution(artifact, substitution) {
  const subbed = (b) => `minecraft:${substitution[bare(b)] ?? bare(b)}`;
  return {
    ...artifact,
    palette: { ...artifact.palette, manifest: [...new Set(artifact.palette.manifest.map(subbed))] },
    placements: artifact.placements.map((p) => (substitution[bare(p.block)] ? { ...p, block: subbed(p.block) } : p)),
  };
}

/** Final material per voxel (last-write-wins). */
function materialCounts(artifact) {
  const counts = {};
  for (const blk of artifactOccupancy(artifact).cells.values()) {
    const b = bareBlock(blk);
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

/** Per-zone count of `block` on the EXPOSURE skin (the camera's truth) — the plaster-invariant census.
 *  Zone names come from `zoneOf` (T-092: derived band names, not a fixed base/upper/roof). */
function exposedBlockByZone(artifact, zoneOf, block) {
  const hist = {};
  for (const { voxel, block: blk } of exposedVoxelEntries(artifactOccupancy(artifact))) {
    if (bareBlock(blk) === block) hist[zoneOf(voxel)] = (hist[zoneOf(voxel)] || 0) + 1;
  }
  return hist;
}

/** Fraction of a zone's shell covered by its dominant + preserve set (the T-090 band instrument). */
function zoneMaterialsFraction(cov, zone, policy) {
  const z = cov[zone];
  if (!z || !z.total) return null;
  const mats = new Set([policy[zone].dominant, ...policy[zone].preserve].map(bareBlock));
  const n = Object.entries(z.byBlock).reduce((a, [b, c]) => a + (mats.has(b) ? c : 0), 0);
  return Math.round((n / z.total) * 1000) / 1000;
}

function coverageLine(cov) {
  return Object.entries(cov)
    .map(([z, c]) => `${z} ${c.dominant}=${c.dominantFraction == null ? "?" : Math.round(c.dominantFraction * 100) + "%"}`)
    .join(", ");
}

/** Decode a GLB baseColor image to RGBA (WebP via dwebp) — spray-paint's injection, runner-local. */
async function decodeTexture({ data, mimeType }) {
  const { writeFile: wf, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const p = join(tmpdir(), `ds-tex-${process.pid}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await wf(p, Buffer.from(data));
    try { return await decodeImage(p); } finally { await rm(p, { force: true }); }
  }
  const { spawn } = await import("node:child_process");
  const inP = join(tmpdir(), `ds-tex-${process.pid}.webp`);
  const outP = join(tmpdir(), `ds-tex-${process.pid}.png`);
  await wf(inP, Buffer.from(data));
  await new Promise((res, rej) => {
    const c = spawn("dwebp", [inP, "-o", outP], { stdio: "ignore" });
    c.on("error", rej);
    c.on("close", (code) => (code === 0 ? res() : rej(new Error(`dwebp exited ${code}`))));
  });
  try { return await decodeImage(outP); } finally { await rm(inP, { force: true }); await rm(outP, { force: true }); }
}

/** Best-effort GL render at a named angle (a lens, never logic). */
async function tryRenderAngle(artifact, angle, label, subjDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: subjDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

// =================================================================================================
// THE DETERMINISTIC CORE — reads committed inputs, writes nothing, no GL. Run twice per live pass;
// the two final artifacts must be byte-identical (the reproducibility proof).
// =================================================================================================
export async function buildSkin(def, { zoneSource = "derived" } = {}) {
  const notes = [];
  const matMap = JSON.parse(await readFile(join(HERE, def.map), "utf8"));
  const raw = JSON.parse(await readFile(join(HERE, def.build), "utf8"));
  assertArtifact(raw);

  // --- 1. VALUE-TRUE SELECTION (T-086 cores, ORIGINAL name space) --------------------------------
  const conceptPath = join(HERE, def.concept);
  const conceptImg = await decodeImage(conceptPath);
  const namedManifest = bareList(matMap.palette);
  const borderColor = estimateBorderColor(conceptImg);
  const gridResult = gridFromPixels(conceptImg, {
    whitelist: namedManifest, n: SAMPLE_GRID_N, dropColor: borderColor, cellMeans: true,
  });
  const swatches = sampleRoleSwatches(gridResult, namedManifest);
  const rows = selectValueTrueMap(matMap.map, swatches);
  const substitution = Object.fromEntries(rows.filter((r) => r.switched).map((r) => [r.named, r.chosen]));
  let agreesWithRecord = null;
  if (def.valueSelectRecord && existsSync(join(HERE, def.valueSelectRecord))) {
    const committed = JSON.parse(await readFile(join(HERE, def.valueSelectRecord), "utf8"));
    const canon = (o) => JSON.stringify(Object.entries(o ?? {}).sort());
    agreesWithRecord = canon(committed.substitution) === canon(substitution);
    if (!agreesWithRecord) {
      throw new Error(`value-true substitution diverges from the committed ${def.valueSelectRecord}: ` +
        `${JSON.stringify(substitution)} vs ${JSON.stringify(committed.substitution)} — same cores, same ` +
        `inputs; divergence is a wiring bug, not a result`);
    }
  }
  const sub = (b) => substitution[b] ?? b;

  // --- 1b. KIT OVERRIDES (T-096, E-26): RECOGNITION BEATS SNAP at this ONE renaming point. The
  // committed kit's `overrides` hold only VERIFIED cube recognitions that cover a derived band
  // (kitOverrides' contract); they compose OVER the color-snap — the snap `substitution` itself
  // stays untouched (the value-select agreement above compares it). No kit record ⇒ unchanged.
  let kit = { source: null, overrides: {} };
  if (def.kitRecord && existsSync(join(HERE, def.kitRecord))) {
    const kitRec = JSON.parse(await readFile(join(HERE, def.kitRecord), "utf8"));
    if (kitRec.schema !== "kit/v1") throw new Error(`${def.kitRecord} is not a kit/v1 record`);
    kit = { source: def.kitRecord, overrides: kitRec.overrides ?? {} };
  }
  const combined = { ...substitution, ...kit.overrides };
  const subK = (b) => combined[b] ?? b;

  // --- 2. SUBSTITUTED BUILD (the shipped palette, everywhere below) ------------------------------
  const artifact0 = applySubstitution(raw, combined);
  assertArtifact(artifact0);
  const legacyS = Object.fromEntries(Object.entries(def.legacy).map(([z, m]) => [z, [...new Set(m.map(subK))]]));
  const allowed = allowedPalette(artifact0);
  const subManifest = artifact0.palette.manifest;
  const palette = paletteFromManifest(subManifest);

  // --- 3. SEAL (S-084) → 4. ZONES (T-092: read from the CONCEPT, prior = recorded fallback) ------
  const occ0 = artifactOccupancy(artifact0);
  const sealed = applyDeltas(artifact0, [...sealRoof(occ0).placements, ...sealWalls(occ0).placements]);
  const occSealed = artifactOccupancy(sealed);
  // T-106-01 seam 4 (the re-pin protocol, mechanized): the wall/roof boundary comes from the
  // component DEFINITION when one exists — the occupancy-derived eave read drifts on a rebuilt
  // roof and re-maps the concept's rows (a phantom band appeared on the cottage). The pin is an
  // ATTEMPT (T-104's pitch-source ladder semantics): a multi-mass record's tallest slab can be a
  // tower face, not the eave (the gatehouse) — if the concept extraction is unreadable WITH the
  // pin but readable WITHOUT it, the occupancy read wins and the rejection is named. zoneOptsEff
  // is returned so the grammar reads the same geometry.
  const plan = def.componentPlan ?? null;
  let upperTopSource = plan?.wallTop != null ? "component" : "occupancy";
  let zoneOptsEff = plan?.wallTop != null
    ? { ...(def.zoneOpts ?? {}), upperTop: plan.wallTop }
    : (def.zoneOpts ?? {});
  let sz = structuralZones(occSealed, zoneOptsEff);
  if (zoneSource === "derived" && plan?.wallTop != null) {
    const pinned = extractConceptZoneMap({
      gridResult, floorLines: sz.floorLines, layerCounts: layerCounts(occSealed),
      upperTop: sz.upperTop, materialMap: matMap,
    });
    if (!pinned.readable) {
      const szOcc = structuralZones(occSealed, def.zoneOpts ?? {});
      const occRead = extractConceptZoneMap({
        gridResult, floorLines: szOcc.floorLines, layerCounts: layerCounts(occSealed),
        upperTop: szOcc.upperTop, materialMap: matMap,
      });
      if (occRead.readable) {
        upperTopSource = `occupancy (wall-top pin rejected: ${pinned.reason})`;
        zoneOptsEff = def.zoneOpts ?? {};
        sz = szOcc;
        notes.push(`wall-top pin ${plan.wallTop} rejected — concept extraction ${pinned.reason}; ` +
          `occupancy upperTop ${szOcc.upperTop} reads (named, attempt-ladder semantics)`);
      }
    }
  }
  const { storeyDivide, upperTop } = sz;
  // The band profile reads the SAME committed inputs the value-true step already decoded: the
  // step-1 gridResult (named-manifest validate quantize) + the geometric y-axis (floor-lines).
  let zoneMap = { source: "prior", reason: "zoneSource=prior (forced)" };
  let zoneOf = sz.zoneOf;        // the prior's zone geometry (base/upper/roof)
  let policyNamed = def.policy;  // the prior's assignments (named space)
  if (zoneSource === "derived") {
    const extracted = extractConceptZoneMap({
      gridResult, floorLines: sz.floorLines, layerCounts: layerCounts(occSealed),
      upperTop, materialMap: matMap,
    });
    if (extracted.readable) {
      const zb = zonesFromBands({
        bands: extracted.bands, roof: extracted.roof, roofKeys: sz.roofKeys, upperTop,
      });
      zoneOf = zb.zoneOf;
      policyNamed = zb.zones;
      zoneMap = {
        source: "concept", bands: extracted.bands, roof: extracted.roof, params: extracted.params,
        diff: diffZoneMaps({
          prior: { zones: def.policy, storeyDivide, upperTop },
          derived: extracted, yMin: occSealed.bounds.min[1],
        }),
      };
      if (def.zoneMapRecord && existsSync(join(HERE, def.zoneMapRecord))) {
        const committed = JSON.parse(await readFile(join(HERE, def.zoneMapRecord), "utf8"));
        const canon = (v) => JSON.stringify(v ?? null);
        zoneMap.agreesWithRecord =
          canon(committed.derived?.bands) === canon(zoneMap.bands) &&
          canon(committed.derived?.roof) === canon(zoneMap.roof);
        if (!zoneMap.agreesWithRecord) {
          throw new Error(`derived zone map diverges from the committed ${def.zoneMapRecord} — same ` +
            `cores, same inputs; divergence is a wiring bug, not a result`);
        }
      }
    } else {
      // E-25: the prior is a FALLBACK, recorded when used, never overriding a readable concept.
      zoneMap = { source: "prior-fallback", reason: extracted.reason, params: extracted.params };
      notes.push(`zone map fell back to the prior: ${extracted.reason}`);
    }
  }
  const policyS = mapPolicy(policyNamed, subK);
  for (const [z, p] of Object.entries(policyS)) {
    if (!allowed.has(p.dominant)) throw new Error(`zone "${z}" dominant "${p.dominant}" not in the substituted manifest`);
  }

  // --- T-106-01 COMPONENT CONSUMPTION (E-27 Rule 4: where a definition exists, the derivation is a
  // bug). All four seams hang off `def.componentPlan` (component-plan.mjs, built by the chain's
  // reconstruct stage); a null plan is byte-for-byte today's pipeline. Recorded in `seamSources`.
  if (plan?.roof && policyS.roof) {
    // the program's course family is roof vocabulary: treads/slabs are roof material to the fill's
    // keep rule, the own-materials band evidence, and the plaster invariant — never salt to strip
    for (const member of [plan.roof.family.stairs, plan.roof.family.slab]) {
      if (member && allowed.has(member) && !policyS.roof.preserve.includes(member)) {
        policyS.roof.preserve.push(member);
      }
    }
  }
  const roofRegions = plan?.roof
    ? [{ name: "roof-program", contains: (voxel) => plan.roof.cells.has(voxel.join(",")) }]
    : [];
  const skipProgram = plan?.roof ? (voxel) => plan.roof.cells.has(voxel.join(",")) : undefined;
  // the gate census runs over the DEFINITIONS: a roof-program cell censuses as roof (a rake stair
  // on the gable-end plane is a roof course, not wall-band residue), and wall-band cells off the
  // defined slab faces report `<band>:offslab` — measured in the same coverage record, never gated
  // (no policy entry), so the residual's cause ships with the verdict
  const censusZoneOf = plan ? planCensusZoneOf(zoneOf, plan, Object.keys(policyS).filter((z) => z !== "roof")) : zoneOf;
  const seamSources = {
    roofCourses: plan?.roof ? "program" : "occupancy",
    wallFields: plan?.wallFaces ? "slab-faces" : "banded-exposure",
    upperTop: upperTopSource,
    zoneMap: zoneMap.source,
  };

  // --- 5. FULL-SHELL BASE COAT (T-085 + T-090 skin) ----------------------------------------------
  const fillZones = Object.fromEntries(
    Object.entries(policyS).map(([z, p]) => [z, { dominant: p.dominant, preserve: p.preserve }]));
  const fill = zoneFill(occSealed, { zoneOf, zones: fillZones, skin: "exposure", regions: roofRegions });
  const based = applyPaint(sealed, fill.placements);
  const occBased = artifactOccupancy(based);

  // --- 6. SECONDARIES SPLAT (E-23, zone-gated, dominants excluded) -------------------------------
  const allowedByZone = new Map(
    Object.entries(policyS).map(([z, p]) => [z, new Set(p.splat.filter((b) => allowed.has(b)))]));
  const frontGrid = projectSurface(occBased, def.frontDir);
  const conceptRes = await quantizeToFace(conceptPath, frontGrid, { manifest: subManifest });
  const frontTarget = resampleBlockGrid(conceptRes.grid, conceptRes.n, conceptRes.m, frontGrid.n, frontGrid.m).grid;
  const sideGrid = projectSurface(occBased, def.sideDir);
  let sideSplat = null;
  try {
    sideSplat = await loadGlbSplat(join(HERE, def.glb), sideGrid, def.sideDir, { palette, decodeTexture });
  } catch (e) {
    notes.push(`side GLB splat skipped: ${e.message}`);
  }
  const frontPass = paintFace(occBased, def.frontDir, frontTarget, { allowed, source: "concept", zoneOf, allowedByZone, skip: skipProgram });
  const sidePass = sideSplat
    ? paintFace(occBased, def.sideDir, sideSplat.grid, { allowed, source: "glb", zoneOf, allowedByZone, skip: skipProgram })
    : { dir: def.sideDir, source: "glb", placements: [], painted: 0, skipped: 0, offPalette: 0, zoneRejected: 0 };
  // T-088 PRECONDITION on the front candidate, GL-free (the deterministic acceptance: the concept IS the
  // truth for the front, so with coverage passed the paint is accepted; the resemblance delta is rendered
  // later as EVIDENCE — it cannot rescue a coverage failure, per the T-088 contract).
  const frontCandidate = applyPaint(based, frontPass.placements);
  const covFrontCandidate = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(frontCandidate), censusZoneOf, { skin: "exposure" }), policyS);
  const gateFrontCandidate = coverageGate(covFrontCandidate, { threshold: COVERAGE_THRESHOLD, zones: policyS });
  const frontAccepted = gateFrontCandidate.passed;
  const sideAccepted = sidePass.painted > 0;
  const acceptedPasses = [];
  if (sideAccepted) acceptedPasses.push(sidePass);
  if (frontAccepted) acceptedPasses.push(frontPass);
  const merged = acceptedPasses.length
    ? mergePaints(acceptedPasses, { priority: ["concept", "glb"] })
    : { placements: [], collisions: 0 };
  const painted = applyPaint(based, merged.placements);

  // --- 7. THE E-23 SPLAT-ONLY BASELINE (replayed on the sealed, UN-filled build) ------------------
  const legacyByZone = new Map(
    Object.entries(legacyS).map(([z, mats]) => [z, new Set(mats.filter((b) => allowed.has(b)))]));
  // the legacy replay keeps ITS historical zone source (the prior's base/upper/roof geometry) so the
  // before-baseline cannot silently improve when the map derivation changes
  const frontLegacy = paintFace(occSealed, def.frontDir, frontTarget, { allowed, source: "concept", zoneOf: sz.zoneOf, allowedByZone: legacyByZone });
  const sideLegacy = sideSplat
    ? paintFace(occSealed, def.sideDir, sideSplat.grid, { allowed, source: "glb", zoneOf: sz.zoneOf, allowedByZone: legacyByZone })
    : { placements: [] };
  const splatOnly = applyPaint(sealed, mergePaints(
    [sideLegacy, frontLegacy].filter((p) => (p.placements?.length ?? 0) > 0),
    { priority: ["concept", "glb"] }).placements);
  const covSplatOnly = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(splatOnly), censusZoneOf, { skin: "exposure" }), policyS);
  const gateSplatOnly = coverageGate(covSplatOnly, { threshold: COVERAGE_THRESHOLD, zones: policyS });

  // --- 8. COHERENT SURFACE (T-087: geometry first, pattern second) --------------------------------
  // T-106-01: on the roof PROGRAM's footprint the courses are the contract, not a height field to
  // smooth — the basin-fill is restricted to off-footprint columns and the program gets a
  // CONFORMANCE check instead (deviations recorded as evidence; the program is never auto-"fixed").
  let course = regularizeRoofCourses(artifactOccupancy(painted), { dominant: policyS.roof.dominant });
  if (plan?.roof) {
    const before = course.placements.length;
    const placements = course.placements.filter((p) => !plan.roof.footprintCols.has(`${p.pos[0]},${p.pos[2]}`));
    course = { ...course, placements, programFiltered: before - placements.length };
  }
  const courseBuild = applyPaint(painted, course.placements);
  const salt = stripStraySalt(artifactOccupancy(courseBuild), {
    zoneOf, zones: policyS, minKeep: MIN_KEEP, minExtent: MIN_EXTENT, regions: roofRegions,
  });
  const final = applyPaint(courseBuild, salt.placements);
  let conformance = null;
  if (plan?.roof) {
    conformance = programConformance(artifactOccupancy(final), plan.roof);
    if (conformance.deviations.length) {
      notes.push(`roof program conformance: ${conformance.deviations.length}/${conformance.columns} ` +
        `columns deviate from the program top (recorded, not auto-fixed)`);
    }
  }

  // --- 9. TERMINAL GATES (a failing skin can never write a record) --------------------------------
  // T-079-02 guard, generalized for derived zone names (T-092): the invariant block may appear ONLY
  // on zones whose policy includes it (dominant ∪ preserve ∪ splat) — under the derived cottage map
  // plaster is legitimate on BOTH storeys above the plinth and forbidden on the plinth + roof.
  let plaster = null;
  if (def.plasterInvariant) {
    const block = subK(def.plasterInvariant);
    const histogram = exposedBlockByZone(final, zoneOf, block);
    const allowedZones = Object.entries(policyS)
      .filter(([, p]) => p.dominant === block || p.preserve.includes(block) || p.splat.includes(block))
      .map(([z]) => z);
    const violations = Object.entries(histogram).filter(([z, c]) => c > 0 && !allowedZones.includes(z));
    if (violations.length) {
      throw new Error(`zone violation: ${block} on shells outside its zones ` +
        `(${JSON.stringify(Object.fromEntries(violations))}; allowed: ${allowedZones.join(", ")})`);
    }
    plaster = { block, histogram, allowedZones };
  }
  const covFinal = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(final), censusZoneOf, { skin: "exposure" }), policyS);
  const gateFinal = coverageGate(covFinal, { threshold: COVERAGE_THRESHOLD, zones: policyS });
  if (!gateFinal.passed) {
    // the failure carries its MEASURED CAUSE (T-106-01 AC: "the residual is named") — the failing
    // zone's full census plus its :offslab/:frame complements land in the pipeline-failed record
    const cause = gateFinal.failures.map((f) => {
      const parts = [f.zone, `${f.zone}:offslab`, `${f.zone}:frame`]
        .filter((z) => covFinal[z])
        .map((z) => `${z}=${JSON.stringify({ total: covFinal[z].total, byBlock: covFinal[z].byBlock })}`);
      return `${f.zone} ${f.dominant}=${f.fraction} < ${COVERAGE_THRESHOLD} [census: ${parts.join("; ")}]`;
    });
    throw new Error(`coverage gate FAILED on the final skin: ${cause.join(", ")}`);
  }
  // T-090 band evidence on the same shell census, generalized for N wall bands (T-092): for each wall
  // band, the shell fraction covered by OTHER wall bands' dominants (its own dominant/preserve set
  // excluded) is the displaced-field residue — bounded as before. Bands sharing a dominant (the
  // gatehouse's single-material body) contribute no foreign blocks, the old "n/a" case by construction.
  const wallZoneNames = Object.keys(policyS).filter((z) => z !== "roof");
  const bands = {
    roofMaterialsFraction: zoneMaterialsFraction(covFinal, "roof", policyS),
    wallForeignResidue: {},
  };
  for (const z of wallZoneNames) {
    const own = new Set([policyS[z].dominant, ...policyS[z].preserve]);
    const foreign = new Set(wallZoneNames.filter((w) => w !== z)
      .map((w) => policyS[w].dominant).filter((b) => !own.has(b)));
    const total = covFinal[z]?.total || 0;
    bands.wallForeignResidue[z] = total
      ? Math.round((Object.entries(covFinal[z].byBlock)
          .reduce((a, [b, c]) => a + (foreign.has(b) ? c : 0), 0) / total) * 1000) / 1000
      : null;
  }
  const worstResidue = Math.max(0, ...Object.values(bands.wallForeignResidue).filter((v) => v != null));
  if ((bands.roofMaterialsFraction ?? 0) < ROOF_BAND_TARGET || worstResidue > UPPER_RESIDUE_MAX) {
    throw new Error(`band acceptance FAILED: roof materials ${bands.roofMaterialsFraction} ` +
      `(target >= ${ROOF_BAND_TARGET}), wall foreign residue ${JSON.stringify(bands.wallForeignResidue)} ` +
      `(max ${UPPER_RESIDUE_MAX})`);
  }
  assertArtifact(final);

  return {
    raw, artifact0, sealed, based, painted, splatOnly, final,
    substitution, kit, rows, agreesWithRecord, policyS, borderColor,
    zones: { storeyDivide, upperTop }, zoneOf, zoneMap, fill, zoneOpts: zoneOptsEff,
    splat: {
      front: {
        dir: def.frontDir, source: "concept", painted: frontPass.painted, skipped: frontPass.skipped,
        offPalette: frontPass.offPalette, zoneRejected: frontPass.zoneRejected,
        accepted: frontAccepted, coverageGate: gateFrontCandidate, outOfPalette: conceptRes.outOfPalette,
      },
      side: {
        dir: def.sideDir, source: "glb", painted: sidePass.painted, skipped: sidePass.skipped,
        offPalette: sidePass.offPalette, zoneRejected: sidePass.zoneRejected, accepted: sideAccepted,
      },
      collisions: merged.collisions,
    },
    course, salt,
    coverage: { splatOnly: covSplatOnly, final: covFinal },
    gates: { threshold: COVERAGE_THRESHOLD, splatOnly: gateSplatOnly, final: gateFinal },
    bands, plaster, notes,
    seamSources, conformance,
  };
}

// =================================================================================================
// MAIN — offline re-assert, or live: double-run determinism proof + renders + frames + the record.
// =================================================================================================
const DIR_TO_ANGLE = { "+z": "front", "-z": "back", "+x": "right", "-x": "left" };

async function main() {
  const argv = process.argv.slice(2);
  const subjectKey = argv[argv.indexOf("--subject") + 1];
  const def = SUBJECTS[subjectKey];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const artPath = join(subjDir, "artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(artPath)) throw new Error(`committed record/artifact absent — run npm run skin:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const sha = createHash("sha256").update(artBytes).digest("hex");
    const checks = {
      sha: sha === rec.reproducible?.sha256,
      gateFinal: rec.coverageGate?.final?.passed === true,
      gateSplatOnly: rec.coverageGate?.splatOnly?.passed === false,
      bands: (rec.bands?.roofMaterialsFraction ?? 0) >= ROOF_BAND_TARGET &&
        Object.values(rec.bands?.wallForeignResidue ?? {}).every((v) => v == null || v <= UPPER_RESIDUE_MAX),
      plaster: !rec.invariants?.plaster ||
        Object.entries(rec.invariants.plaster.histogram).every(([z, c]) =>
          c === 0 || rec.invariants.plaster.allowedZones.includes(z)),
      zoneMap: rec.zoneMap?.source === "concept" || rec.zoneMap?.source === "prior-fallback",
      course: (rec.pattern?.course?.after?.stepSmoothness ?? 0) >= (rec.pattern?.course?.before?.stepSmoothness ?? 1),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `coverage gate final ${checks.gateFinal ? "passed" : "VIOLATED"} / splat-only ${checks.gateSplatOnly ? "rejected" : "VIOLATED"}; ` +
      `bands ${checks.bands ? "OK" : "VIOLATED"}; plaster invariant ${checks.plaster ? "OK" : "VIOLATED"}; ` +
      `course smoothness ${checks.course ? "non-regressing" : "VIOLATED"}; ` +
      `zone map ${checks.zoneMap ? `recorded (${rec.zoneMap.source})` : "MISSING"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  // THE REPRODUCIBILITY PROOF (Rule 2): the deterministic core, twice; byte-equal or no record.
  const r1 = await buildSkin(def);
  const r2 = await buildSkin(def);
  const j1 = JSON.stringify(r1.final);
  if (j1 !== JSON.stringify(r2.final)) throw new Error("NON-DETERMINISTIC: two in-process runs produced different artifacts");
  console.error(`[${def.key}] reproducible: double-run artifacts identical (${r1.final.placements.length} placements)`);
  console.error(`[${def.key}] substitution ${JSON.stringify(r1.substitution)}` +
    (r1.agreesWithRecord != null ? ` — agrees with committed value-select record` : " (no committed record — this run is the result)"));
  console.error(`[${def.key}] zone map: ${r1.zoneMap.source}` +
    (r1.zoneMap.reason ? ` (${r1.zoneMap.reason})` : "") +
    (r1.zoneMap.bands ? ` — ${r1.zoneMap.bands.map((b) => `${b.name} y${b.yRange[0]}..${b.yRange[1]} ${b.dominantBlock}`).join(", ")}; roof ${r1.zoneMap.roof.dominantBlock}` : "") +
    (r1.zoneMap.agreesWithRecord ? " — agrees with committed zone-map record" : ""));
  console.error(`[${def.key}] fill: ${r1.fill.placements.length} filled, ${r1.fill.kept} kept — ` +
    Object.entries(r1.fill.byZone).map(([z, s]) => `${z} ${s.filled}/${s.surface}`).join(", "));
  console.error(`[${def.key}] splat: front ${r1.splat.front.painted} (zoneRejected ${r1.splat.front.zoneRejected}, accepted ${r1.splat.front.accepted}), ` +
    `side ${r1.splat.side.painted} (accepted ${r1.splat.side.accepted})`);
  console.error(`[${def.key}] pattern: ${r1.course.columnsRaised} columns raised / ${r1.course.voxelsAdded} voxels added, ` +
    `smoothness ${r1.course.before.stepSmoothness} → ${r1.course.after.stepSmoothness}; salt ${r1.salt.stripped} stripped / ${r1.salt.kept} kept`);
  console.error(`[${def.key}] coverage splat-only: ${coverageLine(r1.coverage.splatOnly)} → gate ${r1.gates.splatOnly.passed ? "PASS (unexpected)" : "REJECT"}`);
  console.error(`[${def.key}] coverage final:      ${coverageLine(r1.coverage.final)} → gate ${r1.gates.final.passed ? "PASS" : "REJECT"}`);
  console.error(`[${def.key}] bands: roof materials ${r1.bands.roofMaterialsFraction}; wall foreign residue ` +
    Object.entries(r1.bands.wallForeignResidue).map(([z, v]) => `${z}=${v ?? "n/a"}`).join(", "));

  const artJson = JSON.stringify(r1.final, null, 2) + "\n";
  await writeFile(artPath, artJson);
  const sha256 = createHash("sha256").update(artJson).digest("hex");

  // --- renders + the resemblance EVIDENCE (best-effort; never gates the build) --------------------
  const frontAngle = DIR_TO_ANGLE[def.frontDir] ?? "front";
  const renders = [];
  const rSplatFront = await tryRenderAngle(r1.splatOnly, frontAngle, "splatonly-front", subjDir);
  const rFinalFront = await tryRenderAngle(r1.final, frontAngle, "final-front", subjDir);
  const rSplatObl = await tryRenderAngle(r1.splatOnly, OBLIQUE_ANGLE, "splatonly-oblique225", subjDir);
  const rFinalObl = await tryRenderAngle(r1.final, OBLIQUE_ANGLE, "final-oblique225", subjDir);
  const rTop = await tryRenderAngle(r1.final, "top", "final-top", subjDir);
  renders.push({ when: "splat-only", ...rSplatFront }, { when: "final", ...rFinalFront },
    { when: "splat-only", ...rSplatObl }, { when: "final", ...rFinalObl }, { when: "final", ...rTop });
  for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
  // front-face resemblance vs the concept, both skins (evidence for the record; T-088 already decided)
  let resemblance = null;
  try {
    if (rSplatFront.path && rFinalFront.path) {
      const blockTable = loadBlockTable();
      const conceptImg = await decodeImage(join(HERE, def.concept));
      const sB = faceResemblance(await decodeImage(join(ROOT, rSplatFront.path)), conceptImg, blockTable, { artifact: r1.splatOnly });
      const sA = faceResemblance(await decodeImage(join(ROOT, rFinalFront.path)), conceptImg, blockTable, { artifact: r1.final });
      resemblance = { face: frontAngle, splatOnly: sB.score, final: sA.score };
      console.error(`[${def.key}] front resemblance vs concept: splat-only ${sB.score} → final ${sA.score} (evidence, not the gate)`);
    }
  } catch (e) {
    resemblance = { error: e.message };
  }

  // --- the strip (concept | splat-only | final) + committed frames --------------------------------
  const frames = [];
  try {
    if (rSplatFront.path && rFinalFront.path) {
      const P = RESEMBLANCE_DEFAULTS.panel;
      const panels = [
        resampleRgba(await decodeImage(join(HERE, def.concept)), P, P, "aspect"),
        resampleRgba(await decodeImage(join(ROOT, rSplatFront.path)), P, P, "aspect"),
        resampleRgba(await decodeImage(join(ROOT, rFinalFront.path)), P, P, "aspect"),
      ];
      const strip = composeTriptych(panels, {});
      const stripPath = join(subjDir, `${def.key}-strip.png`);
      await writeFile(stripPath, encodeRgbaToPng(strip.data, strip.w, strip.h));
      await copyFile(stripPath, join(FRAMES_DIR, `durable-${def.key}-strip.png`));
      frames.push(`pr/assets/frames/durable-${def.key}-strip.png`);
    }
    if (rSplatObl.path) {
      await copyFile(join(ROOT, rSplatObl.path), join(FRAMES_DIR, `durable-${def.key}-before.png`));
      frames.push(`pr/assets/frames/durable-${def.key}-before.png`);
    }
    if (rFinalObl.path) {
      await copyFile(join(ROOT, rFinalObl.path), join(FRAMES_DIR, `durable-${def.key}-after.png`));
      frames.push(`pr/assets/frames/durable-${def.key}-after.png`);
    }
  } catch (e) {
    console.error(`frames: ${e.message}`);
  }

  // --- the durable record --------------------------------------------------------------------------
  const before = materialCounts(r1.raw);
  const after = materialCounts(r1.final);
  const record = {
    schema: "durable-skin/v1",
    subject: def.key,
    inputs: { build: def.build, concept: def.concept, glb: def.glb, map: def.map },
    valueTrue: {
      substitution: r1.substitution,
      agreesWithCommittedRecord: r1.agreesWithRecord,
      rows: r1.rows.map((r) => ({
        role: r.role, named: r.named, chosen: r.chosen, switched: r.switched, reason: r.reason,
        sampleCells: r.sampleCells, namedTrue: r.namedTrue ?? null, chosenTrue: r.chosenTrue ?? null,
      })),
      note: "selection in the ORIGINAL name space (T-086 locator), substitution applied ONCE to build + " +
        "policy; all later stages run in the shipped palette. Reported ΔE is true unweighted ΔE76.",
    },
    sealed: { raw: r1.raw.placements.length, substituted: r1.artifact0.placements.length, sealed: r1.sealed.placements.length },
    zones: { ...r1.zones, source: r1.zoneMap.source },
    zoneMap: r1.zoneMap,
    kit: r1.kit, // T-096 (E-26): verified recognitions composed OVER the snap at the renaming point
    fill: {
      skin: "exposure", minRun: 2, policy: r1.policyS,
      placements: r1.fill.placements.length, kept: r1.fill.kept, byZone: r1.fill.byZone,
    },
    splat: r1.splat,
    pattern: {
      course: {
        dominant: r1.policyS.roof.dominant, columnsRaised: r1.course.columnsRaised,
        voxelsAdded: r1.course.voxelsAdded, before: r1.course.before, after: r1.course.after,
      },
      salt: { minKeep: MIN_KEEP, minExtent: MIN_EXTENT, stripped: r1.salt.stripped, kept: r1.salt.kept, byZone: r1.salt.byZone },
    },
    coverage: r1.coverage,
    coverageGate: {
      threshold: COVERAGE_THRESHOLD,
      splatOnly: r1.gates.splatOnly, // expect passed:false — the E-23 baseline cannot establish a dominant
      final: r1.gates.final,         // expect passed:true  — a failing skin would have thrown, no record
      note: "coverage is a PRECONDITION (T-088): the splat-only replay is rejected delta-independently; " +
        "the final skin must pass or the run throws. Census basis = the full 6-dir exposure shell (T-090).",
    },
    bands: { ...r1.bands, roofTarget: ROOF_BAND_TARGET, residueMax: UPPER_RESIDUE_MAX },
    invariants: { plaster: r1.plaster },
    reproducible: {
      doubleRun: true, sha256,
      determinism: "no LLM on the path — concept PNG + material-map roles are committed upstream " +
        "artifacts; every stage is a pure function of them. Two in-process executions byte-matched.",
    },
    resemblance,
    materialCounts: { before, after },
    renders, frames,
    notes: r1.notes,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote ${recPath} + ${artPath} (sha256 ${sha256.slice(0, 12)}…)`);
}

function renderMd(r) {
  const pct = (f) => (f == null ? "?" : `${Math.round(f * 100)}%`);
  const covLine = (cov) => Object.keys(cov)
    .map((z) => `${z} \`${cov[z]?.dominant}\` ${pct(cov[z]?.dominantFraction)} of ${cov[z]?.total ?? "?"}`)
    .join(" · ");
  const rowsMd = r.valueTrue.rows.map((x) =>
    `| ${x.role} | \`${x.named}\` | \`${x.chosen}\` | ${x.switched ? "**switched**" : x.reason} | ${x.sampleCells} | ` +
    `${x.namedTrue ? x.namedTrue.deltaE : "—"} → ${x.chosenTrue ? x.chosenTrue.deltaE : "—"} |`).join("\n");
  const renders = r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n");
  const m = (s) => `smoothness **${s.stepSmoothness}**, cliff ${s.cliff}`;
  return `# Durable skin — ${r.subject} (T-089-01)\n\n` +
    `One command, end-to-end: value-true → seal → full-shell zone-fill → secondaries splat → coherent ` +
    `surface → coverage gate. **Reproducible**: double-run byte-identical, artifact sha256 \`${r.reproducible.sha256.slice(0, 16)}…\`.\n\n` +
    `## Value-true selection (T-086)\n` +
    `Substitution: \`${JSON.stringify(r.valueTrue.substitution)}\`` +
    (r.valueTrue.agreesWithCommittedRecord != null ? ` (agrees with the committed value-select record)` : ` (first run for this subject)`) + `\n\n` +
    `| role | named | chosen | verdict | cells | true ΔE |\n|---|---|---|---|---|---|\n${rowsMd}\n\n` +
    `## Zone map (T-092) — source: **${r.zoneMap.source}**` +
    (r.zoneMap.reason ? ` (${r.zoneMap.reason})` : "") + `\n` +
    (r.zoneMap.bands
      ? r.zoneMap.bands.map((b) => `- ${b.name} y ${b.yRange[0]}..${b.yRange[1]}: \`${b.dominantBlock}\` (${b.dominantRole})`).join("\n") +
        `\n- roof: \`${r.zoneMap.roof.dominantBlock}\` (${r.zoneMap.roof.dominantRole})\n` +
        (r.zoneMap.diff?.wallDiffs?.length
          ? `\nDiff vs the prior: ${r.zoneMap.diff.wallDiffs.map((d) => `y ${d.yRange[0]}..${d.yRange[1]} \`${d.prior}\`→\`${d.derived}\``).join("; ")}\n\n`
          : `\nDiff vs the prior: walls identical\n\n`)
      : `The concept region was unreadable; the registry prior was applied and recorded.\n\n`) +
    `## Base coat + splat (T-085/T-090 + E-23)\n` +
    `Full-shell fill (skin: exposure): **${r.fill.placements} cells filled**, ${r.fill.kept} kept — ` +
    Object.entries(r.fill.byZone).map(([z, s]) => `${z} ${s.filled}/${s.surface}`).join(", ") + `.\n` +
    `Splat (secondaries only): front ${r.splat.front.painted} painted (zoneRejected ${r.splat.front.zoneRejected}, ` +
    `accepted ${r.splat.front.accepted}), side ${r.splat.side.painted} (accepted ${r.splat.side.accepted}).\n\n` +
    `## Coherent surface (T-087)\n` +
    `Courses: ${r.pattern.course.columnsRaised} columns / ${r.pattern.course.voxelsAdded} voxels — before ` +
    `${m(r.pattern.course.before)} → after ${m(r.pattern.course.after)}. Salt: **${r.pattern.salt.stripped} stripped**, ${r.pattern.salt.kept} kept.\n\n` +
    `## Coverage gate (T-088) — proof both ways, exposure-shell census\n` +
    `- **splat-only (the E-23 baseline): ${r.coverageGate.splatOnly.passed ? "PASSED (unexpected)" : "REJECTED"}** — ${covLine(r.coverage.splatOnly)}\n` +
    `- **final skin: ${r.coverageGate.final.passed ? "PASSED" : "REJECTED (unexpected)"}** — ${covLine(r.coverage.final)}\n` +
    `- bands: roof materials ${pct(r.bands.roofMaterialsFraction)} (target ${pct(r.bands.roofTarget)})` +
    `, wall foreign residue ${Object.entries(r.bands.wallForeignResidue).map(([z, v]) => `${z} ${v == null ? "n/a" : pct(v)}`).join(" · ")} (max ${pct(r.bands.residueMax)})\n` +
    (r.invariants.plaster ? `- plaster invariant: \`${r.invariants.plaster.block}\` ${JSON.stringify(r.invariants.plaster.histogram)} — allowed zones: ${r.invariants.plaster.allowedZones.join(", ")}\n` : "") +
    (r.resemblance && r.resemblance.final != null ? `- front resemblance vs concept (evidence): ${r.resemblance.splatOnly} → ${r.resemblance.final}\n` : "") +
    `\n## Renders\n${renders}\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n` +
    `> ${r.reproducible.determinism}\n` +
    (r.notes.length ? `\nNotes: ${r.notes.join("; ")}\n` : "");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
