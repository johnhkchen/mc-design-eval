// Steep-pitch gable roof — pitch classes ABOVE the stair block's native 45° (T-134-01, story
// S-134, epic E-33). The concepts' roofs read ~55–63°; if the vocabulary tops out at 45° every
// build comes out squat no matter how well proportions are read. Minecraft practice solves steep
// pitches with MIXED FULL-BLOCK/STAIR COURSES — the 2:1 stepping family: a stair tread atop
// every slope column, pitch−1 exposed full-block risers carrying the rise between treads.
//
// THE CONSTRUCTION IS THE PROVEN CORE: generateRoof's whole-step-edge rule already emits exactly
// this family at integer pitch ≥ 2 (the downhill drop ≤ h−1 / uphill rise ≥ h+1 conditions are
// pitch-agnostic). What this brush owns is the CONTRACT the legacy path never had:
//   • a declared class vocabulary — STEEP_PITCH_CLASSES = [2, 3] (≈63.4° / ≈71.6°);
//   • NAMED REFUSALS, never approximations (E-33 / the AC): non-integer classes (1.5 emits an
//     irregular slab/stair serration — not a stepping family), classes ≤ 1 (not steep —
//     roof.gable owns them), classes > 3 (reads as a wall), a missing stair family (a treadless
//     steep wedge is a cliff, not this idiom — the roofFamily full-block fallback deliberately
//     does NOT apply), and an off-stepping ridge ((ridgeY−eaveY) % pitch ≠ 0 would silently
//     flatten the last course into a pitch break);
//   • the STEEP INVARIANT, asserted on the emission: every non-cap slope column tops with a
//     straight bottom-half stair facing uphill — a tripwire against future generator drift.
// Steep hip/pyramid are NOT offered (corner stair states at multi-rise steps are unproven
// vocabulary); integer classes never land on half-steps, so no slab is ever required.
//
// PURE — no GL/IO/Date/random; byte-stable cell order (generateRoof's). Fail-loud spec gates.

import { generateRoof, gableRecord, STAIR_FACING } from "./roof-generate.mjs";

const isInt = (n) => Number.isInteger(n);
const isBlockId = (b) => typeof b === "string" && b.length > 0;

function fail(msg) { throw new Error(`roofSteepGableConstruct: ${msg}`); }

/** The realizable steep classes (rise:run above 45°), in registry-digest order. */
export const STEEP_PITCH_CLASSES = Object.freeze([2, 3]);

/** Named refusal reasons — exported data so the declaration is inspectable, not folklore. */
export const STEEP_REFUSALS = Object.freeze({
  nonInteger: "non-integer classes quantize onto half-steps and emit an irregular slab/stair serration — refused by construction, not approximated",
  shallow: "a class ≤ 1 is not steep — roof.gable owns 1 (stair) and 0.5 (slab)",
  cliff: "a class > 3 reads as a wall, not a roof",
  noStairs: "the steep stepping family needs a stair block — a treadless steep wedge is a cliff, and the full-block fallback is refused here, never silently applied",
  offStepping: "(ridgeY − eaveY) must be a multiple of the pitch class — an off-stepping ridge flattens the last course into a pitch break",
  unreachable: "the footprint cannot rise to ridgeY at this class — an unreachable ridge caps nothing (lower ridgeY: a below-apex ridge is an allowed plateau)",
  hip: "steep hip/pyramid are not offered — corner stair states at multi-rise steps are unproven vocabulary",
});

/** Uphill stair facing per side, downhill (eave) direction → facing of the tread on that side. */
const UPHILL_OF = Object.freeze({ "+x": "-x", "-x": "+x", "+z": "-z", "-z": "+z" });

/**
 * STEEP GABLE ROOF — ridge along `ridgeAxis`, symmetric pitch ∈ {@link STEEP_PITCH_CLASSES},
 * mixed full-block/stair courses; same spec shape as roof.gable, stricter contract.
 * @param {{footprint:{x0:number,x1:number,z0:number,z1:number}, ridgeAxis:"x"|"z",
 *          eaveY:number, ridgeY:number, pitch:number,
 *          blocks:{field:string, stairs:string, slab?:string|null}}} spec
 * @returns {{cells:{pos:number[],block:string,form?:string,state?:object}[],
 *            counts:{full:number,stairs:number,slabs:number,cap:number},
 *            capKeys:Set<string>, bandFloor:number, ridgeY:number}}
 */
