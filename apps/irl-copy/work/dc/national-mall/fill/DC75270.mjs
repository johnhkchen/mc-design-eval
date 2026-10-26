import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75270.cells.json`, "utf8"));

const W = 22, H = 33, D = 12;
const g = new Voxels([W, H, D]);

const DIRS = [
  { dx: 1, dz: 0, axis: "x" },
  { dx: -1, dz: 0, axis: "x" },
  { dx: 0, dz: 1, axis: "z" },
  { dx: 0, dz: -1, axis: "z" },
];

// ---- Massing: per-cell ground and roof, smoothed into flat 3-block tiers ----
let y0 = Infinity;
for (const c of cells) y0 = Math.min(y0, c[2]);

const C = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr, roof] of cells) {
  const ground = gr - y0;
  let top = Math.round((roof - y0) / 3) * 3;
  top = Math.min(31, Math.max(ground + 4, top));
  C.set(key(x, z), { ground, top });
}

function exposedDirs(x, z, y) {
  const out = [];
  for (const d of DIRS) {
    const nc = C.get(key(x + d.dx, z + d.dz));
    if (!nc || y >= nc.top) out.push(d);
  }
  return out;
}

function inFootprint(x, z) {
  return C.has(key(x, z));
}

// ---- Pass 1: foundation, shell, floors, facade, entrance, roof ----
for (const [k, { ground, top }] of C) {
  const [x, z] = k.split(",").map(Number);

  // Plinth fill
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const r = y - ground;
    const exp = exposedDirs(x, z, y);

    // Cornice / roof slab
    if (y === top - 1) {
      g.set(x, y, z, exp.length ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    // Interior: floor slabs only, air behind glass
    if (exp.length === 0) {
      if (y % 3 === 0) g.set(x, y, z, "white_concrete");
      continue;
    }

    const d = exp[0];
    const along = d.axis === "x" ? z : x;

    // Base course
    if (r === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance bay on the z=0 face: pillars, lintel, two-leaf door, shopfront
    if (z === 0 && x >= 9 && x <= 12 && r >= 1 && r <= 3) {
      if (r === 3) {
        g.set(x, y, z, "stone_bricks");
      } else if (x === 9 || x === 12) {
        g.set(x, y, z, "polished_andesite");
      } else {
        const hinge = x === 10 ? "left" : "right";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge,
          open: "false",
          powered: "false",
        });
      }
      continue;
    }

    // Shopfront glazing at ground floor either side of the entrance
    if (z === 0 && r <= 2) {
      if (along % 3 === 0) {
        g.set(x, y, z, "polished_andesite");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Storey line
    if (y % 3 === 0) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Piers between window bays
    if (along % 3 === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Bronze-tinted office glazing
    g.set(x, y, z, "gray_stained_glass");
  }

  // Rooftop mechanical penthouse on central cells, set back from the edge
  if (x >= 9 && x <= 12 && z >= 5 && z <= 6 && top + 2 <= 32) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "smooth_stone");
  }
}

// ---- Pass 2: warm light behind some windows (sparse glowstone in the air gap) ----
const glows = new Set();
for (const [k, { ground, top }] of C) {
  const [x, z] = k.split(",").map(Number);
  for (let y = ground + 1; y < top - 1; y++) {
    if (y % 3 === 0) continue;
    const exp = exposedDirs(x, z, y);
    if (exp.length === 0) continue;
    if (((x * 5 + y * 3 + z) % 17) !== 0) continue;
    const d = exp[0];
    const ix = x - d.dx, iz = z - d.dz;
    if (!inFootprint(ix, iz)) continue;
    if (exposedDirs(ix, iz, y).length) continue;
    if (y >= C.get(key(ix, iz)).top - 1) continue;
    glows.add(`${ix},${y},${iz}`);
  }
}
for (const s of glows) {
  const [ix, iy, iz] = s.split(",").map(Number);
  g.set(ix, iy, iz, "glowstone");
}

g.save(`${DIR}/DC75270.nbt`);
