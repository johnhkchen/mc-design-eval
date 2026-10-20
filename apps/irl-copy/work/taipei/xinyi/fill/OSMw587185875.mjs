import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587185875";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: key "x,z" -> ground height (clamped below roof)
const ROOF = 55;          // roof deck level (11 storeys x 5 blocks)
const W = 7, H = 67, D = 7;
const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, Math.min(ROOF - 1, Math.round(gy)));

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const missN = (x, z) => !has(x, z - 1);
const missS = (x, z) => !has(x, z + 1);
const missW = (x, z) => !has(x - 1, z);
const missE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => missN(x, z) || missS(x, z) || missW(x, z) || missE(x, z);
const isCorner = (x, z) => (missW(x, z) || missE(x, z)) && (missN(x, z) || missS(x, z));
const key = (x, y, z) => `${x},${y},${z}`;

const cells = [...ground.keys()].map((k) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g: gnd(x, z) };
});

// Entrance: the south-facing edge cell nearest the centre column (x = 3)
let doorCell = null;
for (const c of cells) {
  if (!missS(c.x, c.z) || isCorner(c.x, c.z)) continue;
  if (!doorCell || Math.abs(c.x - 3) < Math.abs(doorCell.x - 3)) doorCell = c;
}

// Warm lights: glowstone in the air gap just inside some window bays
const lit = new Set();
for (const c of cells) {
  const { x, z, g } = c;
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  const idx = (missN(x, z) || missS(x, z)) ? x : z;
  if (idx % 2 === 0) continue; // mullion positions are not windows
  let dx = 0, dz = 0;
  if (missW(x, z)) dx = 1; else if (missE(x, z)) dx = -1;
  if (missN(x, z)) dz = 1; else if (missS(x, z)) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let y = g + 1; y < ROOF; y++) {
    if (y % 5 !== 2) continue;
    if ((x * 5 + z * 3 + Math.floor(y / 5) * 7) % 3 !== 0) continue;
    lit.add(key(ix, y, iz));
  }
}

const g = new Voxels([W, H, D]);

for (const c of cells) {
  const { x, z } = c;
  const gr = c.g;
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const faceX = missN(x, z) || missS(x, z); // wall runs along x
  const idx = faceX ? x : z;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys from ground to roof
  for (let y = gr; y < ROOF; y++) {
    if (edge) {
      if (isDoor && y === gr) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", powered2: "false" });
        continue;
      }
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }       // base course
      if (y % 5 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // floor spandrel
      if (y % 5 === 4) { g.set(x, y, z, "white_concrete"); continue; }     // lintel
      // window band (y%5 in 1..3)
      if (corner || idx % 2 === 0) { g.set(x, y, z, "white_concrete"); continue; } // pilaster / mullion
      const props = faceX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "light_blue_stained_glass_pane", props);
    } else {
      // Interior: air gap with floor slabs per storey
      if (y === gr || y % 5 === 0) g.set(x, y, z, "smooth_stone");
      else if (lit.has(key(x, y, z))) g.set(x, y, z, "glowstone");
    }
  }

  // Roof deck
  g.set(x, ROOF, z, "gray_concrete");

  // Parapet and cap on the perimeter
  if (edge) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "white_concrete");
    g.set(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof plant: small mechanical block, with a central tower and crown
  if (!edge && x >= 2 && x <= 4 && z >= 2 && z <= 4) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
  if (x === 3 && z === 3) {
    for (let y = ROOF + 1; y <= ROOF + 5; y++) g.set(x, y, z, "smooth_quartz");
    g.set(x, ROOF + 6, z, "sea_lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
