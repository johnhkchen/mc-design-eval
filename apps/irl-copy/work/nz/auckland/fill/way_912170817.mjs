// Way 912170817: a two-storey interwar brick commercial block (Mt Eden Road / Eden Terrace type): a stone plinth,
// a shopfront storey with a timber fascia, a sandstone string course, a sash-window storey of glass panes, a
// sandstone cornice and a brick parapet, on a flat roof with two plant units. The footprint and roof heights come
// from the lidar cells file; the lidar roof is flat at 10 blocks, so the massing is one prism.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170817.cells.json", "utf8"));

const fp = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const roofs = new Set([...fp.values()].map((c) => c.roof));
if (roofs.size !== 1) throw new Error(`roof is not flat: ${[...roofs]}`);
const TOP = [...roofs][0];                               // parapet course is y = TOP - 1
const lowest = Math.min(...[...fp.values()].map((c) => c.ground));

// Exterior cells are the footprint cells with a missing neighbour; the rest are interior (air, with floor slabs).
const missing = (x, z) => [["N", z - 1], ["S", z + 1]].filter(([, zz]) => !inFp(x, zz)).map(([d]) => d)
  .concat([["W", x - 1], ["E", x + 1]].filter(([, xx]) => !inFp(xx, z)).map(([d]) => d));
const isExt = (x, z) => inFp(x, z) && missing(x, z).length > 0;

// Bays: a face cell is a pier (brick) when it is a corner or on every third bay; the rest are windows.
// Facades along N/S run in x, along E/W in z.
const isPier = (x, z) => {
  const m = missing(x, z);
  if (m.length >= 2) return true;
  const along = m[0] === "N" || m[0] === "S" ? x : z;
  return along % 3 === 0;
};

const DOOR = { x: 6, z: 6 };                             // south (street) face, a pier bay opened as the entrance
const g = new Voxels([10, 23, 7]);

// Plinth and foundation: solid from y 0 up to each cell's ground (all zero here, so only the plinth course).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.ground - lowest; y++) g.set(x, y, z, "stone_bricks");
}

for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isExt(x, z)) continue;
  const pier = isPier(x, z);
  g.set(x, 0, z, "stone_bricks");                                          // base course
  for (let y = 1; y <= TOP - 1; y++) {
    let b;
    if (y <= 3) b = pier ? "bricks" : (y === 3 ? "dark_oak_planks" : "glass");   // shopfront storey
    else if (y === 4) b = "smooth_sandstone";                                     // string course / sills
    else if (y <= 6) b = pier ? "bricks" : "glass_pane";                          // sash storey
    else if (y === 7) b = pier ? "bricks" : "smooth_sandstone";                   // heads
    else if (y === 8) b = "smooth_sandstone";                                     // cornice
    else b = pier ? "smooth_sandstone" : "bricks";                                // parapet, capped at piers
    g.set(x, y, z, b);
  }
}

// Entrance on the street face: a door in the shopfront, with a hanging lantern under the string course.
const dx = DOOR.x, dz = DOOR.z;
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(dx, 1, dz, "oak_door", doorState("lower"));
g.set(dx, 2, dz, "oak_door", doorState("upper"));
g.set(dx, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });

// Glass panes connect to the wall cells beside them (exterior cells in the same course only).
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isExt(x, z) || isPier(x, z)) continue;
  for (const y of [5, 6]) {
    const side = (nx, nz) => (isExt(nx, nz) ? "true" : "false");
    g.set(x, y, z, "glass_pane", {
      east: side(x + 1, z), west: side(x - 1, z), north: side(x, z - 1), south: side(x, z + 1), waterlogged: "false",
    });
  }
}

// Floor slabs per storey and the roof deck, over the interior cells only (no interior walls, no furniture).
const interior = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => !isExt(x, z));
for (const [x, z] of interior) {
  g.set(x, 0, z, "smooth_stone");                                          // ground floor slab
  g.set(x, 4, z, "smooth_stone");                                          // upper floor slab
  g.set(x, TOP - 2, z, "smooth_stone");                                    // flat roof deck, light enough not to read as a pit
}

// Warm light behind the glass: glowstone on the upper floor, lanterns on the shop floor, where the room touches a window.
const touchesWindow = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
  .some(([nx, nz]) => isExt(nx, nz) && !isPier(nx, nz));
for (const [x, z] of interior) {
  if (!touchesWindow(x, z)) continue;
  if ((x + 2 * z) % 2 === 0) g.set(x, 5, z, "glowstone");
  else if ((x + z) % 3 === 0) g.set(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: two light-grey units, each two cells long, on the roof deck.
let units = 0;
for (let i = 0; i < interior.length && units < 2; i++) {
  const [x, z] = interior[i];
  const pair = interior.some(([ox, oz]) => ox === x + 1 && oz === z) ? [[x, z], [x + 1, z]] : null;
  if (!pair) continue;
  for (const [px, pz] of pair) g.set(px, TOP - 1, pz, "light_gray_concrete");
  units++; i += 2;
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170817.nbt";
const r = g.save(out);
console.log(`way_912170817: ${r.blocks} blocks, ${r.palette} palette entries -> ${out}`);
