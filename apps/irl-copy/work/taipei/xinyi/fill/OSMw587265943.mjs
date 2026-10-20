import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district office block, c. 1990s: white concrete frame, quartz mullions,
// light-blue glazing, stone base and cornice, rooftop plant room with louvres.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265943";
const W = 32, D = 38, H = 41;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let B = 0; // base level: highest ground under the footprint
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy > B) B = gy;
}
const inside = (x, z) => ground.has(`${x},${z}`);

// Roof at about 29 blocks above the lowest ground; storeys of 5 blocks.
const ROOF = 29;
let n = Math.max(3, Math.round((ROOF - B) / 5));
n = Math.min(n, Math.floor((40 - 8 - B) / 5)); // keep antenna inside H
const T = B + 5 * n; // roof slab row

const g = new Voxels([W, H, D]);

// Place only on footprint cells, inside the volume.
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces of a ring cell: [dx, dz] pairs.
const faces = (x, z) => {
  const f = [];
  if (!inside(x - 1, z)) f.push([-1, 0]);
  if (!inside(x + 1, z)) f.push([1, 0]);
  if (!inside(x, z - 1)) f.push([0, -1]);
  if (!inside(x, z + 1)) f.push([0, 1]);
  return f;
};

const ring = [];   // perimeter cells with their outward faces
const all = [];    // all footprint cells
for (const [x, z] of cells) {
  all.push([x, z]);
  const f = faces(x, z);
  if (f.length) ring.push([x, z, f]);
}
const isRing = (x, z) => ring.some(([rx, rz]) => rx === x && rz === z);

// 1) Foundation: solid from y 0 up to the base, with a polished base course on the ring.
for (const [x, z] of all) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}
for (const [x, z] of all) {
  if (B > 0 && isRing(x, z)) put(x, B - 1, z, "polished_andesite");
}

// 2) Floor slabs at every storey line (ground floor included) plus the roof slab.
for (let s = 0; s < n; s++) {
  const row = B + 5 * s;
  for (const [x, z] of all) put(x, row, z, "stone");
  for (const [x, z] of ring) put(x, row, z, "smooth_stone"); // string course
}
for (const [x, z] of all) put(x, T, z, "gray_concrete");

// 3) Facade: concrete walls, quartz mullions, glazed bands, spandrels, interior glow.
for (const [x, z, f] of ring) {
  for (let s = 0; s < n; s++) {
    const base = B + 5 * s;

    if (f.length >= 2) {
      // Corner column.
      for (let dy = 1; dy <= 4; dy++) put(x, base + dy, z, "smooth_quartz");
      continue;
    }

    const [dx, dz] = f[0];
    const a = dx !== 0 ? z : x; // position along the face
    const isMullion = a % 3 === 0;

    if (isMullion) {
      for (let dy = 1; dy <= 4; dy++) put(x, base + dy, z, "smooth_quartz");
      continue;
    }

    const pane = dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

    for (let dy = 1; dy <= 3; dy++) put(x, base + dy, z, "light_blue_stained_glass_pane", pane);
    put(x, base + 4, z, "light_gray_concrete"); // spandrel

    // Warm light behind some windows: glowstone on the floor just inside the glass.
    if (a % 9 === 4) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !isRing(ix, iz)) put(ix, base + 1, iz, "glowstone");
    }
  }
}

// 4) Entrance on the z = 0 face: door at x = 16, canopy across x 13..19.
const EX = 16;
for (let x = EX - 3; x <= EX + 3; x++) {
  for (let z = 0; z <= 1; z++) {
    put(x, B + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}
put(EX, B + 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(EX, B + 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// 5) Parapet: two courses of concrete with a stone cap on the ring.
for (const [x, z] of ring) {
  put(x, T + 1, z, "white_concrete");
  put(x, T + 2, z, "white_concrete");
  put(x, T + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 6) Rooftop plant room, inset from the parapet, with louvred band and roof slab.
const PX0 = 8, PX1 = 23, PZ0 = 10, PZ1 = 27;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, T + 5, z, "smooth_stone"); // roof of plant room
    if (!edge) continue;
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
    put(x, T + 3, z, "iron_bars");
    put(x, T + 4, z, "light_gray_concrete");
  }
}

// 7) Antenna on the plant room roof.
const AX = 16, AZ = 18;
for (let dy = 6; dy <= 8; dy++) {
  put(AX, T + dy, AZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
