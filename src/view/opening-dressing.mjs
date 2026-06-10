// Opening-dressing op (T-099-01, story S-099, epic E-26) — walk the declared openings, apply the
// kit's treatment: fence infill in the aperture, trapdoor shutters flanking, lintel/sill from the
// frame block, the door leaf + lantern. The witnessed case: the cottage concept's windows have
// shutters and lattice infill; the shipped build's windows are bare holes — or worse, sealed panes
// (the durable skin filled them; probed in the T-099 research).
//
// CONTRACT SHAPE (the E-25 openingRegions precedent): apertures are MEASURED on a reference
// occupancy — the raw pre-seal build, whose openings the concept declared — and APPLIED to the
// current target. There is no air op, but last-write-wins replacement is in the contract
// (expandArtifact: block/form/state replace together), so a sealed pane cell is RE-OPENED by
// appending the fence over it: the cell turns rail, the solid view grows a hole, and `openings`
// finds the window again — dressed.
//
// WORLD-SPACE CORE: shutters sit one cell proud of the facade and EXPAND the bounds, which would
// shift every uv frame between runs. So `extractApertures` converts each opening to world terms
// once, and `dressOpenings` probes `occ.solid` along the depth axis directly — no projection of
// the target, idempotent re-runs.
//
// CONFLICT HONESTY (the E-26 rule): every treatment slot either applies or names its conflict and
// the chosen reduction — never silently dropped, never silently crammed.
//
// ORIENTATION GROUND TRUTH: an OPEN trapdoor's panel occupies the cell edge OPPOSITE its `facing`
// (probed via render, T-099 plan step 1: facing north → strip on the south edge). A shutter flat
// against a wall therefore uses facing = the wall's own outward compass. Fence/bars/pane infill
// carries explicit connection booleans along the opening's run axis (no neighbor updates in the
// in-memory world — T-097). The states emitted here stay inside the CARD_ROWS-proven vocabulary
// (asserted in tests); stairs are never placed (lens-invisible, `fixture-path-proven-stairs-lens-gap`).
//
// PURE — no GL, no network, no Date/random; committed-JSON loads only (the loadBlockTable idiom).
// Runs under the `src/**/*.test.mjs` glob. The impure runner (renders, records, frames) is
// benchmarks/sculpture/dress-openings.mjs.

import { solidOccupancy, bareBlock } from "./occupancy.mjs";
import { projectSurface, gridMaskOf, orthoSpec, cellWorldPos } from "./surface-grid.mjs";
import { openings } from "./structural-read.mjs";
import { SIDE_FACES } from "./shell-integrity.mjs";
import { derivedFormClass, loadBlockVocab } from "../form/kit.mjs";

/** Face dir → the wall's outward compass direction (MC: +z=south, −z=north, +x=east, −x=west). */
export const COMPASS = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });

/** Trapdoor `facing` whose OPEN panel lies flat against the wall behind the shutter cell. The open
 *  panel occupies the cell edge OPPOSITE `facing` (render-probed), so facing = the wall's compass. */
export const SHUTTER_FACING = COMPASS;

/** Rail-infill connection booleans along the opening's run axis: faces ±z run along x (east/west),
 *  faces ±x run along z (north/south). Both patterns are CARD_ROWS-proven fence rows. */
export const FENCE_RUN_STATE = Object.freeze({
  "+x": Object.freeze({ north: "true", south: "true" }),
  "-x": Object.freeze({ north: "true", south: "true" }),
  "+z": Object.freeze({ east: "true", west: "true" }),
  "-z": Object.freeze({ east: "true", west: "true" }),
});

/** Slot applicability by opening kind — fixed matrix, not policy. */
const KIND_SLOTS = Object.freeze({
  window: Object.freeze(["infill", "shutterLeft", "shutterRight", "lintel", "sill"]),
  door: Object.freeze(["door", "lintel", "light"]),
});

const CONF_RANK = { high: 0, medium: 1, low: 2 };

function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/**
 * Species-matched fence for a wooden fixture block: "spruce_trapdoor" → "spruce_fence", iff that
 * fence exists in the survival vocabulary. The deterministic infill fallback when the kit has no
 * rail entry (the cottage declared its window grille `unidentified` — honesty, not absence of a
 * grille). PURE.
 * @param {string} block bare fixture id
 * @param {Set<string>} vocabNames committed survival vocabulary
 * @returns {string|null}
 */
export function speciesFence(block, vocabNames) {
  const m = /^([a-z_]+?)_(?:trapdoor|door)$/.exec(bareBlock(block) ?? "");
  if (!m) return null;
  const fence = `${m[1]}_fence`;
  return vocabNames.has(fence) ? fence : null;
}

