import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century mixed-use block, Xinyi: white-tiled concrete frame, grey trim bands,
// glazed shopfront under a two-storey office wall, flat roof with parapet and plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401857";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));

// Outward normals; Minecraft "north" is -z.
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const interior = (x, z) => DIRS.every((d) => has(x + d.dx, z + d.dz));

// Entrance: middle cell of the south face (or first face with enough cells).
let ent = null;
for (const name of ["south", "north", "east", "west"]) {
  const d = DIRS.find((q) => q.n === name);
  const face = cells
    .filter(([x, z]) => !has(x + d.dx, z + d.dz))
    .map(([x, z]) => ({ x, z, t: d.dx !== 0 ? z : x }))
    .sort((a, b) => a.t - b.t);
  if (face.length >= 3) {
    const mid = face[Math.floor(face.length / 2)];
    ent = { x: mid.x, z: mid.z, face: name };
    break;
  }
}

const windows = []; // storey-2 window cells, for lights behind glass

for (const [x, z, gr] of cells) {
  const inside = interior(x, z);

  // Foundation up to natural ground, then plinth / ground slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, inside ? "light_gray_concrete" : "stone_bricks");

  // Floor slab at storey-2 level (y=5) and roof deck (y=10) across the footprint.
  if (gr < 5) put(x, 5, z, "light_gray_concrete");
  if (gr < 10) put(x, 10, z, inside ? "light_gray_concrete" : "smooth_stone");

  // Parapet on the perimeter, top at y=11.
  if (!inside && gr < 11) put(x, 11, z, "white_concrete");

  // Facade on every exposed side.
  for (const d of DIRS) {
    if (has(x + d.dx, z + d.dz)) continue;
    const t = d.dx !== 0 ? z : x;
    const pillar = t % 3 === 0;
    const isEnt = ent && ent.x === x && ent.z === z && ent.face === d.n;

    for (let y = gr + 1; y <= 11; y++) {
      if (y === 11) { put(x, y, z, "white_concrete"); continue; }   // parapet
      if (y === 10) { put(x, y, z, "smooth_stone"); continue; }      // cornice
      if (y === 5) { put(x, y, z, "light_gray_concrete"); continue; } // storey band
      if (y === 4) { put(x, y, z, "light_gray_concrete"); continue; } // shopfront lintel

      if (y <= 3) {
        // Ground storey: shopfront glazing, pillars, entrance.
        if (isEnt && y <= gr + 2 && y >= gr + 1) {
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: d.n, half, hinge: "left", open: "false", powered: "false",
          });
        } else if (pillar) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
        continue;
      }

      // Storey 2 (y 6..9): sill and head courses, window bays between pillars.
      if (y === 6 || y === 9) { put(x, y, z, "white_concrete"); continue; }
      if (pillar) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      if (y === 7) windows.push({ x, z, dx: d.dx, dz: d.dz, t, lit: (t % 6 === 1) });
    }
  }
}

// Warm lights behind some windows (inside air cells, never on the perimeter wall).
for (const w of windows) {
  if (!w.lit) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!has(ix, iz) || !interior(ix, iz)) continue;
  const gi = GROUND.get(key(ix, iz));
  if (gi < 7) put(ix, 7, iz, "glowstone");
}
// Ground-storey lights as well, on alternate bays.
for (const [x, z, gr] of cells) {
  for (const d of DIRS) {
    if (has(x + d.dx, z + d.dz)) continue;
    const t = d.dx !== 0 ? z : x;
    if (t % 6 !== 2) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (!has(ix, iz) || !interior(ix, iz)) continue;
    if (GROUND.get(key(ix, iz)) < 2) put(ix, 2, iz, "glowstone");
  }
}

// Roof plant: small AC / tank blocks on the roof deck, interior cells only.
for (const [x, z, gr] of cells) {
  if (!interior(x, z) || gr > 10) continue;
  if ((x * 3 + z * 7) % 19 !== 0) continue;
  put(x, 11, z, "iron_block");
  put(x, 12, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
