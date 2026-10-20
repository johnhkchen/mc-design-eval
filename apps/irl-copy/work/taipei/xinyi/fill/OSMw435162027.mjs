import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw435162027";

const W = 64, H = 23, D = 60;
const ROOF = 11;   // flat roof, 11 blocks above lowest ground (y 0)
const SLAB1 = 5;   // storey line between ground floor and second floor
const SLAB2 = 10;  // storey line under cornice band

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(key(x, z));
const DIRS = [
  { dx: 1, dz: 0, facing: "east" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: 0, dz: -1, facing: "north" },
];
const outs = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => outs(x, z).length > 0;

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations, interiors (shell with air + floor slabs), facades
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");
  if (gr > ROOF) continue;

  const out = outs(x, z);

  if (out.length === 0) {
    // interior: floor slabs only, air between (no interior fit-out)
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) set(x, y, z, "gray_concrete");
      else if (y === gr || y === SLAB1 || y === SLAB2) set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // facade cell
  const d0 = out[0];
  const s = d0.dx !== 0 ? z : x;          // position along the wall
  const corner = out.length > 1;
  const pier = corner || s % 4 === 0;
  const door = out.length === 1 && s % 16 === 8 && gr <= 2;

  for (let y = gr; y <= ROOF; y++) {
    let b = null;
    let props = null;

    if (y === gr) {
      b = "polished_granite";                       // base course
    } else if (y === ROOF) {
      b = "smooth_quartz";                          // parapet
    } else if (y === SLAB2) {
      b = "red_terracotta";                         // red cornice band
    } else if (y === SLAB1) {
      b = "smooth_stone";                           // storey line
    } else if (y < SLAB1) {
      // ground floor: shopfront
      if (door && (y === gr + 1 || y === gr + 2)) {
        props = {
          facing: d0.facing,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
        set(x, y, z, "dark_oak_door", props);
        continue;
      } else if (door && y === gr + 3) {
        b = "red_terracotta";                       // entrance canopy lintel
      } else if (pier) {
        b = "light_gray_concrete";
      } else {
        b = "light_blue_stained_glass";
      }
    } else {
      // second storey: window grid
      if (y === 6 || y === 9) b = "smooth_quartz";  // spandrels
      else if (pier) b = "light_gray_concrete";
      else b = "light_blue_stained_glass_pane";     // y 7, 8
    }

    if (b) set(x, y, z, b);
  }
}

// Pass 2: warm light behind some windows (in the air cell inside the wall)
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const out = outs(x, z);
  if (out.length !== 1) continue;
  const d0 = out[0];
  const s = d0.dx !== 0 ? z : x;
  const ix = x - d0.dx, iz = z - d0.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igr = ground.get(key(ix, iz));
  const pier = s % 4 === 0;
  if (pier) continue;

  if (s % 8 === 2 && igr < 7) set(ix, 7, iz, "glowstone");
  if (s % 8 === 6 && igr < 2) set(ix, 2, iz, "glowstone");
}

// Roof plant: a 2x2 water tank on the roof, nearest to the centre
{
  const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length;
  const cz = cells.reduce((a, c) => a + c[1], 0) / cells.length;
  let best = null, bestD = Infinity;
  for (const [x, z] of cells) {
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!quad.every(([qx, qz]) => has(qx, qz) && !isEdge(qx, qz))) continue;
    if (quad.some(([qx, qz]) => ground.get(key(qx, qz)) > ROOF - 1)) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = quad; }
  }
  if (best) {
    for (const [qx, qz] of best) {
      set(qx, ROOF + 1, qz, "iron_block");
      set(qx, ROOF + 2, qz, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
