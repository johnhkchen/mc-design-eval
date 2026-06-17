// ARCH-FRAME hand primitive (T-192-01, story S-192, epic E-50) — the construction lever the picture-driven
// climb stalled on: a FRAMED ARCHED PASSAGE. The recorded plateau critique (T-191) names an OPENING major,
// "the arch head and the dark-timber frame around the passage", and the agent picked `done` because NO tool
// builds one. This module is that tool's pure geometry.
//
// WHY A NEW PRIMITIVE (not the S-179 voussoir path): deriveArchHead/archHeadPlacements (treatment-grammar)
// only RECOLOR stones that ALREADY form an arch (the `isArch` gate). The gatehouse passage is a FLAT
// rectangular hole (isArch=false) — there is no arch to recolor. We must CONSTRUCT one. The constructive
// primitive is archRing (src/form/shaped-vocab.mjs): a voxel-circle that returns the full-cube `ring` cells
// which, ADDED where the opening's top corners are currently air, turn a rectangle into a voxel arch.
//
// TWO SUB-LEVERS, honestly separated (the critique names BOTH):
//   • FRAME — recolor the opening's reveal (flanking jambs both sides + the lintel band) to the frame block
//     (dark timber). Achievable on ANY opening: it is a last-writer-wins recolor of EXISTING solid wall —
//     no air op, honors facade-recess-by-exclusion.
//   • ARCH HEAD — build the voxel-circle spandrels via archRing, ADDED into the corner air above the spring.
//     Requires width >= minWidth (an arch needs a span to curve over). A too-narrow slot is FRAMED but cannot
//     be arched WITHOUT WIDENING THE OPENING — and widening is removing wall (an air op / a rebuild the
//     facade charter forbids). So a narrow opening records `arched:false, reason:"…needs a wider opening"`:
//     the named-for-E-49 rebuild, surfaced, not forced (the ticket's anti-hedge out).
//
// PURE — no GL, no I/O, no Date/random. Reuses archRing (tested); imports no registry brush (arch-frame is a
// spec→cells generator, the same layer generateRoof lives in, not a surface brush). Byte-stable: aperture
// order, then frame targets in their aperture order, then archRing's canonical y,d,u walk.

// archConstruct is reached through the registry DOOR (src/pack/idiom-registry.mjs), never shaped-vocab
// directly — the brush-door conformance tripwire (T-128). archConstruct wraps the shaped-vocab archRing.
import { archConstruct } from "../pack/idiom-registry.mjs";

export const ARCH_FRAME_SCHEMA = "arch-frame/v1";

const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const namespaced = (id) => (typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id);

/** Side-face dir → world-axis indices {u:along-face, v:vertical(=1), w:depth/normal} + exterior `sign`
 *  (−1 = the face looks toward the smaller coordinate, so its exterior plane is the min along w). */
const OPENING_AXES = Object.freeze({
  "+x": { u: 2, v: 1, w: 0, sign: +1 }, "-x": { u: 2, v: 1, w: 0, sign: -1 },
  "+z": { u: 0, v: 1, w: 2, sign: +1 }, "-z": { u: 0, v: 1, w: 2, sign: -1 },
});
const axisLetter = (i) => (i === 0 ? "x" : i === 2 ? "z" : fail("arch-frame", `axis index ${i} is not x|z`));

/** World [x,y,z] from face-relative (au along, av vertical, w depth). */
function posOf(ax, au, av, w) {
  const p = [0, 0, 0];
  p[ax.u] = au; p[ax.v] = av; p[ax.w] = w;
  return p;
}

/** First SOLID cell from the exterior face inward along the depth axis (the dressOpenings probe idiom).
 *  Returns the depth `w` or null. The exterior is the min end when sign<0, the max end when sign>0. */
function probeWallPlane(occ, ax, au, av) {
  const wMin = occ.bounds.min[ax.w], wMax = occ.bounds.max[ax.w];
  if (ax.sign < 0) { for (let w = wMin; w <= wMax; w++) { const p = posOf(ax, au, av, w); if (occ.solid(p[0], p[1], p[2])) return w; } }
  else { for (let w = wMax; w >= wMin; w--) { const p = posOf(ax, au, av, w); if (occ.solid(p[0], p[1], p[2])) return w; } }
  return null;
}

