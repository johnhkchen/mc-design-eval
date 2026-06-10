// Placement grammar — kit entries bind to structural feature INSTANCES (T-098-01, story S-098,
// epic E-26).
//
// The kit (T-096) names WHAT the ingredients are; this module supplies WHERE each instance goes:
// frame lines (floor-line beams, corner posts, the wall crown = eave beams + gable rakes) take the
// kit's frame block; the bounded fields BETWEEN frame lines take the band's panel block; roof
// courses take the course block; each opening INSTANCE is bound to its declared treatment (applied
// by T-099, never here). Output: concrete placements, deterministic given kit + structural read.
//
// COMPOSES WITH THE FILL, NEVER FIGHTS IT (AC #2). Frame placements respect the fill's own keep
// rule — a declared secondary in a run (the chimney shaft, the splat-painted studs) is RESPECTED,
// not overpainted; fields and courses are then realized by running zoneFill itself over the
// frame-painted occupancy, so the T-090-01 contract (frame block is a declared cross-band
// secondary → kept in runs) is exercised, not assumed: `frameRefilled` MUST come back 0.
//
// Pure core: preconditions are REPORTED (collect-don't-throw, kit.mjs precedent); the impure
// runner enforces them. PURE — no GL, no I/O, no Date/random.

import { bareBlock, solidOccupancy } from "../view/occupancy.mjs";
import { frameLines, fieldInstances } from "../view/frame-lines.mjs";
import { openings } from "../view/structural-read.mjs";
import { zoneFill, inRun } from "../view/zone-fill.mjs";
import { overlayPlacements } from "../view/surface-pattern.mjs";

export const GRAMMAR_SCHEMA = "placement-grammar/v1";

const CONF_RANK = { high: 0, medium: 1, low: 2 };
const SIDE_DIRS = Object.freeze(["+x", "-x", "+z", "-z"]);

/** The kit's own don't-trust flag: a value-flagged entry never binds anything. */
const usable = (e) => e?.valueCheck?.verdict !== "flagged-mismatch";

/**
 * Deterministic candidate order: whereUsed-SPECIFICITY first (fewer terms = a more specific claim,
 * `kit-verification-shading-offset`), then confidence (high > medium > low), then block id — a
 * total order, so the binding is reproducible byte-for-byte.
 */
export function rankCandidates(entries) {
  return [...entries].sort((a, b) =>
    (a.whereUsed.length - b.whereUsed.length) ||
    ((CONF_RANK[a.confidence] ?? 2) - (CONF_RANK[b.confidence] ?? 2)) ||
    String(a.block).localeCompare(String(b.block))
  );
}

/**
 * Bind kit entries (NAMED space) to the feature classes. Cube entries only for frame/panel/course;
 * fixture/rail entries only for opening treatments. A feature with no candidate gets a null binding
 * plus a `skipped` row — never a throw (a kit-less subject degrades to a recorded no-op).
 * @param {object[]} kitEntries  the kit record's `kit` array
 * @param {{bandNames:string[]}} opts  derived wall-band names (zone-map order)
 * @returns {{frame:object|null, panels:Record<string,object|null>, course:object|null,
 *            openingTreatments:object[], skipped:{feature:string,reason:string}[]}}
 */
export function bindKit(kitEntries, { bandNames }) {
  const entries = (kitEntries ?? []).filter(usable);
  const cubes = entries.filter((e) => e.formClass === "cube");
  const skipped = [];
  const pick = (feature, cands) => {
    const ranked = rankCandidates(cands);
    if (!ranked.length) { skipped.push({ feature, reason: "no-candidate" }); return null; }
    return ranked[0];
  };
  const frame = pick("frame", cubes.filter((e) => e.whereUsed.includes("trim")));
  const panels = {};
  for (const band of bandNames) {
    // fields sit BETWEEN frame lines — the frame block can never also be the panel
    panels[band] = pick(`panel:${band}`,
      cubes.filter((e) => e.whereUsed.includes(band) && e.block !== frame?.block));
  }
  const course = pick("course", cubes.filter((e) => e.whereUsed.includes("roof")));
  const openingTreatments = rankCandidates(entries.filter(
    (e) => (e.formClass === "fixture" || e.formClass === "rail") && e.whereUsed.includes("openings")));
  return { frame, panels, course, openingTreatments, skipped };
}

/** Block-id vocabulary fact, not a subject constant: the last underscore segment names the item. */
const isDoorBlock = (block) => bareBlock(block).split("_").pop() === "door";

/**
 * Bind each opening INSTANCE to its declared treatment: door-kind openings take the door candidate;
 * window-kind openings take the highest-ranked non-door candidate. Bindings only — T-099 applies
 * them (with states); the grammar's placement list carries no fixtures.
 * @param {object[]} instances  [{dir, kind, bbox, cells, dressing}]
 * @param {object[]} treatments  ranked openings-tagged fixture/rail kit entries
 */
export function bindOpenings(instances, treatments) {
  const door = treatments.find((t) => isDoorBlock(t.block)) ?? null;
  const windowT = treatments.find((t) => !isDoorBlock(t.block)) ?? null;
  return instances.map((inst) => ({
    ...inst,
    treatment: (inst.kind === "door" ? door : windowT)?.block ?? null,
    candidates: treatments.map((t) => t.block),
  }));
}

