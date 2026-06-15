// Wall-skin pass — the constructed envelope's SKIN AS CONSTRUCTION, not recolor (T-160-02, story S-160,
// epic E-38). T-160-01 gave the wall a clean ENVELOPE (constructWalls: a solid ring floor→eave) — but it
// came out MONOTONE, so the cottage capped on PALETTE ("no stone base, plaster, or timber contrast"). The
// fix is to drive the already-built articulation brushes from the program's DECLARED wall roles, applied as
// RELIEF over the envelope: per-storey field material, clinker courses on a boarded upper, dressed-stone
// quoins at the corners, limewash banding, a plinth base course, and dressed openings. Grammar, not a
// single-block fill (the recolor-collapse the diagnosis named).
//
// THE PLAN IS DERIVED FROM ROLES, NOT FROM A `facade` RECORD. The recognition programs are all facade-free,
// so compile.mjs's facadeArticulationPlan emits nothing for them; this module reads walls.{ground,upper,
// dressing}/plinth/openings — present on every program — and lowers them into the same {brush,params} shape
// applyArticulation consumes, with roleBlock resolving every role (no derived/suffixed names, no
// per-building constants). Brushes a role/pack does not support are simply omitted (role-presence gating =
// graceful degradation: limewash only fires on a pack that declares wall.finish.limewash; gatehouse, with
// no program/pack, gets the bare envelope back unchanged).
//
// THIS TICKET WIRES — it invents no geometry primitive. Every technique is reached through applyArticulation
// (the registry door) or its direct exported fn (dressOpenings). PURE — no GL/IO/Date/random; runs under the
// src/**/*.test.mjs glob.

import { applyArticulation } from "../recognition/compile.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
// NOTE: opening-dressing is a registry technique; a src/view brush may not import it directly (the
// brush-door tripwire). The dressing step is a DEPENDENCY-INJECTED seam — the impure runner (experiments/,
// unswept) passes in extractApertures/dressOpenings; the relief skin reaches every other brush through the
// registry door (applyArticulation → getBrush). Absent the injection, wallSkin applies the relief skin only.

const FACES = Object.freeze(["+x", "-x", "+z", "-z"]);
const bare = (b) => (typeof b === "string" ? b.replace(/^minecraft:/, "") : b);

/** Block id for a role, or null when the pack does not declare it (roleBlock throws — this is the safe
 *  presence probe the gating uses). PURE. */
function tryRole(pack, role) {
  if (!role) return null;
  return pack.palette.find((p) => p.role === role)?.block ?? null;
}

/** Boarded-material test for the clinker gate: planks/log read as the tarred-boarding upper; stone does
 *  not. PURE. */
export function isBoardFamily(block) {
  const b = bare(block) ?? "";
  return /_planks$/.test(b) || /_log$/.test(b) || b.includes("plank");
}

/** The weather face for limewash / the front: a door's wall if one is declared, else the north face. */
function weatherFace(mass) {
  const d = (mass.openings ?? []).find((o) => o.kind === "door");
  return d?.wall ?? "-z";
}

/**
 * Build dressOpenings treatments {slots:{infill,shutter,door,light,frame}} from the pack's opening roles.
 * Each slot is present only when its role resolves (no per-subject constants); the frame slot falls back to
 * dressOpenings' own perimeter census when absent. PURE.
 * @param {object} pack a style-pack/v1
 * @returns {{slots:object}}
 */
export function packTreatments(pack) {
  const slots = {};
  const set = (slot, block) => { if (block) slots[slot] = { block }; };
  set("door", tryRole(pack, "door.main"));
  set("shutter", tryRole(pack, "window.shutter"));
  set("infill", tryRole(pack, "window.infill") ?? tryRole(pack, "window.glazing"));
  set("frame", tryRole(pack, "opening.lintel"));
  const lantern = (pack.decoration ?? []).find((d) => /lantern/.test(d.block ?? ""))?.block;
  set("light", lantern);
  return { slots };
}

/**
 * Lower a program's declared wall roles into an ordered articulation plan ({brush,params}[]), every role
 * resolved through roleBlock/tryRole. Apply order: per-storey field → clinker (boarded upper) → quoin →
 * limewash → plinth base course. zoneOf closures are runtime (the loop's plan is computed, not a committed
 * replay artifact, so purity-as-data is not required here). PURE.
 * @param {object} program a building-program/v1
 * @param {object} pack a style-pack/v1
 * @param {{floor:number, eaveY:number}} bands
 * @returns {{brush:string, params:object}[]}
 */