/**
 * Map a kit/v1 record to treatment SLOTS (design D4): entries with "openings" in whereUsed route by
 * ground-truth form class + name family — rail → infill, *_trapdoor → shutter, *_door → door,
 * lantern family → light; the frame block comes from the cube entry covering "trim". No rail entry
 * ⇒ the infill is DERIVED as the shutter's species fence (recorded in `derivations`). Slots that
 * cannot be filled land in `unfulfilled`; openings-entries no family claims land in `ignored`.
 * Highest confidence wins a slot, first-seen breaks ties. PURE (committed-JSON vocab load only).
 * @param {{kit:object[]}} kitRecord a kit/v1 record (or any {kit:[...]} shape)
 * @param {{vocab?:{names:Set<string>}}} [opts] injectable for tests
 * @returns {{slots:object, derivations:object[], unfulfilled:object[], ignored:object[]}}
 */
export function treatmentsFromKit(kitRecord, opts = {}) {
  const entries = Array.isArray(kitRecord?.kit) ? kitRecord.kit : [];
  const vocab = opts.vocab ?? loadBlockVocab();
  const slots = { infill: null, shutter: null, door: null, light: null, frame: null };
  const derivations = [];
  const unfulfilled = [];
  const ignored = [];

  const better = (a, b) => !b || CONF_RANK[a.confidence] < CONF_RANK[b.confidence];
  const take = (slot, entry, source) => {
    if (better(entry, slots[slot]?.entry)) slots[slot] = { block: entry.block, source, entry };
  };

  for (const e of entries) {
    if (!e || !Array.isArray(e.whereUsed)) continue;
    const cls = derivedFormClass(e.block);
    if (cls === "cube") {
      if (e.whereUsed.includes("trim")) take("frame", e, "kit-trim");
      continue;
    }
    if (!e.whereUsed.includes("openings")) continue;
    const b = bareBlock(e.block);
    if (cls === "rail") take("infill", e, "kit-rail");
    else if (b.endsWith("_trapdoor")) take("shutter", e, "kit-fixture");
    else if (b.endsWith("_door")) take("door", e, "kit-fixture");
    else if (b.includes("lantern")) take("light", e, "kit-fixture");
    else ignored.push({ block: e.block, reason: "no treatment family for this fixture" });
  }

  if (!slots.infill && slots.shutter) {
    const fence = speciesFence(slots.shutter.block, vocab.names);
    if (fence) {
      slots.infill = { block: fence, source: "derived-species-fence" };
      derivations.push({
        slot: "infill", block: fence, from: slots.shutter.block,
        reason: "no rail entry in kit; species-matched fence derived from the shutter block " +
          "(the kit declared the window grille unidentified)",
      });
    }
  }
  for (const [slot, v] of Object.entries(slots)) {
    if (v) { delete v.entry; continue; }
    unfulfilled.push({ slot, reason: slot === "frame"
      ? "no cube kit entry covers trim (perimeter census is the per-opening fallback)"
      : "no kit entry routes to this slot" });
    delete slots[slot];
  }
  return { slots, derivations, unfulfilled, ignored };
}

/**
 * Extract the declared apertures of a REFERENCE occupancy in WORLD terms (design D1/D3): per
 * `openings(refOcc, dir)` hit, the air cells inside the bbox, the flank/lintel/sill bands around
 * it, and the solid perimeter ring (the wall-plane probe set) — each as `{au, av}` world
 * coordinates on the face's (axisU, axisV), depth left free. `region` is the full-depth world AABB
 * (the openingRegions twin). PURE.
 * @param {import("./occupancy.mjs").Occupancy} refOcc
 * @param {string[]} [dirs]
 * @returns {object[]} apertures (see structure.md)
 */