export function roofSteepGableConstruct(spec) {
  const { footprint, ridgeAxis, eaveY, ridgeY, pitch, blocks } = spec ?? {};
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 > x1 || z0 > z1) fail("spec.footprint must be integer {x0≤x1, z0≤z1}");
  if (!isInt(eaveY)) fail("spec.eaveY must be an integer");
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail('spec.ridgeAxis must be "x"|"z"');
  if (!Number.isFinite(pitch) || pitch <= 1) fail(`spec.pitch ${pitch} is refused: ${STEEP_REFUSALS.shallow}`);
  if (!isInt(pitch)) fail(`spec.pitch ${pitch} is refused: ${STEEP_REFUSALS.nonInteger} (realizable: ${STEEP_PITCH_CLASSES.join(", ")})`);
  if (pitch > 3) fail(`spec.pitch ${pitch} is refused: ${STEEP_REFUSALS.cliff} (realizable: ${STEEP_PITCH_CLASSES.join(", ")})`);
  if (!isBlockId(blocks?.field)) fail("spec.blocks.field must be a non-empty block id");
  if (!isBlockId(blocks?.stairs)) fail(`spec.blocks.stairs is required: ${STEEP_REFUSALS.noStairs}`);
  if (blocks.slab != null && !isBlockId(blocks.slab)) fail("spec.blocks.slab must be a block id or null");
  if (!isInt(ridgeY) || ridgeY <= eaveY) fail("spec.ridgeY must be an integer above spec.eaveY");
  if ((ridgeY - eaveY) % pitch !== 0) fail(`spec.ridgeY ${ridgeY} is refused: ${STEEP_REFUSALS.offStepping}`);
  const perpSpan = ridgeAxis === "z" ? x1 - x0 + 1 : z1 - z0 + 1;
  const apexY = eaveY + pitch * Math.floor((perpSpan - 1) / 2);
  if (ridgeY > apexY) fail(`spec.ridgeY ${ridgeY} is refused (apex ${apexY}): ${STEEP_REFUSALS.unreachable}`);

  const g = gableRecord({ footprint, ridgeAxis, eaveY, ridgeY, pitch });
  const family = { field: blocks.field, stairs: blocks.stairs, slab: blocks.slab ?? null, findings: [] };
  const { cells, counts, heights, owner, capKeys, bandFloor } = generateRoof([g], family);

  // THE STEEP INVARIANT — every non-cap slope column tops with a straight bottom-half tread
  // facing uphill (integer classes never half-step, so the top cell IS the column's surface).
  // A violation is generator drift, never a spec problem: fail loud, name the column.
  const topByCol = new Map();
  for (const c of cells) {
    const key = `${c.pos[0]},${c.pos[2]}`;
    const prev = topByCol.get(key);
    if (!prev || c.pos[1] > prev.pos[1]) topByCol.set(key, c);
  }
  for (const [key, h] of heights) {
    const own = owner.get(key);
    const top = topByCol.get(key);
    if (own?.cap) {
      if (top.state) fail(`steep invariant: cap column ${key} tops with a shaped state (drift)`);
      continue;
    }
    const want = STAIR_FACING[UPHILL_OF[own?.downhill]];
    const s = top.state;
    if (top.block !== blocks.stairs || !s || s.shape !== "straight" || s.half !== "bottom" || s.facing !== want) {
      fail(`steep invariant: slope column ${key} (h=${h}) tops with ${top.block}${s ? ` ${JSON.stringify(s)}` : ""}, expected a straight bottom ${blocks.stairs} facing ${want} (drift)`);
    }
  }
  if (counts.slabs !== 0) fail(`steep invariant: ${counts.slabs} slab half-steps emitted on integer pitch (drift)`);

  return { cells, counts, capKeys, bandFloor, ridgeY };
}
