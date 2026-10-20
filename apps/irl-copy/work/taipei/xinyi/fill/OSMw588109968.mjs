import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw588109968: 21 x 44 footprint, roof about 31 blocks above the lowest ground.
// Read as a 1990s-2000s Taipei mid-rise commercial block: six storeys of white tiled
// cladding, quartz storey bands, tinted glass in aluminium-look piers, a shopfront base
// with an iron entrance door, a roof parapet and a central plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109968";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 43, D = 44;
const ROOF = 31;          // roof slab level (top of the building body)
const PARAPET = ROOF + 1; // parapet course
const SLABS = [1, 6, 11, 16, 21, 26, 31];

const key = (x, z) => `${x},${z}`;

// Footprint and per-cell ground. Clamp ground so there is always room for the building.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(Math.round(gr), ROOF - 8)));
}
const inFp = (x, z) => ground.has(key(x, z));

// Outward exposure of each footprint cell.
const DIRS = [
  { n: "N", dx: 0, dz: -1, facing: "north", axis: "x" },
  { n: "S", dx: 0, dz: 1, facing: "south", axis: "x" },
  { n: "E", dx: 1, dz: 0, facing: "east", axis: "z" },
  { n: "W", dx: -1, dz: 0, facing: "west", axis: "z" },
];
const exposure = new Map();
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const ex = DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
  exposure.set(key(x, z), ex);
}

// Depth from the perimeter (0 = perimeter cell).
const depth = new Map();
const queue = [];
for (const [k, ex] of exposure) {
  if (ex.length > 0) {
    depth.set(k, 0);
    queue.push(k);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const k = queue[qi];
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k);
  for (const dd of DIRS) {
    const nk = key(x + dd.dx, z + dd.dz);
    if (inFp(x + dd.dx, z + dd.dz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push(nk);
    }
  }
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (ex) => {
  // A pane connects along the wall it sits in.
  const runsX = ex.some((d) => d.axis === "x");
  return {
    north: runsX ? "false" : "true",
    south: runsX ? "false" : "true",
    east: runsX ? "true" : "false",
    west: runsX ? "true" : "false",
    waterlogged: "false",
  };
};

// Pass 1: each cell's body, foundation, floors, roof, parapet, penthouse.
const storeyInfo = new Map(); // key -> array of {b, e, idx}
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dpt = depth.get(k) ?? 0;
  const perim = dpt === 0;

  // Foundation under the ground line (downhill sides show their extra storeys).
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");

  // Storey bottoms: ground line plus the regular 5-block slab lines above it.
  const bots = [...new Set([gr, ...SLABS.filter((s) => s >= gr + 5 && s < ROOF)])].sort(
    (a, b) => a - b
  );
  const storeys = bots.map((b, i) => ({ b, e: i + 1 < bots.length ? bots[i + 1] : ROOF, idx: i }));
  storeyInfo.set(k, storeys);

  if (perim) {
    // Wall cladding over the full height, then base course, band and openings below.
    for (let y = gr; y < ROOF; y++) set(x, y, z, "white_concrete");
    set(x, gr, z, "polished_andesite");
    for (const s of storeys) {
      set(x, s.e - 1, z, "smooth_quartz"); // storey line
    }
    set(x, PARAPET, z, "smooth_quartz"); // parapet course
  } else {
    // Interior: floor slabs at storey lines, air between.
    for (let y = gr; y < ROOF; y++) {
      if (bots.includes(y)) set(x, y, z, "smooth_quartz");
    }
  }

  // Roof slab over the whole footprint.
  set(x, ROOF, z, "light_gray_concrete");

  // Plant penthouse set well back from the perimeter.
  if (dpt >= 4) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) set(x, y, z, "light_gray_concrete");
  }
}

// Pass 2: windows, shopfront, lights.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if ((depth.get(k) ?? 0) !== 0) continue;
  const ex = exposure.get(k);
  if (ex.length === 0) continue;

  const corner = ex.length >= 2;
  const face = ex.find((d) => d.axis === "x") ?? ex[0];
  const idx = face.axis === "x" ? x : z;
  const pane = paneProps(ex);
  const storeys = storeyInfo.get(k);

  for (const s of storeys) {
    for (let y = s.b + 1; y <= s.e - 2; y++) {
      if (corner) continue; // corner columns stay as solid piers
      if (s.idx === 0) {
        // Shopfront: continuous glass with piers only at every third cell.
        if (idx % 3 === 0) continue;
        set(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (idx % 3 === 0) continue; // pier
      set(x, y, z, "gray_stained_glass_pane", pane);

      // Warm light on the inside of some windows.
      if ((s.idx + idx) % 5 === 0) {
        const ix = x - face.dx;
        const iz = z - face.dz;
        if (inFp(ix, iz) && (depth.get(key(ix, iz)) ?? 0) >= 1) {
          set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Entrance: a door on the north (or any street) face, near the middle of the frontage.
const candidates = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if ((depth.get(k) ?? 0) !== 0) continue;
  const ex = exposure.get(k);
  const north = ex.find((d) => d.n === "N");
  if (north) candidates.push({ x, z, gr, dir: north });
}
let door = null;
if (candidates.length) {
  const xs = candidates.map((c) => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  door = candidates.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid))[0];
} else {
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    const ex = exposure.get(k);
    if (ex.length && (depth.get(k) ?? 0) === 0) {
      door = { x, z, gr, dir: ex[0] };
      break;
    }
  }
}
if (door) {
  const f = door.dir.facing;
  set(door.x, door.gr + 1, door.z, "iron_door", {
    facing: f, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  set(door.x, door.gr + 2, door.z, "iron_door", {
    facing: f, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
