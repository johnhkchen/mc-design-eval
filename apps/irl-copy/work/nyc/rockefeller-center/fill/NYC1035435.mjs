// NYC1035435: 17 East 48th Street, 1915 commercial and office building. A nine-storey red-brick loft on a granite
// plinth, limestone storey lines and a corbelled cornice with a parapet. The street is the north face (z 0): a
// shopfront flush with the plinth, a central lobby door under a dark canopy band, and upper windows recessed one
// block into their reveals so the facade reads as construction. The lidar roof is flat at about 29 (median 29; the
// 27-28 edge cells are the parapet dip), so the massing is one box with no setbacks. The sides are party walls.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 7, D = 23, TOP = 29;   // footprint x 0..6, z 0..22 (all 161 cells); roof top at 29
const TOP_BAND = 24;             // the ninth storey (y 24..26): its lintel is solid, its cornice sits on that
const g = new Voxels([7, 42, 23]);

const pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
// A few upper windows are lit: a fixed pattern so the sheet is the same on every run.
const lit = (x, k, r, front) => (front ? (x * 3 + k * 5 + r * 2) % 7 === 0 : (x * 5 + k * 3 + r) % 11 === 0);

// What the block at (x, y, z) is, as { b, s }; null is air. Front and back zones (z 0..2 and 20..22) carry the
// reveal: depth d from the face is 0 (outer layer), 1 (glass) and 2 (the air gap behind it, or a lamp).
function block(x, y, z) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const faceZ = z === 0 || z === D - 1;
  if (y === 28) return perim ? { b: faceZ && x % 3 === 0 ? "chiseled_stone_bricks" : "stone_bricks" } : null;   // parapet
  if (y === 27) {                                                                                             // cornice
    if (!perim) return { b: "gray_concrete" };                                                                 // tar roof
    if (faceZ) return { b: x % 2 ? "stone_bricks" : "smooth_stone" };                                          // dentils
    return { b: "stone_bricks" };
  }

  const base = 3 * Math.floor(y / 3), r = y - base, k = base / 3;
  const ground = k === 0, top = base === TOP_BAND;
  const front = z <= 2 || z >= D - 3;
  if (!front) {                                                  // the sides: party walls, no windows
    if (x === 0 || x === W - 1) return { b: r === 0 ? (ground ? "polished_granite" : "smooth_stone") : "bricks" };
    return { b: "stone" };
  }

  const N = z <= 2, d = N ? z : D - 1 - z;
  if (N && y === 3 && d === 0 && x >= 2 && x <= 4) return { b: "black_concrete" };   // canopy over the lobby

  if (N && ground) {                                             // the shopfront on 48th Street
    if (d === 0) {
      if (r === 0) return { b: "polished_granite" };
      if (x === 3) return { b: "iron_door", s: door(r === 1 ? "lower" : "upper") };
      if (x === 0 || x === W - 1) return { b: "polished_granite" };
      return { b: "glass_pane", s: pane };
    }
    if (d === 1) {
      if (r === 0 || x === 0 || x === W - 1) return { b: "stone" };
      if (x === 2 && r === 1) return { b: "shroomlight" };       // warm lamps behind the glass
      if (x === 4 && r === 2) return { b: "glowstone" };
      return null;
    }
    return { b: "stone" };
  }

  // Upper storeys, and the back (south) face: a recessed window grid between piers.
  const pier = x === 0 || x === 3 || x === W - 1;
  const sill = ground ? "polished_granite" : "smooth_stone";
  if (d === 0) {
    if (r === 0) return { b: sill };                             // storey line, or the sill
    if (x === 0 || x === W - 1) return { b: "stone_bricks" };     // quoins
    if (x === 3) return { b: "bricks" };
    if (top && r === 2) return { b: "stone_bricks" };             // lintel under the cornice
    return null;                                                   // the reveal
  }
  if (d === 1) {
    if (r === 0 || (top && r === 2)) return { b: "stone" };
    if (pier) return { b: "bricks" };
    return { b: "glass_pane", s: pane };
  }
  if (d === 2) {
    if (r === 0 || pier || (top && r === 2)) return { b: "stone" };
    return lit(x, k, r, N) ? { b: "glowstone" } : null;          // the air gap behind the glass
  }
  return { b: "stone" };
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y <= 28 && y < TOP; y++) {
  const c = block(x, y, z);
  if (c) g.set(x, y, z, c.b, c.s);
}

const out = `${DIR}/NYC1035435.nbt`;
const { blocks, palette } = g.save(out);
console.log(`NYC1035435: ${blocks} blocks, palette ${palette}, wrote ${out}`);
