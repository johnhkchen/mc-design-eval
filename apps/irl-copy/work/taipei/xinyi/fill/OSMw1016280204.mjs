import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280204";
const W = 21, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Datum: one storey-line base just above the lowest ground.
const L = Math.min(...ground.values());
const F = L + 1;          // first storey floor level
const TOP = F + 20;       // roof slab (4 storeys of 5 blocks)
const PARA = TOP + 1;     // parapet course on the edge

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  g.set(x, y, z, b);
};

// Facade material for an edge wall block. k = storey index, o = offset in storey (0..4), i = along-face index.
function wallBlock(x, y, z, k, o, i) {
  if (o === 0) return k === 0 ? "polished_andesite" : "light_gray_concrete"; // floor band
  if (o === 4) return "white_concrete";                                       // storey line
  if (i % 3 === 0) return "white_concrete";                                   // mullion / pier
  if (k === 0) return "glass";                                                // shopfront glazing
  const h = (x * 7 + z * 13 + y * 3 + i * 5) % 11;
  if (o === 2 && h === 0) return "glowstone";                                 // lit window behind glass
  return "light_blue_stained_glass";
}

// Foundations, walls, floor slabs and roof, column by column.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, y === gr ? "smooth_stone" : "stone_bricks");

  if (isEdge(x, z)) {
    for (let y = gr + 1; y <= TOP - 1; y++) {
      const rel = y - F;
      const k = Math.floor(rel / 5);
      const o = rel % 5;
      const faces = [];
      if (!has(x, z - 1)) faces.push(x);
      if (!has(x, z + 1)) faces.push(x);
      if (!has(x - 1, z)) faces.push(z);
      if (!has(x + 1, z)) faces.push(z);
      for (const i of faces) put(x, y, z, wallBlock(x, y, z, k, o, i));
    }
    if (gr < TOP) put(x, TOP, z, "light_gray_concrete");   // cornice
    put(x, PARA, z, "white_concrete");                     // parapet
  } else {
    for (let k = 0; k < 4; k++) {
      const y = F + 5 * k;
      if (y > gr) put(x, y, z, "light_gray_concrete");     // storey slab
    }
    if (gr < TOP) put(x, TOP, z, "gray_concrete");         // roof deck
  }
}

// Entrance on the south (max z) face, nearest the middle of the frontage.
{
  const zMax = Math.max(...cells.map(c => c[1]));
  const front = cells.filter(c => c[1] === zMax);
  const xMid = (Math.min(...cells.map(c => c[0])) + Math.max(...cells.map(c => c[0]))) / 2;
  front.sort((a, b) => Math.abs(a[0] - xMid) - Math.abs(b[0] - xMid));
  const [dx, dz, dg] = front[0];
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  if (dg + 2 < TOP) {
    g.set(dx, dg + 1, dz, "oak_door", doorProps("lower"));
    g.set(dx, dg + 2, dz, "oak_door", doorProps("upper"));
  }
  // Canopy over the door, supported by the wall course beside it.
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz) && dg + 3 < TOP) put(dx + ox, dg + 3, dz, "white_concrete");
  }
}

// Roof mechanical penthouse, centred on the roof plate.
{
  const x0 = 7, x1 = 12, z0 = 6, z1 = 11;
  let full = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || gOf(x, z) >= TOP) full = false;
  }
  if (full) {
    for (let y = TOP + 1; y <= TOP + 2; y++) {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const perim = x === x0 || x === x1 || z === z0 || z === z1;
        if (!perim) continue;
        const pier = (x === x0 || x === x1) && (z === z0 || z === z1);
        const mid = (x + z) % 2 === 0;
        put(x, y, z, pier || (y === TOP + 2 && mid) ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, TOP + 3, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
