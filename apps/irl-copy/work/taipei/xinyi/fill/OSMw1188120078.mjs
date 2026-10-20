import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1188120078";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 15, D = 8;
const g = new Voxels([W, H, D]);

// Record: roof about 3 blocks above lowest ground. Read as a single-storey
// flat-roofed concrete-and-tile pavilion (utility/kiosk-scale block of
// 1980s-90s Taipei): walls to y 2, roof slab at y 3, low parapet at y 4.
const WALL_TOP = 2;   // highest wall course (absolute)
const ROOF_Y = 3;     // roof slab (absolute)
const PARAPET_Y = 4;  // parapet course (absolute)

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);
const has = (x, z) => ground.has(k(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Classify each footprint cell.
const info = [];
for (const [x, z, gr] of cells) {
  const missing = Object.keys(DIRS).filter(d => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });
  let kind = "interior";
  let face = null;
  if (missing.length > 0) {
    kind = "wall";
    if (missing.length === 1) {
      const d = missing[0];
      // lateral neighbours for a north/south face are east/west, and vice versa
      const lat = (d === "north" || d === "south") ? ["west", "east"] : ["north", "south"];
      const plain = lat.every(l => {
        const [dx, dz] = DIRS[l];
        return has(x + dx, z + dz);
      });
      if (plain) {
        kind = "face";
        face = d;
      }
    }
  }
  info.push({ x, z, gr, kind, face });
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const c of info) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");
}

// 2. Base course, floor, walls, windows.
const faceCells = info.filter(c => c.kind === "face");

for (const c of info) {
  const { x, z, gr, kind, face } = c;

  if (kind === "interior") {
    // floor at ground level, ceiling slab at WALL_TOP
    g.set(x, gr, z, "smooth_stone");
    if (WALL_TOP > gr) g.set(x, WALL_TOP, z, "smooth_stone");
    continue;
  }

  // exterior cells: base course at ground level
  g.set(x, gr, z, "polished_andesite");

  // wall rows above the base
  for (let y = gr + 1; y <= WALL_TOP; y++) {
    let block = "white_concrete";
    if (kind === "face") {
      const idx = (face === "north" || face === "south") ? x : z;
      if (idx % 2 === 1) block = "glass_pane";
    }
    g.set(x, y, z, block);
  }
}

// 3. Entrance door on the south face (z max), middle of that face.
const southFace = faceCells
  .filter(c => c.face === "south")
  .sort((a, b) => a.x - b.x);
const doorCandidates = southFace.length ? southFace : faceCells.sort((a, b) => a.x - b.x);
if (doorCandidates.length) {
  const d = doorCandidates[Math.floor(doorCandidates.length / 2)];
  const doorFacing = d.face === "south" || d.face === "north" || d.face === "east" || d.face === "west"
    ? d.face : "south";
  if (d.gr + 2 <= WALL_TOP) {
    const common = { facing: doorFacing, hinge: "left", open: "false", powered: "false" };
    g.set(d.x, d.gr + 1, d.z, "oak_door", { ...common, half: "lower" });
    g.set(d.x, d.gr + 2, d.z, "oak_door", { ...common, half: "upper" });
    // glass transom/side light for articulation is omitted to keep the door clear
  }
}

// 4. Roof slab over every footprint cell, and parapet on the perimeter.
for (const c of info) {
  g.set(c.x, ROOF_Y, c.z, "smooth_stone");
  if (c.kind !== "interior") {
    g.set(c.x, PARAPET_Y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 5. Warm light: hanging lantern under the ceiling at the interior cell nearest the centroid.
const interior = info.filter(c => c.kind === "interior");
if (interior.length) {
  const cx = info.reduce((s, c) => s + c.x, 0) / info.length;
  const cz = info.reduce((s, c) => s + c.z, 0) / info.length;
  interior.sort((a, b) =>
    Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  const l = interior[0];
  const ly = Math.min(WALL_TOP - 1, l.gr + 1);
  g.set(l.x, ly, l.z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
