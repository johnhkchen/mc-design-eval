import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE105-0067-9F.cells.json`, "utf8"));

const W = 18, H = 57, D = 25;
const ROOF = 45;      // main roof slab level above lowest ground
const SETBACK = 30;   // podium roof level on the outer two-cell ring
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Setback massing: outer two-cell ring stops at SETBACK, the core rises to ROOF.
const inset = (x, z) => Math.min(x, z, W - 1 - x, D - 1 - z);
const topOf = (x, z) => (inset(x, z) < 2 ? SETBACK : ROOF);

// A neighbour shields this cell's wall only if it is in the footprint and reaches this cell's top.
const present = (x, z, top) => has(x, z) && topOf(x, z) >= top;

const dirs = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function missingFaces(x, z) {
  const top = topOf(x, z);
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(dirs)) {
    if (!present(x + dx, z + dz, top)) out.push(d);
  }
  return out;
}
const uAlong = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Pass 1: foundations, floor slabs, base course, roof slab.
for (const [x, z, gc] of cells) {
  const top = topOf(x, z);
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  for (let y = 0; y <= top; y += 5) {
    if (y >= gc) put(x, y, z, "light_gray_concrete");
  }
  if (gc > 0 && gc < top) put(x, gc, z, "light_gray_concrete"); // base course
  put(x, top, z, "light_gray_concrete");                        // roof slab
}

// Pass 2: facades on exterior cells, with parapets and caps.
for (const [x, z, gc] of cells) {
  const top = topOf(x, z);
  const miss = missingFaces(x, z);
  if (miss.length === 0) continue;

  const face = miss[0];
  const corner = miss.length >= 2;
  const [ix, iz] = inward[face];
  const u = uAlong(face, x, z);
  const innerOk = has(x + ix, z + iz) && topOf(x + ix, z + iz) > top - 2;
  const wallTop = top - 1;

  for (let y = gc + 1; y <= wallTop; y++) {
    const r = y % 5;
    const k = Math.floor(y / 5);
    if (y === wallTop) {
      put(x, y, z, "smooth_quartz");                 // cornice
    } else if (r === 0) {
      put(x, y, z, "light_gray_concrete");           // storey line
    } else if (r === 4) {
      put(x, y, z, "white_concrete");                // spandrel
    } else if (corner) {
      put(x, y, z, "white_concrete");                // solid corner pier
    } else if (u % 3 === 0) {
      put(x, y, z, "smooth_quartz");                 // mullion pier
    } else {
      put(x, y, z, "light_blue_stained_glass");      // window
      if (r === 2 && innerOk && (u + k) % 5 === 2) {
        put(x + ix, y, z + iz, "glowstone");         // warm light behind glass
      }
    }
  }

  // Parapet and cap on the top of each tier.
  for (let y = top + 1; y <= top + 2; y++) put(x, y, z, "white_concrete");
  put(x, top + 3, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

// Pass 3: entrance on the south face (z = 24) with quartz pillars, double doors, lanterns.
const doorZ = 24;
for (const x of [7, 10]) {
  if (!has(x, doorZ)) continue;
  const gc = gAt(x, doorZ);
  for (let y = gc + 1; y <= 3; y++) put(x, y, doorZ, "smooth_quartz");
}
for (const x of [8, 9]) {
  if (!has(x, doorZ)) continue;
  const gc = gAt(x, doorZ);
  const lo = gc + 1, hi = gc + 2;
  const hinge = x === 8 ? "right" : "left";
  put(x, lo, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, hi, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: roof penthouse core (x 5..12, z 8..16), cap at y 52, mast to 56.
for (let x = 5; x <= 12; x++) {
  for (let z = 8; z <= 16; z++) {
    if (!has(x, z)) continue;
    const boundary = x === 5 || x === 12 || z === 8 || z === 16;
    if (boundary) {
      for (let y = ROOF + 1; y <= 51; y++) {
        if (y >= 47 && y <= 49 && (x + z) % 3 !== 0) {
          put(x, y, z, "light_blue_stained_glass");
        } else {
          put(x, y, z, "white_concrete");
        }
      }
    }
    put(x, 52, z, "smooth_quartz");
  }
}
if (has(8, 12)) {
  for (let y = 53; y <= 56; y++) {
    put(8, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/TPE105-0067-9F.nbt`);
