import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78527.cells.json`, "utf8"));

const W = 9, H = 25, D = 8;
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => fp.has(key(x, z));

// Massing: one flat-roofed commercial block, flattened from lidar.
const grounds = cells.map(c => c[2]);
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const B = Math.max(...grounds);                       // common base course level
const medRoof = roofs[Math.floor(roofs.length / 2)];
const top = Math.min(H - 2, Math.max(B + 8, Math.round(medRoof)));  // roof surface height

// Storeys: about 3.25 blocks each, floor slabs on global levels.
const n = Math.max(2, Math.round((top - 1 - B) / 3.25));
const fl = [];
for (let k = 0; k <= n; k++) fl.push(B + Math.round(k * (top - 1 - B) / n));
fl[n] = top - 1;                                      // roof deck

const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push([0, -1, "north"]);
  if (!has(x, z + 1)) f.push([0, 1, "south"]);
  if (!has(x - 1, z)) f.push([-1, 0, "west"]);
  if (!has(x + 1, z)) f.push([1, 0, "east"]);
  return f;
};

const g = new Voxels([W, H, D]);

// Pick the entrance: exposed north (or south) face cell nearest the centre.
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const f = faces(x, z);
    const nf = f.find(q => q[2] === "north") || f.find(q => q[2] === "south");
    if (!nf) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; door = { x, z, facing: nf[2], dx: nf[0], dz: nf[1] }; }
  }
}

// 1. Foundation: solid from y0 up to the common base course.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Walls on perimeter cells, from base to just under the roof deck.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length === 0) continue;
  for (let y = B; y <= top - 1; y++) g.set(x, y, z, "bricks");
}

// 3. Floor slabs and roof deck across the whole footprint (air between them).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const y of fl) g.set(x, y, z, "stone_bricks");
}

// 4. Parapet with a light cornice line on the perimeter.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length === 0) continue;
  g.set(x, top, z, "stone_bricks");
  g.set(x, top - 1, z, "smooth_stone");
}

// 5. Windows: glass in each storey band on single-face wall cells.
const winCells = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const f = faces(x, z);
  if (f.length !== 1) continue;                       // skip corners
  const [dx, dz, name] = f[0];
  const idx = dx !== 0 ? z : x;
  for (let k = 0; k < n; k++) {
    const lo = fl[k] + 1, hi = fl[k + 1] - 1;
    for (let y = lo; y <= hi; y++) {
      let isWin;
      if (k === 0) isWin = true;                      // shopfront glazing at street level
      else isWin = idx % 2 === 1;                     // upper storeys: punched bays
      if (isWin) winCells.push({ x, z, y, dx, dz, name, idx, k });
    }
  }
}

for (const w of winCells) {
  g.set(w.x, w.y, w.z, "glass");
}

// 6. Warm light behind some upper-storey glass (glowstone in the room behind).
for (const w of winCells) {
  if (w.k === 0) continue;
  if (((w.x + w.z + w.y) % 4) !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (has(ix, iz)) g.set(ix, w.y, iz, "glowstone");
}

// 7. Entrance: doors on the chosen front, with a canopy-height lintel course.
if (door) {
  const dRows = [B + 1, B + 2];
  const hinge = "left";
  g.set(door.x, dRows[0], door.z, "oak_door", {
    facing: door.facing, half: "lower", hinge, open: "false", powered: "false"
  });
  g.set(door.x, dRows[1], door.z, "oak_door", {
    facing: door.facing, half: "upper", hinge, open: "false", powered: "false"
  });
  // Lintel course above the door, stone, reads as a stone surround.
  g.set(door.x, B + 3, door.z, "stone_brick_slab", {
    type: "bottom", waterlogged: "false"
  });
  // Flank the door with lanterns' warm light inside.
  const ix = door.x - door.dx, iz = door.z - door.dz;
  if (has(ix, iz)) g.set(ix, B + 1, iz, "glowstone");
}

// 8. Roof equipment: a small stair-access housing on the roof deck, if it fits.
{
  const rx = 2, rz = 2;
  if (has(rx, rz) && faces(rx, rz).length === 0) {
    for (let y = top; y <= top + 1; y++) {
      g.set(rx, y, rz, "stone_bricks");
      g.set(rx + 1, y, rz, "stone_bricks");
      g.set(rx, y, rz + 1, "stone_bricks");
      g.set(rx + 1, y, rz + 1, "stone_bricks");
    }
    g.set(rx, top + 1, rz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC78527.nbt`);
