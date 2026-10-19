// 115 West 45 Street, 1925: a Midtown office block in brick and limestone, the Zoning Resolution's setback massing
// (lidar roof 47 over the middle and west, stepping down to 44, 38, 32 and 25 toward 45th Street on the north and to
// the south-east), a 3-block storey with a limestone spandrel band, brick piers and glass between them, a granite base
// and a shopfront on the street (north) face with a double dark-oak entrance. The lidar's 47 core carries a penthouse
// (50, then 53), and a water tank stands on the 44 setback. The mass is hollow: an air gap behind every pane, a floor
// slab per storey, nothing hanging except the lantern (hung from the slab above). Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022640.cells.json`, "utf8"));
const X = 13, Y = 59, Z = 24;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block heights above y 0): the lidar's noisy heights smoothed into flat setbacks at 25, 32, 38, 44, 47.
// A 1-block light well stays a slab. The penthouse core is 50 with a 53 lantern on it.
const tierOf = (r) => (r <= 1 ? 1 : r <= 26 ? 25 : r <= 35 ? 32 : r <= 41 ? 38 : r <= 45 ? 44 : 47);
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (x >= 3 && x <= 6 && z >= 8 && z <= 11) return x >= 4 && x <= 5 && z >= 9 && z <= 10 ? 53 : 50;
  return tierOf(cell.get(`${x},${z}`).roof);
};
const tank = (x, z) => x >= 9 && x <= 11 && z >= 14 && z <= 16;              // water tank on the 44 setback

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };               // N = low z = the 45th Street frontage
// A cell is open on a side when it is outside the footprint or its roof is at or below the height in question.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a N or S face
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on an E or W face
// Storey rows are y % 3: 0 and 1 are the windows, 2 the limestone band (the shop's transom at the ground). A slab also
// sits at each lower neighbour's cap, so a setback's first storey stands on the terrace it steps back from.
const band = (y) => y % 3 === 2;
const floorAt = (x, z, y) => band(y) || [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => {
  const n = roofAt(x + dx, z + dz);
  return inFoot(x + dx, z + dz) && n < roofAt(x, z) && n - 1 === y;
});
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0 && y % 3 === 0;   // sparse, first row of a storey

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const lamps = [];

// 1. Shell, one column at a time: a stone foundation to each cell's ground, a granite base course, the facade on each
// exposed face (piers, glass, spandrel bands), a floor slab per storey and a cap on each roof.
for (const [x, z] of cols) {
  const ground = groundAt(x, z), top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under the slope
    const face = faceOf(x, y, z);
    if (y === top - 1) { g.set(x, y, z, face ? "calcite" : "smooth_stone"); continue; }   // roof cap / cornice
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                  // base course
    const slab = floorAt(x, z, y);
    if (!face) { if (slab) g.set(x, y, z, "smooth_stone"); continue; }             // floor slab, or air behind the glass
    if (face === "N" && z === 0 && (x === 4 || x === 5) && y <= 2) {              // the double entrance, dark oak
      const upper = y === 2;
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: upper ? "upper" : "lower", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (slab) { g.set(x, y, z, "calcite"); continue; }                             // spandrel band, or a terrace's string course
    const u = face === "N" || face === "S" ? x : z;                                // position along the face
    if (u % 3 === 0) { g.set(x, y, z, y < 3 ? "polished_granite" : "bricks"); continue; }   // piers: granite at the shop, brick above
    g.set(x, y, z, "light_blue_stained_glass_pane", face === "N" || face === "S" ? ALONG_X : ALONG_Z);
    const [dx, dz] = DIRS[face], bx = x - dx, bz = z - dz;                         // the room behind, one block in
    if (lit(x, y, z) && inFoot(bx, bz) && roofAt(bx, bz) > y && !faceOf(bx, y, bz) && !floorAt(bx, bz, y)) lamps.push([bx, y, bz]);
  }
}

// 2. Parapets: a granite-look slab course on the edge of every roof that stands above what is beside it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (top <= 1 || tank(x, z)) continue;
  const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) < top);
  if (edge) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 3. The entrance hall: a lantern hung under the slab above, one block in from the doors.
g.set(4, 1, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Warm light behind the glass (only on the first row of a storey, where the slab below holds it).
for (const [x, y, z] of lamps) g.set(x, y, z, "glowstone");

// 5. Roof plant: the water tank on the 44 setback, a stone plinth, three storeys of planks and a slab cap.
for (let x = 9; x <= 11; x++) for (let z = 14; z <= 16; z++) {
  g.set(x, 44, z, "stone_bricks");
  for (let y = 45; y <= 47; y++) g.set(x, y, z, "oak_planks");
  g.set(x, 48, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Check: every block above y 0 has a block under it, or (the lantern) one over it. Interior floor slabs span the
// hollow storey on the perimeter walls, so they are counted apart.
let floating = 0, spanning = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if (g.get(x, y + 1, z) && g.get(x, y, z).block === "minecraft:lantern") continue;
  if (g.get(x, y, z).block === "minecraft:smooth_stone" && !faceOf(x, y, z)) { spanning++; continue; }
  floating++;
}
if (floating) console.warn(`${floating} blocks with nothing under them`);
if (spanning) console.log(`${spanning} interior floor slabs span the hollow storey on the walls`);

const { blocks, palette } = g.save(`${DIR}/NYC1022640.nbt`);
console.log(`NYC1022640.nbt: ${blocks} blocks, ${palette} palette entries, ${g.size.join(" x ")}`);