export function wallSkinPlan(program, pack, { floor, eaveY } = {}) {
  const mass = program?.masses?.[0];
  if (!mass) return [];
  const sh = mass.storeyHeight ?? 4;
  const storeyLine = floor + sh;
  const ground = tryRole(pack, mass.walls?.ground?.role);
  const upper = tryRole(pack, mass.walls?.upper?.role);
  const dressing = tryRole(pack, mass.walls?.dressing?.role);
  const limewash = tryRole(pack, "wall.finish.limewash");
  const plinthBlock = mass.plinth ? tryRole(pack, mass.plinth.role) : null;
  const preserve = dressing ? [dressing] : [];
  const plan = [];

  // 1. per-storey field material (ONLY when ground and upper are genuinely different — no needless recolor)
  if (ground && upper && bare(ground) !== bare(upper)) {
    plan.push({ brush: "surface.fill", params: {
      zoneOf: (pos) => (pos[1] < storeyLine ? "ground" : "upper"),
      zones: { ground: { dominant: ground, preserve }, upper: { dominant: upper, preserve } },
      skin: "exposure", minRun: 2,
    } });
  }

  // 2. clinker field course — proud laps on a BOARDED upper storey (skip stone-uppered masses)
  if (upper && isBoardFamily(upper)) {
    plan.push({ brush: "surface.clinker", params: {
      board: upper, zone: "upper", faces: FACES,
      zoneOf: (pos) => (pos[1] >= storeyLine ? "upper" : "ground"),
    } });
  }

  // 3. quoins — dressed-stone stepped run up every corner column, full wall-band height
  if (dressing) {
    plan.push({ brush: "quoin", params: { material: dressing, faces: FACES, run: Math.max(1, eaveY - floor + 1) } });
  }

  // 4. limewash banding — only when the pack declares the finish (saltcrag yes, rustic no); one weather
  //    face, as a PARTIAL accent coat (coverage<1 → broken runs = banding, not a solid whitewash; the
  //    pack rationale: "an accent of thrift... spared for where weather drives hardest"). preserve keeps
  //    the dressing so quoins survive the coat. Anti-flood: never the whole face (the ticket's caution).
  if (limewash) {
    plan.push({ brush: "surface.limewash", params: {
      block: limewash, aspects: [weatherFace(mass)], coverage: 0.5, minRun: 2, preserve,
    } });
  }

  // 5. plinth — a proud base course in the dressing/plinth material (eave-overhang geometry at the floor row)
  if (plinthBlock) {
    plan.push({ brush: "eave-overhang", params: { material: plinthBlock, faces: FACES, depth: 1, eaveRow: floor } });
  }

  return plan;
}

/** Overlay placements onto an occupancy, last-writer-wins by position (the registry overlay rule); a relief
 *  cell drops the fronted cell's form/state (relief is a plain cube/fixture). Returns a fresh occupancy. */
function overlay(occ, placements) {
  const byKey = new Map();
  for (const [k, b] of occ.cells) byKey.set(k, { pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  for (const p of placements) {
    byKey.set(p.pos.join(","), { pos: [...p.pos], block: p.block, ...(p.state ? { state: { ...p.state } } : {}) });
  }
  return occupancyFromCells([...byKey.values()]);
}

/**
 * THE BRUSH. Skin a constructed wall envelope as construction-centric relief from the program's declared
 * roles: relief plan (per-storey material, clinker, quoins, limewash, plinth) via applyArticulation, then —
 * when the dressing seam is injected — dressOpenings over the carved holes. occ → occ. No program OR no
 * pack ⇒ occ unchanged (gatehouse). PURE.
 *
 * The dressing functions are DEPENDENCY-INJECTED (the brush-door rule: a src/view brush may not import the
 * opening-dressing technique). The runner passes `{ extractApertures, dressOpenings }`; absent them, the
 * relief skin is applied alone (still construction — quoins/courses/material).
 *
 * @param {import("./occupancy.mjs").Occupancy} occ  a constructed envelope (constructWalls output)
 * @param {{program:object|null, pack:object|null, floor?:number, eaveY:number,
 *          extractApertures?:Function, dressOpenings?:Function}} params
 * @returns {import("./occupancy.mjs").Occupancy}
 */
export function wallSkin(occ, { program, pack, floor, eaveY, extractApertures, dressOpenings } = {}) {
  if (!occ?.bounds || !program || !pack) return occ;
  if (eaveY === undefined) throw new Error("wallSkin: eaveY required");
  const f = floor ?? occ.bounds.min[1];

  let occN = occ;
  const plan = wallSkinPlan(program, pack, { floor: f, eaveY });
  if (plan.length) {
    const { placements } = applyArticulation(occ, plan);
    // CAP TO THE WALL BAND: the skin is the wall's, never the roof's (roof-prism is T-160-03's concern).
    // limewashAspect/zoneFill have no y-gate of their own, so a whole-aspect coat or an "upper" zone would
    // otherwise climb a gable slope on the weather face — filter once here rather than per brush.
    const inBand = placements.filter((p) => p.pos[1] >= f && p.pos[1] <= eaveY);
    if (inBand.length) occN = overlay(occ, inBand);
  }

  // opening dressing (injected seam) — read the envelope's carved holes, dress them in the pack's joinery
  if (typeof extractApertures === "function" && typeof dressOpenings === "function") {
    const apertures = extractApertures(occN);
    if (apertures.length) {
      const { placements: dr } = dressOpenings(occN, apertures, packTreatments(pack));
      if (dr.length) occN = overlay(occN, dr);
    }
  }
  return occN;
}
