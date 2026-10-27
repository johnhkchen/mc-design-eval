// Way 162091759: a two-storey brick shop block with a plaster string course and parapet, the flat-roofed
// Edwardian commercial type of the Eden Terrace / Newton main streets. Lidar gives one flat roof tier (9 above y 0);
// the four edge cells at 7-8 read as parapet noise and are smoothed up to that tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091759.cells.json`, "utf8"));

const ROOF = 9;               // roof tier: the building is y 0..8, plant sits on y 9
const FLOOR = 4;              // first-floor slab line; ground storey is g+1..3, upper storey 5..7
const TOP = ROOF - 1;         // y 8: parapet cap on the walls, roof deck inside
const PERIOD = 3;             // bay rhythm: a brick pier every third cell along each face

const BRICK = "bricks", BASE = "stone_bricks", SLAB = "smooth_stone", CREAM = "smooth_quartz";
const TIMBER = "dark_oak_planks", GLASS = "glass_pane", PLANT = "light_gray_concrete";

const foot = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const at = (x, z) => foot.has(`${x},${z}`);
const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the directions a footprint cell faces outward: those with no footprint cell beyond them
const outward = (x, z) => FACES.filter(([dx, dz]) => !at(x + dx, z + dz));

// the entrance: a lowest-ground wall cell on the faces, nearest the middle of the block
let door = null;
for (const [x, z, gr] of cells) {
  if (gr !== 0 || !outward(x, z).length) continue;
  const score = Math.abs(x - 16) + Math.abs(z - 11);
  if (!door || score < door.score) door = { x, z, score, face: outward(x, z)[0] };
}
const doorAt = (x, z) => door && door.x === x && door.z === z;

const g = new Voxels([33, 23, 22]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z, gr] of cells) {
  // foundation up to the ground, then the ground-floor slab on that same line: nothing floats on a slope
  for (let y = 0; y <= gr; y++) put(x, y, z, BASE);
  const out = outward(x, z);
  // first-floor slab and roof deck across the whole footprint; the outer ring takes the plaster string course and parapet
  put(x, FLOOR, z, out.length ? CREAM : SLAB);
  if (!out.length) { put(x, TOP, z, SLAB); continue; }

  const [dx, dz] = out[0];
  const corner = out.length > 1;
  const t = dx ? z : x;                         // position along the face
  const pier = corner || t % PERIOD === 0;      // corners and every third cell are brick piers
  const bay = Math.floor(t / PERIOD);
  // the parapet: cream caps on the piers, brick panels over the bays, so the cap is not one flat band
  put(x, TOP, z, pier ? CREAM : BRICK);

  for (let y = gr + 1; y <= TOP - 1; y++) {
    if (y === FLOOR) continue;
    if (doorAt(x, z) && (y === 1 || y === 2)) {
      const facing = dz ? "north" : "east";
      const st = { facing, hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "dark_oak_door", { ...st, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    let block;
    if (y === 3) block = pier ? BRICK : TIMBER;             // ground fascia over the shopfronts
    else if (y <= 2) block = pier ? BRICK : GLASS;           // shopfront glass
    else if (y === 7) block = pier ? BRICK : CREAM;          // window heads
    else block = pier ? BRICK : GLASS;                       // upper windows
    if (block !== GLASS) { put(x, y, z, block); continue; }
    // panes connect along the wall only, so they read as a glazed plane
    const state = dz
      ? { north: "false", south: "false", east: String(at(x + 1, z)), west: String(at(x - 1, z)), waterlogged: "false" }
      : { north: String(at(x, z - 1)), south: String(at(x, z + 1)), east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, GLASS, state);
    // warm light in the room behind some panes: glowstone on the shop floor, lanterns upstairs
    const ix = x - dx, iz = z - dz;
    if (at(ix, iz) && !outward(ix, iz).length) {
      if (y === gr + 1 && bay % 2 === 0) put(ix, y, iz, "glowstone");
      if (y === 5 && bay % 2 === 1) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// rooftop plant: three units on the east half of the roof deck, standing on the roof slab
for (const [x, z] of cells) {
  if (x >= 21 && x <= 25 && z >= 8 && z <= 10 && !outward(x, z).length) put(x, ROOF, z, PLANT);
}

const file = `${DIR}/way_162091759.nbt`;
const r = g.save(file);
console.log(JSON.stringify({ file, ...r, footprint: cells.length, door: door && { x: door.x, z: door.z, face: door.face } }));
