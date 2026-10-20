import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173674";
const W = 23, H = 23, D = 17;

// Footprint: [x, z, ground] per cell (object form also tolerated).
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const x = Array.isArray(c) ? c[0] : c.x;
  const z = Array.isArray(c) ? c[1] : c.z;
  const gr = Array.isArray(c) ? c[2] : (c.ground ?? c.g ?? 0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(x + "," + z, Math.max(0, Math.round(gr)));
}

const has = (x, z) => ground.has(x + "," + z);
const OUT = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const faces = (x, z) => Object.keys(OUT).filter(d => !has(x + OUT[d][0], z + OUT[d][1]));
const cellList = [...ground.keys()].map(k => { const [x, z] = k.split(",").map(Number); return [x, z]; });

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Entrance: middle of the north (min z) face.
const northCells = cellList.filter(([x, z]) => faces(x, z).includes("N"));
let doorKey = null;
if (northCells.length) {
  const xs = northCells.map(([x]) => x).sort((a, b) => a - b);
  const doorX = xs[Math.floor(xs.length / 2)];
  const dc = northCells.find(([x]) => x === doorX);
  doorKey = dc[0] + "," + dc[1];
}

// Pass 1: foundation up to each cell's ground, ground surface at its top.
for (const [x, z] of cellList) {
  const gr = ground.get(x + "," + z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");
}

// Pass 2: interior floor slabs (storey lines at y5 and y10) on interior cells; air elsewhere.
for (const [x, z] of cellList) {
  if (faces(x, z).length) continue;
  const gr = ground.get(x + "," + z);
  if (gr < 5) put(x, 5, z, "smooth_stone");
  if (gr < 10) put(x, 10, z, "gray_concrete");
}

// Pass 3: perimeter walls, storeys, cornice, parapet, shopfront, entrance, lights.
for (const [x, z] of cellList) {
  const f = faces(x, z);
  if (!f.length) continue;
  const gr = ground.get(x + "," + z);
  const ns = f.includes("N") || f.includes("S");
  const ew = f.includes("E") || f.includes("W");
  const corner = ns && ew;
  const u = ns ? x : z;
  const pier = corner || (u % 3 === 0);
  const isDoor = (x + "," + z) === doorKey;
  // single outward face for light placement
  const outDir = f.length === 1 ? f[0] : null;

  for (let y = gr + 1; y <= 11; y++) {
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    let id;
    if (y <= 4) {
      if (y === gr + 1) id = "polished_andesite";          // plinth
      else if (y === 4) id = "gray_concrete";               // shopfront fascia
      else id = pier ? "white_terracotta" : "light_blue_stained_glass";
    } else if (y === 5) {
      id = "light_gray_concrete";                            // storey line
    } else if (y <= 9) {
      if (y === 6 || y === 9) id = "light_gray_concrete";    // spandrels
      else id = pier ? "white_terracotta" : "gray_stained_glass";
    } else if (y === 10) {
      id = "smooth_stone";                                   // cornice
    } else {
      id = "white_terracotta";                               // parapet
    }
    put(x, y, z, id);
  }

  // Warm lights behind some upper windows and shopfront windows.
  if (outDir && !pier) {
    const inX = x - OUT[outDir][0], inZ = z - OUT[outDir][1];
    if (has(inX, inZ) && faces(inX, inZ).length === 0) {
      if ((u + z) % 4 === 0) put(inX, 7, inZ, "glowstone");
      if (gr + 1 <= 4 && (u % 4 === 1)) put(inX, gr + 1, inZ, "lantern", { hanging: "false" });
    }
  }
}

// Pass 4: rooftop plant room and HVAC units on the roof deck (y10).
for (const [x, z] of cellList) {
  if (faces(x, z).length) continue;
  if (x >= 14 && x <= 18 && z >= 6 && z <= 10) {
    const ring = x === 14 || x === 18 || z === 6 || z === 10;
    if (ring) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
    }
    put(x, 13, z, "gray_concrete");
  }
  if (x >= 3 && x <= 5 && z >= 3 && z <= 4) {
    put(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