/**
 * THE GRAMMAR. Everything downstream of the binding runs in SHIPPED space: `sub` is the one
 * renaming point (value-true substitution ∘ kit overrides — buildSkin's `subK`), applied ONLY to
 * the kit-bound blocks; `policy` (zone → {dominant, preserve}) is already shipped-space (the
 * durable-skin record's `fill.policy`).
 *
 * Steps: classify frame lines → paint them with the frame block, diffing no-ops and RESPECTING
 * kept declared secondaries (preserve ∧ run — zoneFill's exact keep rule via the shared `inRun`) →
 * realize fields + roof courses by running zoneFill over the frame-painted solid view →
 * enumerate field instances + opening bindings. `placements` = frame paint ++ fill placements.
 *
 * @param {import("../view/occupancy.mjs").Occupancy} occ  the shipped build's occupancy
 * @param {{kit:object[], bandNames:string[], policy:Record<string,{dominant:string,preserve?:string[]}>,
 *          zoneOf:(voxel:number[])=>string, floorLines:number[], upperTop:number,
 *          roofKeys:Set<string>, sideDirs?:string[], sub?:(b:string)=>string, minRun?:number}} opts
 */
export function placementGrammar(occ, {
  kit, bandNames, policy, zoneOf, floorLines, upperTop, roofKeys,
  sideDirs = SIDE_DIRS, sub = (b) => b, minRun = 2,
}) {
  if (typeof zoneOf !== "function") throw new Error("placementGrammar: opts.zoneOf must be a function");
  if (!policy || typeof policy !== "object") throw new Error("placementGrammar: opts.policy must be a zone→policy map");
  const solid = solidOccupancy(occ);
  const geom = { floorLines, upperTop, roofKeys };

  // --- bind (named space) → shipped space, the one renaming point -------------------------------
  const bindings = bindKit(kit, { bandNames });
  const ship = (entry) => (entry ? bareBlock(sub(bareBlock(entry.block))) : null);
  const shipped = {
    frame: ship(bindings.frame),
    panels: Object.fromEntries(bandNames.map((b) => [b, ship(bindings.panels[b])])),
    course: ship(bindings.course),
  };

  // --- frame lines → frame block (diffed; kept declared secondaries respected) -------------------
  const frame = frameLines(solid, geom);
  const preserveOf = new Map(Object.entries(policy).map(
    ([z, p]) => [z, new Set((p.preserve ?? []).map(bareBlock))]));
  const memo = new Map();
  const framePlacements = [];
  let painted = 0, respected = 0, alreadyFrame = 0;
  if (shipped.frame) {
    for (const key of frame.cells.keys()) {
      const cur = bareBlock(solid.cells.get(key));
      if (cur === shipped.frame) { alreadyFrame++; continue; }
      const voxel = key.split(",").map(Number);
      const pset = preserveOf.get(zoneOf(voxel));
      if (pset?.has(cur) && inRun(solid, key, cur, minRun, memo)) { respected++; continue; }
      framePlacements.push({ op: "voxel", pos: voxel, block: `minecraft:${shipped.frame}` });
      painted++;
    }
  }

  // --- fields + courses through the fill's OWN contract (the T-090-01 survival proof) -----------
  const occPrime = overlayPlacements(solid, framePlacements);
  const fill = zoneFill(occPrime, { zoneOf, zones: policy, skin: "exposure", minRun });
  const frameKeySet = new Set(frame.cells.keys());
  const frameRefilled = fill.placements.reduce(
    (n, p) => n + (frameKeySet.has(p.pos.join(",")) ? 1 : 0), 0);

  // --- preconditions (reported, runner-enforced) -------------------------------------------------
  const preconditions = { frameInPreserve: {}, bindingAgreesWithPolicy: {} };
  for (const band of bandNames) {
    const p = policy[band];
    preconditions.frameInPreserve[band] = !shipped.frame || !p ? null
      : bareBlock(p.dominant) === shipped.frame ||
        (p.preserve ?? []).map(bareBlock).includes(shipped.frame);
    preconditions.bindingAgreesWithPolicy[band] = shipped.panels[band] && p
      ? bareBlock(p.dominant) === shipped.panels[band] : null;
  }
  preconditions.bindingAgreesWithPolicy.roof = shipped.course && policy.roof
    ? bareBlock(policy.roof.dominant) === shipped.course : null;

  // --- instances: bounded fields per elevation + opening bindings (the T-099 handoff) -----------
  const fields = fieldInstances(solid, frame, { ...geom, dirs: sideDirs });
  const openingInstances = [];
  for (const dir of sideDirs) {
    for (const o of openings(solid, dir)) openingInstances.push({ dir, ...o });
  }
  const boundOpenings = bindOpenings(openingInstances, bindings.openingTreatments);

  return {
    schema: GRAMMAR_SCHEMA,
    bindings: {
      frame: bindings.frame?.block ?? null,
      panels: Object.fromEntries(bandNames.map((b) => [b, bindings.panels[b]?.block ?? null])),
      course: bindings.course?.block ?? null,
      openingTreatments: bindings.openingTreatments.map((t) => t.block),
      skipped: bindings.skipped,
    },
    shipped,
    frame: { counts: frame.counts, painted, respected, alreadyFrame, placements: framePlacements },
    fill,
    frameRefilled,
    fields,
    openings: boundOpenings,
    placements: [...framePlacements, ...fill.placements],
    preconditions,
  };
}
