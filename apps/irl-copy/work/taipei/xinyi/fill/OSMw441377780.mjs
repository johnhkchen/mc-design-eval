import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: low-rise commercial block, two storeys of about 5 blocks, roof ~11 above lowest ground.
// Read as a late-20th-century Taipei street-front block: white concrete with glass shopfronts,
// a stone plinth, black fascia over the ground floor, light-grey cornice and parapet, and a
// rooftop penthouse with air-conditioning plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377780";
const W = 50, H = 23, D = 78;
const ROOF = 11;     // roof slab top, measured from the lowest ground (y 0)
const PARAPET = 12;  // single parapet course above the roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(g)));
}

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g3.set(x, y, z, b, p);
  else g3.set(x, y, z, b);
};
const inFP = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Missing neighbours => exterior faces. dx/dz point outward.
const faces = (x, z) => {
  const out = [];
  if (!inFP(x, z - 1)) out.push({ dx: 0, dz: -1, facing: "north", axis: "x" });
  if (!inFP(x, z + 1)) out.push({ dx: 0, dz: 1, facing: "south", axis: "x" });
  if (!inFP(x - 1, z)) out.push({ dx: -1, dz: 0, facing: "west", axis: "z" });
  if (!inFP(x + 1, z)) out.push({ dx: 1, dz: 0, facing: "east", axis: "z" });
  return out;
};

const paneFor = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- 1. Body: foundation, floor slabs, roof slab, facades ----
const doorCandidates = [];

for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const mid = g + Math.floor((ROOF - g) / 2); // first-floor slab (about 5 above ground)

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  // Ground slab and first-floor slab, roof slab
  put(x, g, z, edge ? "stone_bricks" : "smooth_stone");
  put(x, mid, z, edge ? "light_gray_concrete" : "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");

  if (!edge) continue;

  // Facade pattern taken from the first exterior face the cell touches
  const f = fs[0];
  const i = f.axis === "x" ? x : z; // position along the facade
  const pane = paneFor(f.axis);

  // Ground floor: plinth, glass shopfront with pillars, black fascia
  for (let y = g + 1; y <= mid - 1; y++) {
    if (y === g + 1) {
      put(x, y, z, "stone_bricks");
    } else if (y === mid - 1 && mid - 1 > g + 1) {
      put(x, y, z, "black_concrete");
    } else if (i % 4 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", pane);
    }
  }

  // Warm shop lights behind some ground-floor glass
  if (i % 8 === 2 && mid - 1 > g + 2) {
    const ix = x - f.dx, iz = z - f.dz;
    if (inFP(ix, iz) && faces(ix, iz).length === 0) put(ix, g + 2, iz, "glowstone");
  }

  // Upper storey: window bays with pillars, lit windows, cornice course
  for (let y = mid + 1; y <= 9; y++) {
    if (i % 3 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", pane);
  }
  if (mid + 3 <= 9 && i % 6 === 4) {
    const ix = x - f.dx, iz = z - f.dz;
    if (inFP(ix, iz) && faces(ix, iz).length === 0) put(ix, mid + 3, iz, "glowstone");
  }
  put(x, 10, z, "light_gray_concrete"); // cornice

  // Parapet
  put(x, PARAPET, z, "white_concrete");

  // Door candidates on the south-facing (z max) side
  if (fs.some((q) => q.dz === 1)) doorCandidates.push({ x, z, g });
}

// ---- 2. Entrance: one door on the south face, centred on that face ----
if (doorCandidates.length) {
  const maxZ = Math.max(...doorCandidates.map((c) => c.z));
  const row = doorCandidates.filter((c) => c.z === maxZ).sort((a, b) => a.x - b.x);
  const c = row[Math.floor(row.length / 2)];
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 1, c.z, "oak_door", doorProps("lower"));
  put(c.x, c.g + 2, c.z, "oak_door", doorProps("upper"));
}

// ---- 3. Rooftop penthouse and plant ----
let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  minx = Math.min(minx, x); maxx = Math.max(maxx, x);
  minz = Math.min(minz, z); maxz = Math.max(maxz, z);
}
const cx = Math.floor((minx + maxx) / 2);
const cz = Math.floor((minz + maxz) / 2);
const bx0 = cx - 8, bx1 = cx + 7, bz0 = cz - 5, bz1 = cz + 6;

// Penthouse only where every cell (and its neighbours) is well inside the footprint
let penthouseOk = true;
for (let x = bx0 - 1; x <= bx1 + 1 && penthouseOk; x++)
  for (let z = bz0 - 1; z <= bz1 + 1 && penthouseOk; z++)
    if (!inFP(x, z) || gAt(x, z) > ROOF - 2) penthouseOk = false;

if (penthouseOk) {
  for (let x = bx0; x <= bx1; x++) {
    for (let z = bz0; z <= bz1; z++) {
      const onEdge = x === bx0 || x === bx1 || z === bz0 || z === bz1;
      const axis = (x === bx0 || x === bx1) ? "z" : "x";
      for (let y = PARAPET; y <= 14; y++) {
        if (y === PARAPET) {
          put(x, y, z, "white_concrete");
        } else if (y === 14) {
          put(x, y, z, "light_gray_concrete");
        } else if (onEdge) {
          const i = axis === "x" ? x : z;
          if (i % 3 === 0) put(x, y, z, "white_concrete");
          else put(x, y, z, "glass_pane", paneFor(axis));
        }
      }
      put(x, 15, z, "light_gray_concrete"); // penthouse roof
    }
  }
  // Warm light in two penthouse windows on the south face
  put(cx - 3, 13, bz1 + 0, "glowstone");
  put(cx + 3, 13, bz1 + 0, "glowstone");
}

// Air-conditioning plant boxes on the roof, only where the roof is solid and clear
const roofBox = (x0, z0, w, d, y0, h, block) => {
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++)
      if (!inFP(x, z)) return;
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++)
      for (let y = y0; y < y0 + h; y++) put(x, y, z, block);
};
const clearOfPenthouse = (x0, z0, w, d) =>
  x0 + w <= bx0 - 1 || x0 >= bx1 + 2 || z0 + d <= bz0 - 1 || z0 >= bz1 + 2;

const plant = [[minx + 4, minz + 8, 3, 2], [maxx - 7, maxz - 12, 3, 2]];
for (const [x0, z0, w, d] of plant) {
  if (clearOfPenthouse(x0, z0, w, d)) roofBox(x0, z0, w, d, PARAPET, 2, "gray_concrete");
}

g3.save(`${DIR}/${ID}.nbt`);