export function extractApertures(refOcc, dirs = SIDE_FACES) {
  if (!refOcc.bounds) return [];
  const solid = solidOccupancy(refOcc);
  if (!solid.bounds) return [];
  const out = [];
  for (const dir of dirs) {
    const spec = orthoSpec(dir);
    const grid = projectSurface(solid, dir);
    const mask = gridMaskOf(grid);
    const at = (u, v) => (u >= 0 && u < mask.w && v >= 0 && v < mask.h ? mask.data[v * mask.w + u] : -1);
    const uvWorld = (u, v) => {
      const pos = cellWorldPos(solid, spec, u, v, 0);
      return { au: pos[spec.axisU], av: pos[spec.axisV] };
    };
    const wLo = solid.bounds.min[spec.axisW];
    const wHi = solid.bounds.max[spec.axisW];
    for (const o of openings(refOcc, dir)) {
      const { u0, v0, u1, v1 } = o.bbox;
      const cells = [], perim = [], lintel = [], sill = [];
      const flanks = { left: [], right: [] };
      for (let v = v0; v <= v1; v++) {
        for (let u = u0; u <= u1; u++) {
          (at(u, v) === 0 ? cells : perim).push(uvWorld(u, v)); // solid inside bbox (arch corner) = wall
        }
        if (at(u0 - 1, v) === 1) perim.push(uvWorld(u0 - 1, v));
        if (at(u1 + 1, v) === 1) perim.push(uvWorld(u1 + 1, v));
        flanks.left.push(uvWorld(u0 - 1, v));
        flanks.right.push(uvWorld(u1 + 1, v));
      }
      for (let u = u0 - 1; u <= u1 + 1; u++) {
        if (at(u, v0 - 1) === 1) perim.push(uvWorld(u, v0 - 1));
        if (at(u, v1 + 1) === 1) perim.push(uvWorld(u, v1 + 1));
        lintel.push(uvWorld(u, v0 - 1));
        sill.push(uvWorld(u, v1 + 1));
      }
      const a = cellWorldPos(solid, spec, u0, v0, wLo);
      const b = cellWorldPos(solid, spec, u1, v1, wHi);
      out.push({
        dir, kind: o.kind, bbox: { ...o.bbox }, cells, flanks, lintel, sill, perim,
        region: {
          min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])],
          max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])],
        },
      });
    }
  }
  return out;
}

/**
 * THE DRESSING OP (design D2/D3/D5/D6). Apply `treatments.slots` to each aperture on the TARGET
 * occupancy, entirely in world space. Wall plane = modal first-solid depth over the perimeter ring
 * probed on the target (sealed/open/mixed panes all resolve); pane solid → REPLACED (re-opened),
 * air → added, same-fixture → already-dressed (idempotent). Shutters need a solid backing jamb at
 * the plane and a free cell one step out. Lintel/sill recolor SOLID cells only, and only when the
 * block actually changes. Doors: 1 wide → single leaf, 2 → hinge left/right pair, wider → centered
 * single leaf with the named reduction; height ≥ 2 required. Every non-applied applicable slot has
 * a named conflict + reduction. Returns deterministic placements (aperture order, slot order,
 * row-major cells) plus per-opening reports and the placement-footprint `regions` (design D8 — the
 * allow-list extension consumers compose over `openingRegions`). PURE.
 * @param {import("./occupancy.mjs").Occupancy} targetOcc
 * @param {object[]} apertures from {@link extractApertures}
 * @param {{slots:object}} treatments from {@link treatmentsFromKit}
 * @returns {{placements:object[], perOpening:object[], regions:object[], stats:object}}
 */
