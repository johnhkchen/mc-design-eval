// Way 326735491: a 1930s Art Deco plastered-concrete commercial block (two storeys over a stone plinth, a parapet
// cornice), shopfront on the ground floor, a dark-oak street door. Footprint from the cells (lidar ground + roof);
// the ground is filled to a common floor line (y 2) so the downhill side shows a stone basement storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735491.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735491.nbt";

const g = new Voxels([15, 25, 9]);
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([f]) => f);
const isEdge = (x, z) => outward(x, z).length > 0;
const along = (face, x, z) => (face === "north" || face === "south" ? x : z);   // position along a facade

// the street front: the outward face with the most cells, its middle cell takes the door
const faceCount = {};
for (const key of F.keys()) { const [x, z] = key.split(",").map(Number); for (const f of outward(x, z)) faceCount[f] = (faceCount[f] || 0) + 1; }
const streetFace = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const streetCells = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => outward(x, z).includes(streetFace))
  .sort((a, b) => along(streetFace, a[0], a[1]) - along(streetFace, b[0], b[1]));
const [doorX, doorZ] = streetCells[Math.floor(streetCells.length / 2)];
const doorKey = `${doorX},${doorZ}`;

const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const stairs = (f, half) => ({ facing: f, half, shape: "straight", waterlogged: "false" });

for (const [key, { ground, roof: T }] of F) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const faces = outward(x, z);
  const face = faces[0];
  const p = edge ? along(face, x, z) : -1;
  const isDoor = key === doorKey;

  // foundation and stone basement: solid from y 0 up to the floor line (covers every cell's ground)
  for (let y = 0; y < 2; y++) set(x, y, z, "stone_bricks");
  // base course on the edge, the ground floor slab inside
  set(x, 2, z, edge ? "polished_andesite" : "smooth_stone");

  if (edge) {
    // shopfront: glass bays between dark-oak piers, the street door in the middle of its front
    for (const y of [3, 4]) {
      if (isDoor) set(x, y, z, "dark_oak_door", { facing: face, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else set(x, y, z, p % 3 === 0 ? "dark_oak_planks" : "glass");
    }
    set(x, 5, z, isDoor ? "dark_oak_stairs" : "smooth_quartz", isDoor ? stairs(face, "top") : undefined);
    set(x, 6, z, "smooth_quartz");                                    // string course
    // upper storey: a window bay on every third cell, plaster between, pilasters and a head course
    for (const y of [7, 8]) set(x, y, z, p % 3 === 1 ? "glass" : p % 3 === 0 ? "smooth_quartz" : "white_concrete");
    set(x, 9, z, "smooth_quartz");                                    // head course
    for (let y = 10; y < T - 1; y++) set(x, y, z, "white_concrete");  // plaster to the coping
    set(x, T - 1, z, "smooth_quartz");                                // coping
    set(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet cap
  } else {
    set(x, 6, z, "smooth_stone");                                     // upper floor slab
    set(x, T - 1, z, "stone");                                        // roof deck (a lighter membrane, not a dark well)
    // hang a lantern from the ground-floor and upper-floor ceilings in some rooms
    if ((x + z) % 3 === 0) set(x, 5, z, "lantern", { hanging: "true", waterlogged: "false" });
    if ((x + z) % 4 === 1 && T - 2 >= 7) set(x, T - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// warm light behind every other window bay: a glowstone on the room's floor slab inside the glass
for (const [key] of F) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const face = outward(x, z)[0];
  const p = along(face, x, z);
  if (p % 3 !== 1 || (p % 6) !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (inF(ix, iz) && !isEdge(ix, iz)) set(ix, 7, iz, "glowstone");
}

// roof plant: two boxes on the deck of interior cells, on the main (12) roof
const deck = [...F.entries()].filter(([k, v]) => v.roof === 12 && !isEdge(...k.split(",").map(Number)))
  .map(([k]) => k.split(",").map(Number));
for (const [x, z] of deck.filter((_, i) => i % 5 === 2).slice(0, 2)) {
  for (const y of [12, 13]) set(x, y, z, "light_gray_concrete");
}

const r = g.save(OUT);
console.log(`street face ${streetFace}, door at ${doorX},${doorZ}; ${cells.length} cells; ${r.blocks} blocks, ${r.palette} palette`);
