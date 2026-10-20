import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block, c. 1990s: white tiled wall with
// blue-glass window bands, granite base, a granite-framed entrance, and a flat
// roof with plant boxes. Roof surface sits at y 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807444";
const W = 79, H = 23, D = 35;
const ROOF = 11;      // roof deck level
const BELT = 5;       // storey line between floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.round((minX + maxX) / 2);

const g = new Voxels([W, H, D]);

// Place only above the cell's own ground and inside the grid.
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (y < gnd(x, z)) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const edgeXOf = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const edgeZOf = (x, z) => !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundations, floors, roof deck, and the wall shell.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g0 = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0 && y < H; y++) g.set(x, y, z, "stone_bricks");

  const eX = edgeXOf(x, z), eZ = edgeZOf(x, z);
  const edge = eX || eZ;
  const corner = eX && eZ;

  // Ground floor slab on interior cells.
  if (!edge) put(x, g0, z, "smooth_stone");

  // Storey belt and roof deck, all cells.
  put(x, BELT, z, "smooth_stone");
  put(x, ROOF, z, edge ? "smooth_quartz" : "gray_concrete");

  if (!edge) continue;

  // Facade: base course, windows, piers, spandrels, cornice and parapet.
  const t = eX && !eZ ? z : x; // position along the wall
  const pier = corner || t % 4 === 0;

  put(x, g0, z, "polished_granite");
  for (let y = g0 + 1; y <= 4; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, BELT, z, "smooth_stone");
  put(x, 6, z, pier ? "white_concrete" : "light_gray_concrete");
  for (let y = 7; y <= 9; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, 10, z, pier ? "white_concrete" : "light_gray_concrete");
  put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: warm lights behind some upper windows, in the air gap inside the glass.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!edgeXOf(x, z) && !edgeZOf(x, z)) continue;
  const eX = edgeXOf(x, z), eZ = edgeZOf(x, z);
  if (eX && eZ) continue;
  const t = eX ? z : x;
  if (t % 8 !== 2) continue;
  let dx = 0, dz = 0;
  if (eX) dx = !has(x - 1, z) ? 1 : -1;
  else dz = !has(x, z - 1) ? 1 : -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (gnd(x, z) > 7) continue;
  g.set(ix, 8, iz, "glowstone");
}

// Pass 3: entrance on the street-facing (minimum z) side, centred.
const entranceX = [midX - 2, midX - 1, midX, midX + 1, midX + 2];
for (const x of entranceX) {
  if (!has(x, minZ)) continue;
  const g0 = gnd(x, minZ);
  // Door panels: dark tinted glass, three blocks high, sits on the base course.
  for (let y = g0 + 1; y <= g0 + 3; y++) {
    if (y < H) g.set(x, y, minZ, "tinted_glass");
  }
  // Granite threshold replaces the base course in the doorway.
  if (g0 < H) g.set(x, g0, minZ, "polished_granite");
  // Lintel above the door.
  if (g0 + 4 < H) g.set(x, g0 + 4, minZ, "smooth_quartz");
}
// Hanging lanterns beside the door, under the belt slab.
for (const x of [midX - 2, midX + 2]) {
  const g0 = has(x, minZ) ? gnd(x, minZ) : 0;
  if (has(x, minZ) && g0 + 4 < BELT && BELT < H) {
    g.set(x, g0 + 4, minZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: roof plant boxes, placed only where every cell is in the footprint.
const boxes = [
  [minX + 10, minZ + 6, 9, 5, 3],
  [maxX - 18, maxZ - 12, 8, 5, 3],
  [midX - 3, minZ + 14, 6, 4, 2],
];
for (const [bx, bz, bw, bd, bh] of boxes) {
  let ok = true;
  for (let x = bx; x < bx + bw && ok; x++)
    for (let z = bz; z < bz + bd && ok; z++)
      if (!has(x, z) || gnd(x, z) > ROOF) ok = false;
  if (!ok) continue;
  for (let x = bx; x < bx + bw; x++)
    for (let z = bz; z < bz + bd; z++)
      for (let h = 0; h < bh; h++) {
        const y = ROOF + 1 + h;
        const top = h === bh - 1;
        const edge = x === bx || x === bx + bw - 1 || z === bz || z === bz + bd - 1;
        g.set(x, y, z, top ? "smooth_stone" : edge ? "stone_bricks" : "light_gray_concrete");
      }
}

g.save(`${DIR}/${ID}.nbt`);