export function dressOpenings(targetOcc, apertures, treatments) {
  if (!targetOcc?.bounds) throw new Error("dressOpenings: target occupancy is empty");
  const slots = treatments?.slots ?? {};
  const placements = [];
  const perOpening = [];
  const regions = [];
  const seenPos = new Set();
  let alreadyDressed = 0;

  for (const ap of apertures) {
    const spec = orthoSpec(ap.dir);
    const { min, max } = targetOcc.bounds;
    const near = spec.near === "max";
    const wStart = near ? max[spec.axisW] : min[spec.axisW];
    const wEnd = near ? min[spec.axisW] : max[spec.axisW];
    const step = near ? -1 : 1;
    const posAt = (au, av, w) => {
      const pos = [0, 0, 0];
      pos[spec.axisU] = au; pos[spec.axisV] = av; pos[spec.axisW] = w;
      return pos;
    };
    const probe = ({ au, av }) => {
      for (let w = wStart; near ? w >= wEnd : w <= wEnd; w += step) {
        if (targetOcc.solid(...posAt(au, av, w))) return w;
      }
      return null;
    };

    const applicable = KIND_SLOTS[ap.kind] ?? [];
    const report = { dir: ap.dir, kind: ap.kind, bbox: { ...ap.bbox }, region: ap.region, planeW: null,
      applied: Object.fromEntries(applicable.map((s) => [s, 0])), conflicts: [] };
    const conflict = (slot, name, reduction) => report.conflicts.push({ slot, name, reduction });
    perOpening.push(report);

    // --- wall plane: modal perimeter depth (nearest-to-camera breaks ties — deterministic) -------
    const depths = ap.perim.map(probe).filter((w) => w !== null);
    if (!depths.length) { conflict("opening", "no-wall-plane", "opening-skipped"); continue; }
    const tally = new Map();
    for (const w of depths) tally.set(w, (tally.get(w) || 0) + 1);
    let planeW = null, bestN = -1;
    for (const [w, n] of tally) {
      if (n > bestN || (n === bestN && Math.abs(w - wStart) < Math.abs(planeW - wStart))) { planeW = w; bestN = n; }
    }
    if (depths.some((w) => w !== planeW)) conflict("opening", "irregular-jamb-depth", "modal-plane-used");
    report.planeW = planeW;
    const wOut = planeW - step; // one cell toward the camera — proud of the facade

    const opPositions = []; // region footprint accumulator
    const place = (pos, block, state) => {
      const key = pos.join(",");
      if (seenPos.has(key)) { conflict("opening", "duplicate-position", "cell-skipped"); return false; }
      seenPos.add(key);
      placements.push(state === undefined
        ? { op: "voxel", pos, block: namespaced(block) }
        : { op: "voxel", pos, block: namespaced(block), state: { ...state } });
      opPositions.push(pos);
      return true;
    };
    /** Place-or-skip at an aperture-plane cell: solid pane → replace; same fixture → idempotent skip. */
    const placeAtPane = (slot, pos, block, state) => {
      const cur = targetOcc.block(...pos);
      if (cur !== null && !targetOcc.solid(...pos)) {
        if (bareBlock(cur) === bareBlock(block)) { alreadyDressed++; opPositions.push(pos); return true; }
        conflict(slot, "occupied-by-other-fixture", "cell-skipped");
        return false;
      }
      return place(pos, block, state); // air (add) or solid (replace — re-opens a sealed pane)
    };

    // --- fence infill in the aperture (windows) ---------------------------------------------------
    if (applicable.includes("infill")) {
      if (slots.infill) {
        for (const { au, av } of ap.cells) {
          if (placeAtPane("infill", posAt(au, av, planeW), slots.infill.block, FENCE_RUN_STATE[ap.dir])) {
            report.applied.infill++;
          }
        }
      } else conflict("infill", "no-infill-treatment", "aperture-left-open");
    }

    // --- trapdoor shutters flanking (windows), all-or-none per side -------------------------------
    for (const side of ["left", "right"]) {
      const slot = side === "left" ? "shutterLeft" : "shutterRight";
      if (!applicable.includes(slot)) continue;
      if (!slots.shutter) { conflict(slot, "no-shutter-treatment", "shutter-dropped"); continue; }
      const flank = ap.flanks[side];
      const noJamb = flank.some(({ au, av }) => !targetOcc.solid(...posAt(au, av, planeW)));
      const blocked = flank.some(({ au, av }) => targetOcc.has(...posAt(au, av, wOut)));
      const already = flank.every(({ au, av }) => {
        const cur = targetOcc.block(...posAt(au, av, wOut));
        return cur !== null && bareBlock(cur) === bareBlock(slots.shutter.block);
      });
      if (already) { alreadyDressed += flank.length; flank.forEach(({ au, av }) => opPositions.push(posAt(au, av, wOut))); report.applied[slot] = flank.length; continue; }
      if (noJamb) { conflict(slot, `shutter-no-jamb-${side}`, "shutter-dropped"); continue; }
      if (blocked) { conflict(slot, `shutter-blocked-${side}`, "shutter-dropped"); continue; }
      for (const { au, av } of flank) {
        if (place(posAt(au, av, wOut), slots.shutter.block,
          { facing: SHUTTER_FACING[ap.dir], half: "bottom", open: "true" })) report.applied[slot]++;
      }
    }

    // --- lintel / sill: recolor SOLID plane cells to the frame block ------------------------------
    let frameBlock = slots.frame?.block ?? null;
    if (!frameBlock) {
      const census = new Map();
      for (const { au, av } of ap.perim) {
        const pos = posAt(au, av, planeW);
        if (!targetOcc.solid(...pos)) continue;
        const b = bareBlock(targetOcc.block(...pos));
        census.set(b, (census.get(b) || 0) + 1);
      }
      for (const [b, n] of census) if (frameBlock === null || n > census.get(frameBlock)) frameBlock = b;
    }
    for (const band of ["lintel", "sill"]) {
      if (!applicable.includes(band)) continue;
      if (!frameBlock) { conflict(band, "no-frame-block", `${band}-dropped`); continue; }
      for (const { au, av } of ap[band]) {
        const pos = posAt(au, av, planeW);
        if (!targetOcc.solid(...pos)) continue; // never add floating frame mass
        if (bareBlock(targetOcc.block(...pos)) === frameBlock) { report.applied[band]++; continue; }
        if (place(pos, frameBlock)) report.applied[band]++;
      }
    }

    // --- door leaf/leaves (door kind) --------------------------------------------------------------
    if (applicable.includes("door")) {
      if (!slots.door) conflict("door", "no-door-treatment", "left-undressed");
      else {
        const avs = ap.cells.map((c) => c.av);
        const yBottom = Math.min(...avs);
        const height = new Set(avs).size;
        const bottomCols = [...new Set(ap.cells.filter((c) => c.av === yBottom).map((c) => c.au))]
          .sort((a, b) => a - b);
        const hasUpper = (au) => ap.cells.some((c) => c.au === au && c.av === yBottom + 1);
        if (height < 2 || !bottomCols.some(hasUpper)) {
          conflict("door", "door-too-short", "left-undressed");
        } else {
          let leaves;
          if (bottomCols.length === 1) leaves = [{ au: bottomCols[0], hinge: "left" }];
          else if (bottomCols.length === 2) {
            leaves = [{ au: bottomCols[0], hinge: "left" }, { au: bottomCols[1], hinge: "right" }];
          } else {
            const mid = bottomCols[Math.floor(bottomCols.length / 2)];
            leaves = [{ au: mid, hinge: "left" }];
            conflict("door", "door-wide-aperture", "centered-single-leaf");
          }
          for (const { au, hinge } of leaves) {
            if (!hasUpper(au)) { conflict("door", "door-column-too-short", "leaf-skipped"); continue; }
            const base = { facing: COMPASS[ap.dir], hinge, open: "false" };
            const okL = placeAtPane("door", posAt(au, yBottom, planeW), slots.door.block, { ...base, half: "lower" });
            const okU = placeAtPane("door", posAt(au, yBottom + 1, planeW), slots.door.block, { ...base, half: "upper" });
            if (okL && okU) report.applied.door++;
          }
        }
      }
    }

    // --- lantern beside the door's top row (door kind) ---------------------------------------------
    if (applicable.includes("light") && slots.light) {
      const avTop = Math.max(...ap.cells.map((c) => c.av));
      const sides = [ap.flanks.right, ap.flanks.left].map((f) => f.find((c) => c.av === avTop)).filter(Boolean);
      let placed = false;
      for (const { au, av } of sides) {
        const pos = posAt(au, av, wOut);
        const cur = targetOcc.block(...pos);
        if (cur !== null && bareBlock(cur) === bareBlock(slots.light.block)) { alreadyDressed++; opPositions.push(pos); report.applied.light++; placed = true; break; }
        if (targetOcc.has(...pos)) continue;
        if (place(pos, slots.light.block, { hanging: "false" })) { report.applied.light++; placed = true; break; }
      }
      if (!placed) conflict("light", "light-no-space", "light-dropped");
    }

    // --- the opening's placement footprint (the allow-list extension, design D8) -------------------
    for (const { au, av } of ap.cells) opPositions.push(posAt(au, av, planeW));
    const rMin = [Infinity, Infinity, Infinity], rMax = [-Infinity, -Infinity, -Infinity];
    for (const p of opPositions) for (let i = 0; i < 3; i++) {
      if (p[i] < rMin[i]) rMin[i] = p[i];
      if (p[i] > rMax[i]) rMax[i] = p[i];
    }
    regions.push({ kind: ap.kind, dir: ap.dir, min: rMin, max: rMax });
  }

  const fullyDressed = perOpening.filter((r) => r.conflicts.length === 0).length;
  return {
    placements, perOpening, regions,
    stats: {
      openings: apertures.length, fullyDressed, placements: placements.length,
      conflicts: perOpening.reduce((n, r) => n + r.conflicts.length, 0), alreadyDressed,
    },
  };
}

/**
 * Pure append of dressing placements to an artifact: placements concatenated, `palette.manifest`
 * recomputed as the sorted union (rebuildArtifact precedent). Does NOT validate — callers run
 * assertArtifact (the round-trip pattern). PURE.
 * @param {object} artifact
 * @param {object[]} placements from {@link dressOpenings}
 * @returns {object} a fresh artifact object
 */
export function applyDressing(artifact, placements) {
  if (!artifact || typeof artifact !== "object") throw new Error("applyDressing: artifact required");
  if (!placements.length) return artifact;
  const manifest = [...new Set([...artifact.palette.manifest, ...placements.map((p) => p.block)])].sort();
  return {
    ...artifact,
    palette: { ...artifact.palette, manifest },
    placements: [...artifact.placements, ...placements],
  };
}
