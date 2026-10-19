// 135 West 52nd Street, 1987: a mixed residential and commercial tower of about 41 storeys (125 blocks, about 139 m)
// on a stepped masonry base. Late-1980s Midtown: a blue-glass curtain wall in light-grey spandrels and grey mullions
// rises from brick podiums with punched windows and a granite base course, and every street-level face carries a
// shopfront. The lidar is read as tiers (a 3x3 majority smooths its noise): a 125-block tower over most of the lot,
// 110, 90 and 70 setbacks stepping down to the west and south, 50 and 25 block brick wings along 52nd Street, and
// paved open ground where the lidar sees nothing. The entrance is a double door under an awning in the north (52nd
// Street) podium. Glass sits one block out from a solid spandrel course with air behind it and a floor slab in each
// storey (no interiors); warm glowstone sits behind some panes. A mechanical penthouse caps the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023160.cells.json`, "utf8"));
const X = 34, Y = 139, Z = 22;

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// Lidar roof (block heights above y 0) to a tier: open ground, 25 and 50 brick wings, 70/90/110 setbacks, 125 tower.
const tierOf = (r) => (r <= 5 ? 0 : r <= 40 ? 25 : r <= 60 ? 50 : r <= 80 ? 70 : r <= 100 ? 90 : r <= 117 ? 110 : 125);
const raw = new Map([...foot].map(([k, { roof }]) => [k, tierOf(roof)]));

// Smooth the lidar noise: each cell takes the most common tier among itself and its footprint neighbours (ties keep its own).
const tier = new Map();
for (const [k, self] of raw) {
  const [x, z] = k.split(",").map(Number), n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = raw.get(`${x + dx},${z + dz}`); if (v !== undefined) n.set(v, (n.get(v) || 0) + 1);
  }
  let best = self; for (const [v, c] of n) if (c > (n.get(best) || 0)) best = v;
  tier.set(k, best);
}
const top = (x, z) => tier.get(`${x},${z}`) ?? 0;                 // 0 outside the lot or on open ground
const cols = [...tier].filter(([, h]) => h > 0).map(([k]) => k.split(",").map(Number));

// Outward faces, in order N (52nd Street, low z), S, W, E. A face is exposed at height y when the cell beside it is
// open or its roof is at or below y.
const OUT = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const exposed = (x, y, z) => OUT.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const panes = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }   // pane on a face along x
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }); // pane on a face along z
const lit = (u, s, k) => (u * 5 + s * 7 + k * 3) % 6 === 0;       // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);

// 1. Walls, base, storefronts, floor slabs, per cell up to its roof covering.
for (const [x, z] of cols) {
  const H = top(x, z), tower = H >= 70;
  for (let y = 0; y < H - 1; y++) {
    const out = exposed(x, y, z), s = Math.floor(y / 3), r = y % 3;
    if (!out.length) { if (r === 0) g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_quartz"); continue; }  // floor slab
    const [, , face] = out[0];
    const u = face === "N" || face === "S" ? x : z;                // position along the face
    const k = OUT.findIndex(([, , f]) => f === face);
    const st = panes(face);
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }   // base course
    if (s === 0) {                                                  // storefront: piers, glass, the lobby door
      if (face === "N" && z === 0 && (x === 15 || x === 16)) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 15 ? "left" : "right", open: "false", powered: "false" });
      } else g.set(x, y, z, u % 3 === 0 ? "polished_granite" : "glass");
      continue;
    }
    if (r === 0) {                                                  // a spandrel course, or the awning over the lobby
      const awning = face === "N" && z === 0 && s === 1 && x >= 14 && x <= 17;
      g.set(x, y, z, awning ? "black_concrete" : tower ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (tower) {                                                    // blue glass curtain wall, grey mullions every third block
      if (u % 3 === 0) g.set(x, y, z, "gray_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane", st);
    } else {                                                        // brick podium with punched windows, piers every third block
      if (u % 3 === 0) g.set(x, y, z, "bricks");
      else g.set(x, y, z, "white_stained_glass_pane", st);
    }
  }
  // 2. Roof covering on each top, a parapet on the exposed edge, and paving on the open lot.
  g.set(x, H - 1, z, tower ? "gray_concrete" : "smooth_stone");
  if (exposed(x, H, z).length) g.set(x, H, z, tower ? "light_gray_concrete" : "bricks");
}
for (const [k, h] of tier) if (h === 0) { const [x, z] = k.split(",").map(Number); g.set(x, 0, z, "smooth_stone"); }

// 3. Warm light: a glowstone on the floor just inside some lit panes (interior cells only, so no wall is overwritten).
for (const [x, z] of cols) {
  const H = top(x, z);
  for (let y = 1; y < H - 1; y++) {
    const out = exposed(x, y, z), s = Math.floor(y / 3), r = y % 3;
    if (!out.length || s === 0 || r !== 1) continue;
    const [dx, dz, face] = out[0], u = face === "N" || face === "S" ? x : z;
    if (u % 3 === 0) continue;                                      // no glass in a mullion or a brick pier
    if (!lit(u, s, OUT.findIndex(([, , f]) => f === face))) continue;
    const ix = x - dx, iz = z - dz;
    if (top(ix, iz) > y && !exposed(ix, y, iz).length) g.set(ix, y, iz, "glowstone");
  }
}

// 4. Mechanical penthouse on the tower roof: a solid 5 x 3 box, 3 blocks high, in the middle of the 125 block roof.
for (let z = 5; z <= 7; z++) for (let x = 10; x <= 14; x++) {
  if (top(x, z) !== 125) continue;
  for (let y = 125; y <= 127; y++) g.set(x, y, z, y === 127 ? "gray_concrete" : "light_gray_concrete");
}

const stats = g.save(`${DIR}/NYC1023160.nbt`);
console.log(JSON.stringify({ cells: cols.length, ...stats }));
