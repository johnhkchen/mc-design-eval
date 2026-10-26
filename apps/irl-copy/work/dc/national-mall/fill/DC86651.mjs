import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1101 Vermont Ave NW: 1980s-era downtown commercial office block.
// Massing: 6 storeys (4-block ground floor, 3-block upper floors), concrete piers,
// tinted glazing, stone base and cornice, single recessed-looking entrance on the street face.
// Solid core, one-block air gap behind the glass, roof plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 20, D = 15, H = 32;
const cells = JSON.parse(readFileSync(`${DIR}/DC86651.cells.json`, "utf8"));

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr, rf] of cells) {
  const g = Math.max(0, Math.min(20, Math.round(gr)));
  const r = Math.max(g + 8, Math.min(29, Math.round(rf))); // headroom for roof plant
  fp.set(key(x, z), { g, r });
}
const inFp = (x, z) => fp.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from outside edge: 1 = facade wall, 2 = air gap behind glass, 3+ = solid core.
const dist = new Map();
let queue = [];
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
while (queue.length) {
  const next = [];
  for (const [x, z] of queue) {
    const d = dist.get(key(x, z));
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz, nk = key(nx, nz);
      if (inFp(nx, nz) && !dist.has(nk)) { dist.set(nk, d + 1); next.push([nx, nz]); }
    }
  }
  queue = next;
}

const g = new Voxels([W, H, D]);

// Storey lines: base at ground (o=0), floor slabs at o=4,7,10,... (ground storey 4 tall, others 3)
const isSlab = (o) => o === 0 || (o >= 4 && (o - 4) % 3 === 0);
const DOOR_X = 9;           // single entrance, centred on the street face
const FLANK_X = [8, 10];    // stone surround either side of the door

for (const [k, { g: gr, r }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k) ?? 1;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (d === 1) {
    // Facade wall
    const onZ = z === 0 || z === D - 1;
    const onX = x === 0 || x === W - 1;
    const pier = onZ && onX ? true : onZ ? x % 2 === 0 : z % 2 === 0;
    const streetFace = z === 0;
    const doorCell = streetFace && x === DOOR_X;
    const surround = streetFace && FLANK_X.includes(x);
    const lintelCell = streetFace && (x === DOOR_X || FLANK_X.includes(x));

    for (let y = gr; y < r; y++) {
      const o = y - gr;
      if (y === r - 1) { g.set(x, y, z, "stone_bricks"); continue; }          // parapet cornice
      if (o === 0) { g.set(x, y, z, "stone_bricks"); continue; }            // base course
      if (doorCell && (o === 1 || o === 2)) {
        const half = o === 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (streetFace && o === 3 && lintelCell) { g.set(x, y, z, "stone_bricks"); continue; } // entrance lintel
      if (surround && (o === 1 || o === 2)) { g.set(x, y, z, "stone_bricks"); continue; }    // door surround
      if (isSlab(o)) { g.set(x, y, z, "smooth_stone"); continue; }           // floor line / spandrel
      if (pier) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass");
      // warm light in the air gap one block inward, behind some glass
      if ((x * 7 + y * 3 + z * 5) % 11 === 0) {
        const dx = x === 0 ? 1 : x === W - 1 ? -1 : 0;
        const dz = z === 0 ? 1 : z === D - 1 ? -1 : 0;
        const ix = x + dx, iz = z + dz;
        if (inFp(ix, iz) && dist.get(key(ix, iz)) === 2) g.set(ix, y, iz, "shroomlight");
      }
    }
  } else if (d === 2) {
    // Air gap behind the glass: floor slabs and roof only
    for (let y = gr; y < r; y++) {
      if (isSlab(y - gr) || y === r - 1) g.set(x, y, z, "smooth_stone");
    }
  } else {
    // Solid core
    for (let y = gr; y < r; y++) {
      g.set(x, y, z, y === r - 1 ? "smooth_stone" : "white_concrete");
    }
    // Roof plant penthouse: one continuous two-high box on the core, stands on the roof
    if (x >= 6 && x <= 9 && z >= 5 && z <= 8 && r + 2 <= H) {
      g.set(x, r, z, "light_gray_concrete");
      g.set(x, r + 1, z, x === 6 || x === 9 || z === 5 || z === 8 ? "stone_bricks" : "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC86651.nbt`);
