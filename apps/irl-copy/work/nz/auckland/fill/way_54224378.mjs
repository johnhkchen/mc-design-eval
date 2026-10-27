// A 1960s-70s reinforced-concrete office block on Mt Eden's flank: seven storeys of pale concrete piers and
// tinted glazing, a stone plinth, a cornice and parapet, roof plant. Footprint 29 x 21; flat roof at y 31 (the
// lidar's single tier; the few perimeter cells at 10-12 and 30 are edge noise, so they take the tier).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_54224378.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_54224378.nbt";

const W = 29, D = 21, H = 44;
const ROOF = 31;                                   // one flat tier
const STOREYS = 7, STOREY_H = 4;                   // storey k: band at y = 1 + 4k, windows 2 high, spandrel under the next band
const PLINTH = "stone_bricks", PIER = "white_concrete", SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const SLAB = "light_gray_concrete", ROOF_SKIN = "gray_concrete";

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));   // footprint cells; the lidar's ground/roof are read below
const inF = (x, z) => foot.has(`${x},${z}`);
const outN = (x, z) => !inF(x, z - 1), outS = (x, z) => !inF(x, z + 1), outW = (x, z) => !inF(x - 1, z), outE = (x, z) => !inF(x + 1, z);
// classify a footprint cell: a corner pier, a facade cell (with the axis it runs along and its outward side), or inner
function facet(x, z) {
  const zWall = outN(x, z) || outS(x, z), xWall = outW(x, z) || outE(x, z);
  if (zWall && xWall) return { kind: "corner" };
  if (zWall) return { kind: "wall", runsX: true, inward: outN(x, z) ? 1 : -1, outSide: outN(x, z) ? "north" : "south" };
  if (xWall) return { kind: "wall", runsX: false, inward: outW(x, z) ? 1 : -1, outSide: outW(x, z) ? "west" : "east" };
  return { kind: "inner" };
}
const ring = cells.map(([x, z]) => [x, z]).filter(([x, z]) => facet(x, z).kind !== "inner");
const inner = cells.map(([x, z]) => [x, z]).filter(([x, z]) => facet(x, z).kind === "inner");

const v = new Voxels([W, H, D]);

// 1. plinth: y 0 under every footprint cell (the ground-1 cells' foundation, and the base course on the ground-0 cells)
for (const [x, z] of cells.map(([x, z]) => [x, z])) v.set(x, 0, z, PLINTH);

// 2. the facades: corner piers full height; each storey a band, two window rows, a spandrel
const pane = (runsX) => (runsX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const ENTRY = { x: 7, z: 0 };                      // north face, centred on the 9-cell run at z 0
for (const [x, z] of ring) {
  const f = facet(x, z);
  if (f.kind === "corner") { for (let y = 1; y <= 30; y++) v.set(x, y, z, PIER); continue; }
  const a = f.runsX ? x : z;
  for (let k = 0; k < STOREYS; k++) {
    const b = 1 + STOREY_H * k;
    v.set(x, b, z, k === 0 ? "smooth_stone" : PIER);          // storey band (base course on the ground floor)
    for (const y of [b + 1, b + 2]) {                       // window rows: piers every third cell, glass between
      if (a % 3 === 0) v.set(x, y, z, PIER);
      else v.set(x, y, z, GLASS, pane(f.runsX));
    }
    v.set(x, b + 3, z, SPANDREL);                           // spandrel under the next band
  }
  v.set(x, 29, z, PIER);                                    // cornice
  v.set(x, 30, z, a % 3 === 0 ? PIER : "smooth_stone");     // parapet with a rhythm
}

// 3. the entrance on the north face: a glass door under a concrete canopy
for (let x = ENTRY.x - 1; x <= ENTRY.x + 1; x++) v.set(x, 3, ENTRY.z, "smooth_stone");          // canopy
v.set(ENTRY.x, 1, ENTRY.z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(ENTRY.x, 2, ENTRY.z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(ENTRY.x, 2, ENTRY.z + 1, "lantern", { hanging: "false", waterlogged: "false" });       // lit inside the door

// 4. the floors and ceiling: one slab per storey base across the interior (the air gap behind the glass stays open)
for (const [x, z] of inner) {
  for (let k = 0; k < STOREYS; k++) v.set(x, 1 + STOREY_H * k, z, SLAB);
  v.set(x, 29, z, SLAB);
  v.set(x, 30, z, ROOF_SKIN);                               // the flat roof's membrane
}

// 5. warm light behind some windows: glowstone on the storey floor just inside the glass
for (const [x, z] of ring) {
  const f = facet(x, z);
  if (f.kind !== "wall") continue;
  const a = f.runsX ? x : z;
  for (let k = 1; k < STOREYS; k++) {
    if (a % 3 === 0 || (a + k) % 4 !== 0) continue;
    const ix = f.runsX ? x : x + f.inward, iz = f.runsX ? z + f.inward : z;
    if (!inF(ix, iz) || facet(ix, iz).kind !== "inner") continue;
    v.set(ix, 2 + STOREY_H * k, iz, "glowstone");           // y = b + 1: stands on the floor slab at b
  }
}

// 6. roof plant: a plant room on the interior roof (x 12-16, z 8-11), louvres on its north face, rods on its corners
const PX = [12, 16], PZ = [8, 11];
for (let x = PX[0]; x <= PX[1]; x++) for (let z = PZ[0]; z <= PZ[1]; z++) {
  if (!inF(x, z) || facet(x, z).kind !== "inner") continue;
  const edge = x === PX[0] || x === PX[1] || z === PZ[0] || z === PZ[1];
  for (let y = 31; y <= 33; y++) if (edge) v.set(x, y, z, SPANDREL);
  v.set(x, 34, z, ROOF_SKIN);
}
for (let x = 13; x <= 15; x++) v.set(x, 32, PZ[0], "iron_bars", { north: "false", south: "true", east: "true", west: "true", waterlogged: "false" });
v.set(PX[0], 35, PZ[0], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
v.set(PX[1], 35, PZ[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const report = v.save(OUT);
console.log(JSON.stringify({ ring: ring.length, inner: inner.length, ...report }));