/**
 * Build the frame (always) + the voxel arch head (where width allows) over the door apertures.
 * @param {import("./occupancy.mjs").Occupancy} occ the TARGET build (frame recolors its wall, arch adds to it)
 * @param {object[]} apertures from extractApertures — measured on a reference that carries the doors
 * @param {{frameBlock:string, minWidth?:number}} opts frameBlock = the dark-timber surround (e.g. dark_oak_log)
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], perOpening:object[]}}
 */
export function frameArchPlacements(occ, apertures, { frameBlock, minWidth = 5 } = {}) {
  if (!occ?.bounds) fail("frameArchPlacements", "occupancy is empty");
  if (typeof frameBlock !== "string" || !frameBlock) fail("frameArchPlacements", "opts.frameBlock must be a block id");
  if (!Array.isArray(apertures)) fail("frameArchPlacements", "apertures must be an array");
  const placements = [];
  const perOpening = [];

  for (const ap of apertures) {
    if (ap.kind !== "door") continue;
    const ax = OPENING_AXES[ap.dir];
    if (!ax) { perOpening.push({ dir: ap.dir, framed: false, arched: false, reason: `unknown dir ${ap.dir}` }); continue; }
    const cells = Array.isArray(ap.cells) ? ap.cells : [];
    if (!cells.length) { perOpening.push({ dir: ap.dir, framed: false, arched: false, reason: "no aperture cells" }); continue; }
    const aus = cells.map((c) => c.au), avs = cells.map((c) => c.av);
    const uLo = Math.min(...aus), uHi = Math.max(...aus), vLo = Math.min(...avs), vHi = Math.max(...avs);
    const W = uHi - uLo + 1;

    // --- FRAME: recolor the reveal (both flanks, full height) + the lintel band, at the wall plane ----------
    const frameTargets = [];
    for (const side of ["left", "right"]) for (const f of (ap.flanks?.[side] ?? [])) frameTargets.push(f);
    for (const c of (ap.lintel ?? [])) frameTargets.push(c);
    let framed = 0;
    for (const { au, av } of frameTargets) {
      const w = probeWallPlane(occ, ax, au, av);
      if (w === null) continue;
      const pos = posOf(ax, au, av, w);
      if (!occ.solid(pos[0], pos[1], pos[2])) continue; // only recolor existing wall (no air op)
      placements.push({ op: "voxel", pos, block: namespaced(frameBlock) });
      framed += 1;
    }

    // --- ARCH HEAD: voxel-circle spandrels added into the corner air, where there is a span to curve over ---
    let arched = false, ringCells = 0;
    if (W >= minWidth) {
      // probe the wall plane at a known-SOLID spot (the jamb, just outside the span) — the opening centre is
      // air, so probing there would wrongly read "no wall plane".
      const wStar = probeWallPlane(occ, ax, uLo - 1, vLo);
      if (wStar !== null) {
        const radius = W / 2;
        const spring = Math.max(vLo + 1, vHi - Math.floor(radius));
        const spec = {
          center: [(uLo + uHi) / 2, spring], radius,
          span: { axis: axisLetter(ax.u), range: [uLo, uHi] },
          yRange: [spring, vHi],
          depth: { axis: axisLetter(ax.w), range: [wStar, wStar] },
          block: frameBlock,
        };
        const { cells: ring } = archConstruct(spec); // door-wrapped archRing → full-cube ring
        for (const { pos } of ring) { placements.push({ op: "voxel", pos, block: namespaced(frameBlock) }); ringCells += 1; }
        arched = ringCells > 0;
      }
    }

    perOpening.push({
      dir: ap.dir, width: W, framed: framed > 0, framedCells: framed, arched, ringCells,
      ...(W < minWidth ? { reason: "passage too narrow for an arch head — needs a wider opening (a rebuild; E-49), framed only" } : {}),
    });
  }
  return { placements, perOpening };
}
