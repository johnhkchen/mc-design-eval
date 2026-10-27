// Way 332241977: a two-storey interwar brick commercial block on the Mt Eden side of the CBD (Eden Terrace / Newton
// fringe). Flat roof with a parapet, a shopfront on the north (street) face, and a plain brick envelope with stone
// string courses, lintels and cornice. The lidar roof is flat at 9 blocks above y0 across the footprint, so one tier
// stands on a base course: y0 base (foundation fill on the high cells), y1-3 ground storey, y4 floor line, y5-7 upper
// storey, y8 roof deck and cornice, y9 parapet. Interiors are air behind the glass with a floor slab at y4 and a roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241977.cells.json", "utf8"));

const g = new Voxels([25, 22, 21]);

const F = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => F.has(`${x},${z}`);
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_PRIORITY = ["N", "S", "E", "W"];
// the outward faces of a footprint cell (the sides with no footprint cell beyond them), in street-first order
const outward = (x, z) => FACE_PRIORITY.filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));
const isPerimeter = (x, z) => outward(x, z).length > 0;
const isInterior = (x, z) => inF(x, z) && !isPerimeter(x, z);

// a pane connects along the wall it sits in
const pane = (ns) => ns
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// the facade of a perimeter cell at height y: [block, state?]. Bays are 4 blocks: 2 glass, 2 brick piers.
const facade = (x, z, y, face) => {
  if (y === 0) return ["stone_bricks"];                 // base course / foundation
  if (y === 4) return ["smooth_stone"];                 // floor line string course
  if (y === 8) return ["smooth_stone"];                 // cornice
  if (y === 9) return ["bricks"];                       // parapet
  const ns = face === "N" || face === "S";
  const t = ns ? x : z;
  const bay = t % 4 === 1 || t % 4 === 2;
  if (!bay) return ["bricks"];
  if (y === 7) return ["smooth_stone"];                 // upper lintel
  if (y === 1 && face === "N") return ["dark_oak_planks"]; // shopfront bulkhead on the street face
  return ["glass_pane", pane(ns)];
};

// 1. base course and the interiors: floor slab at y4, roof deck at y8
for (const [x, z] of cells) g.set(x, 0, z, "stone_bricks");
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) {
    g.set(x, 4, z, "smooth_stone");
    g.set(x, 8, z, "stone");
  }
}

// 2. perimeter walls, every storey from y1 to y9
const DOOR_X = (() => {
  // the front door: a north-facing cell near the middle of the street face
  const cands = cells.filter(([x, z]) => outward(x, z).length === 1 && outward(x, z)[0] === "N");
  cands.sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12));
  return cands[0];
})();
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  const face = outward(x, z)[0];
  for (let y = 0; y <= 9; y++) {
    const [block, state] = facade(x, z, y, face);
    g.set(x, y, z, block, state);
  }
}

// 3. entrance: a dark oak door (two blocks) under a stone lintel, with a lit lantern just inside
const [dx, dz] = DOOR_X;
g.set(dx, 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dx, 3, dz, "smooth_stone");
if (isInterior(dx, dz + 1)) g.set(dx, 3, dz + 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. warm light behind some upper and shop glass: glowstone in the air gap behind the pane (inside the room)
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  const face = outward(x, z)[0];
  const ns = face === "N" || face === "S";
  const t = ns ? x : z;
  if (!(t % 4 === 1 || t % 4 === 2)) continue;
  if (((x * 7 + z * 3) % 5) !== 0) continue;
  // the cell just inside the glass
  const ix = x - DIR[face][0], iz = z - DIR[face][1];
  if (!isInterior(ix, iz)) continue;
  g.set(ix, 6, iz, "glowstone");
}

// 5. roof: a penthouse (bricks with a stone cap, on the roof deck) and a plant box, both on interior cells
const fits3 = (cx, cz) => {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (!isInterior(cx + i, cz + j)) return false;
  return true;
};
let best = null;
for (const [x, z] of cells) if (fits3(x, z)) {
  const d = Math.hypot(x - 12, z - 9);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const edge = Math.abs(i) === 1 || Math.abs(j) === 1;
    if (edge) { g.set(best.x + i, 9, best.z + j, "bricks"); g.set(best.x + i, 10, best.z + j, "bricks"); }
    g.set(best.x + i, 11, best.z + j, "smooth_stone");
  }
}
let plant = null;
for (const [x, z] of cells) {
  if (!isInterior(x, z) || !isInterior(x + 1, z) || !isInterior(x, z + 1) || !isInterior(x + 1, z + 1)) continue;
  if (best && Math.abs(x - best.x) <= 3 && Math.abs(z - best.z) <= 3) continue;
  const d = Math.hypot(x - 6, z - 14);
  if (!plant || d < plant.d) plant = { x, z, d };
}
if (plant) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.set(plant.x + i, 9, plant.z + j, "light_gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241977.nbt");
console.log(JSON.stringify({ footprint: cells.length, door: [dx, dz], penthouse: best && [best.x, best.z], plant: plant && [plant.x, plant.z], ...stats }));
