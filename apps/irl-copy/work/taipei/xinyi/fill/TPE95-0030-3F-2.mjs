import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE95-0030-3F-2: 2006 Xinyi mid-rise office block, 11 storeys (5 blocks each),
// white tiled piers, pale spandrels and blue glass bays, two setback tiers,
// entrance canopy on the street frontage, plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0030-3F-2";
const W = 12, H = 71, D = 21;
const STOREY = 5;
const NS = 11;          // storeys 0..10
const ROOF_Y = 59;      // roof top above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr - minG);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));

// Distance from the outside of the footprint (1 = outer ring)
const dist = new Map();
const queue = [];
for (const [x, z] of cellList) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (edge) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;

// Setback: minimum distance from outside kept per storey
const minD = (s) => (s < 6 ? 1 : s < 9 ? 2 : 3);
const active = (x, z, s) => has(x, z) && dOf(x, z) >= minD(s);
const perim = (x, z, s) => active(x, z, s) && dOf(x, z) === minD(s);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Corner test for pier columns
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Entrance: outer z=0 face, near the middle of the frontage
let doorX = null;
for (const pref of [5, 6, 4, 7, 3, 8]) {
  if (perim(pref, 0, 0)) { doorX = pref; break; }
}
const onEntranceFront = (x, z, s) => s === 0 && z === 0 && doorX !== null && Math.abs(x - doorX) <= 1;

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z] of cellList) {
  const gr = gOf(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");
}

// 2. Storeys
for (let s = 0; s < NS; s++) {
  const b = s * STOREY;

  // Floor slabs over every cell carried by the tier below (terraces included)
  for (const [x, z] of cellList) {
    const carried = s === 0 ? has(x, z) : active(x, z, s - 1);
    if (carried && b >= gOf(x, z)) put(x, b, z, "light_gray_concrete");
  }

  // Terrace guard rail on the outer edge of cells that lost their wall
  if (s > 0) {
    for (const [x, z] of cellList) {
      if (active(x, z, s - 1) && !active(x, z, s) && dOf(x, z) === minD(s - 1)) {
        if (b + 1 >= gOf(x, z))
          put(x, b + 1, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      }
    }
  }

  // Facade of this tier
  for (const [x, z] of cellList) {
    if (!perim(x, z, s)) continue;
    const gr = gOf(x, z);
    const k = x + z;
    const corner = isCorner(x, z);
    // white piers every third bay, and at corners; glass in the other two
    const pier = corner || k % 3 === 0;

    for (let off = 1; off <= 4; off++) {
      const y = b + off;
      if (y < gr || y >= b + STOREY) continue;

      // Light spandrel course at the top of each storey
      if (off === 4) { put(x, y, z, "light_gray_concrete"); continue; }

      // Ground-floor entrance: doors with a canopy above them
      if (onEntranceFront(x, z, s)) {
        if (x === doorX && (off === 1 || off === 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: off === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (off === 3) {
          // canopy slab over the entrance bay
          put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        } else if (x !== doorX) {
          // shopfront glass beside the door
          put(x, y, z, "light_blue_stained_glass");
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }

      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
    }

    // Warm light behind some windows: a lamp on the floor one cell inside
    if (!corner && k % 5 === 2 && s % 2 === 0 && s > 0) {
      const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dz]) => [x + dx, z + dz])
        .find(([nx, nz]) => active(nx, nz, s) && dOf(nx, nz) > minD(s));
      if (inward) {
        const [ix, iz] = inward;
        if (b + 1 >= gOf(ix, iz)) put(ix, b + 1, iz, "shroomlight");
      }
    }
  }
}

// 3. Roof: parapet, cornice and plant penthouse on top of storey 10
const top = NS * STOREY; // 55
for (const [x, z] of cellList) {
  if (!active(x, z, NS - 1)) continue;
  if (top >= gOf(x, z)) put(x, top, z, "light_gray_concrete");
}
for (const [x, z] of cellList) {
  if (!perim(x, z, NS - 1)) continue;
  for (let y = top + 1; y <= top + 3; y++) put(x, y, z, "white_concrete");
  put(x, top + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Plant penthouse
for (const [x, z] of cellList) {
  if (!active(x, z, NS - 1)) continue;
  if (x >= 4 && x <= 7 && z >= 7 && z <= 13) {
    for (let y = top + 1; y <= top + 3; y++) put(x, y, z, "gray_concrete");
  }
}
// Antenna on the penthouse
const antennaCell = [5, 10];
if (has(antennaCell[0], antennaCell[1])) {
  put(antennaCell[0], ROOF_Y, antennaCell[1], "lightning_rod", {
    facing: "up",
    powered: "false",
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
