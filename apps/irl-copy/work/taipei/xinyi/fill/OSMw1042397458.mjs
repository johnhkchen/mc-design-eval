import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397458";
const W = 28, H = 33, D = 14;

// Footprint cells: [x, z, ground]. y 0 is the lowest ground under the building.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...cells.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.min(18, Math.max(0, Math.round(gr - base))));
}
const inFP = (x, z) => ground.has(key(x, z));

// Outward directions: a wall cell has a neighbour outside the footprint.
const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: 1, dz: 0, f: "east" },
  { dx: -1, dz: 0, f: "west" },
];
const outs = (x, z) => DIRS.filter((d) => !inFP(x + d.dx, z + d.dz));

// Design: 4 storeys of 5 blocks (floor lines at y%5 == 0 and 4), window bands
// at y%5 in 1..3, white concrete mullions every 3 blocks, cornice at y 19,
// parapet at y 20. Roof deck sits at y 20 (roof is 21 blocks above y 0).
const g = new Voxels([W, H, D]);

// Pass 1: foundation and envelope.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const out = outs(x, z);
  const corner = out.length >= 2;

  for (let y = gr; y <= 20; y++) {
    let id = null;
    if (out.length === 0) {
      // Interior: floor slabs at storey lines, roof deck at top.
      if (y === 20) id = "gray_concrete";
      else if (y % 5 === 0) id = "smooth_stone";
    } else {
      if (y === 20) id = "white_concrete";                 // parapet
      else if (y === 19) id = "smooth_stone";              // cornice
      else if (y === 0) id = "stone_bricks";               // base course
      else if (y % 5 === 0 || y % 5 === 4) id = "light_gray_concrete"; // floor line spandrels
      else {                                               // window band
        const o = out[0];
        const idx = o.dz !== 0 ? x : z;
        const pillar = corner || idx % 3 === 0;
        id = pillar ? "white_concrete" : "light_blue_stained_glass";
      }
    }
    if (id) g.set(x, y, z, id);
  }
}

// Pass 2: entrance on the north (z = 0) face, two-block dark oak door.
if (inFP(14, 0)) {
  const dg = ground.get(key(14, 0));
  g.set(14, dg, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(14, dg + 1, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Pass 3: warm lights behind selected windows (on the floor, inside the glass).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const out = outs(x, z);
  if (out.length !== 1) continue;
  const o = out[0];
  const idx = o.dz !== 0 ? x : z;
  if (idx % 6 !== 1) continue;
  const nx = x - o.dx, nz = z - o.dz;
  if (!inFP(nx, nz)) continue;
  const ng = ground.get(key(nx, nz));
  for (let s = 0; s < 4; s++) {
    const y = 5 * s + 1;
    if (ng > y) continue;
    g.set(nx, y, nz, s === 0 ? "glowstone" : "shroomlight");
  }
}

// Pass 4: roof plant and a short mast on the interior of the roof.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outs(x, z).length !== 0) continue;
  if (x >= 5 && x <= 9 && z >= 4 && z <= 9) {
    g.set(x, 21, z, "light_gray_concrete");
    g.set(x, 22, z, "light_gray_concrete");
  }
  if (x >= 20 && x <= 22 && z >= 5 && z <= 8) {
    g.set(x, 21, z, "gray_concrete");
    g.set(x, 22, z, "gray_concrete");
  }
  if (x === 14 && z === 6) {
    for (let y = 21; y <= 24; y++) g.set(x, y, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
