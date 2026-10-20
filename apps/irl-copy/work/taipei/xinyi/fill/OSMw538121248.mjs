import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121248";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 20x20 footprint, roof ~11 blocks above lowest ground.
// Reads as a two-storey (about 5 blocks each) mid-century commercial block:
// stone base course, light-gray pier grid with tinted glazing, quartz cornice
// and parapet, and a small roof plant room. Shopfronts on the ground floor.
const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const ROOF = 11;     // parapet top
const CORNICE = 10;  // cornice band and roof slab level
const FLOOR = 5;     // second-floor slab level / ground-storey lintel top

// Edge analysis: returns outward normal, facade index, and corner flag.
function faceInfo(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) return null;
  const zFace = n || s;
  const xFace = w || e;
  const corner = zFace && xFace;
  let dx = 0, dz = 0, i;
  if (zFace) { dz = n ? -1 : 1; i = x; }
  else { dx = w ? -1 : 1; i = z; }
  if (corner) { // prefer the z-facing normal for corners; corners are piers anyway
    dz = n ? -1 : 1; dx = 0; i = x;
  }
  return { dx, dz, i, corner };
}

// Foundation fill from y=0 to each cell's ground, and floor/roof slabs.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr < FLOOR) g.set(x, FLOOR, z, "smooth_stone");        // second-floor slab
  g.set(x, CORNICE, z, "light_gray_concrete");                // roof slab
}

// Facade and articulation
for (const [x, z, gr] of cells) {
  const f = faceInfo(x, z);
  if (!f) continue;
  const { dx, dz, i, corner } = f;
  const pier = corner || i % 4 === 0;
  const inX = x - dx, inZ = z - dz;
  const inward = has(inX, inZ);

  // Ground storey: base course, shopfronts, entrance on south face
  for (let y = gr; y < FLOOR; y++) {
    let b;
    if (y === gr) b = "polished_andesite";                    // base course
    else if (y === FLOOR - 1) b = "smooth_quartz";            // lintel band
    else if (pier) b = "light_gray_concrete";
    else b = "light_blue_stained_glass_pane";                 // shopfront glazing
    // entrance: centre bay on south (+z) face
    const isEntrance = dz === 1 && !corner && i === 10;
    if (isEntrance && y > gr && y < FLOOR - 1) {
      g.set(x, y, z, "air");
      continue;
    }
    if (y === gr && isEntrance) { g.set(x, y, z, "polished_andesite"); continue; }
    g.set(x, y, z, b);
  }

  // Lantern under the lintel at the entrance, inside the shop
  if (dz === 1 && !corner && i === 10 && inward && gr <= FLOOR - 2) {
    g.set(inX, FLOOR - 2, inZ, "lantern", { hanging: "true" });
  }

  // Upper storey: spandrels, piers, glazing
  for (let y = Math.max(gr, FLOOR); y < CORNICE; y++) {
    let b;
    if (y === FLOOR || y === CORNICE - 1) b = "white_concrete";  // spandrels
    else if (pier) b = "light_gray_concrete";
    else b = "light_blue_stained_glass_pane";
    g.set(x, y, z, b);
  }

  // Warm light behind selected upper-storey windows
  if (!pier && i % 8 === 2 && inward && gr < 7) {
    g.set(inX, 7, inZ, "glowstone");
  }

  // Cornice and parapet
  if (gr <= CORNICE) g.set(x, CORNICE, z, "smooth_quartz");
  g.set(x, ROOF, z, "smooth_quartz");
}

// Roof plant room on the interior of the roof
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (x < 7 || x > 12 || z < 7 || z > 12) continue;
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) continue;
  const gr = ground.get(`${x},${z}`);
  if (gr > CORNICE - 1) continue;
  const border = x === 7 || x === 12 || z === 7 || z === 12;
  for (let y = CORNICE + 1; y <= CORNICE + 2; y++) {
    if (border) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "air");
  }
  g.set(x, CORNICE + 3, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
