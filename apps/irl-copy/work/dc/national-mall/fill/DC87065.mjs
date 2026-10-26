import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87065.cells.json`, "utf8"));

const W = 12, H = 16, D = 13;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Cell map: ground per cell, plus lidar roof per cell
const C = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  const gg = Math.round(gr);
  const rr = Math.round(rf);
  C.set(`${x},${z}`, { g: gg, rl: rr });
  roofs.push(rr);
}
const has = (x, z) => C.has(`${x},${z}`);

// One clean roof tier: median lidar roof, lifted so every cell has two storeys of room
roofs.sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...[...C.values()].map(c => c.g));
const R = Math.max(median, maxG + 4);
for (const c of C.values()) c.r = R;

const perim = (x, z) => {
  const Wm = !has(x - 1, z), Em = !has(x + 1, z), Nm = !has(x, z - 1), Sm = !has(x, z + 1);
  return { Wm, Em, Nm, Sm, any: Wm || Em || Nm || Sm, faceX: Wm || Em, faceZ: Nm || Sm, Sm };
};

// Door: street (south) face, nearest the middle, must have two rows of height
const southCells = [];
for (const [key, c] of C) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1) && c.g + 2 <= c.r - 1) southCells.push([x, z]);
}
let door = null;
if (southCells.length) {
  const xs = southCells.map(([x]) => x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  southCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  const [dx, dz] = southCells[0];
  door = { x: dx, z: dz, g: C.get(`${dx},${dz}`).g };
}

// Pass 1: foundations, interiors, walls
for (const [key, { g: gg, r }] of C) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const p = perim(x, z);

  if (!p.any) {
    // Interior: floor, storey slab, roof slab; air between
    put(x, gg, z, "smooth_stone");
    if (gg + 2 < r - 1) put(x, gg + 2, z, "smooth_stone");
    put(x, r - 1, z, "stone_bricks");
    continue;
  }

  // Perimeter walls, ground to roof-1
  for (let y = gg; y <= r - 1; y++) {
    let b = "bricks";
    if (y === gg) {
      b = "stone_bricks"; // plinth / base course
    } else if (y === gg + 2 && gg + 2 < r - 1) {
      b = "stone_bricks"; // storey string course
    } else if (y === r - 1) {
      b = "bricks"; // top course under parapet
    } else if (p.faceX && !p.faceZ) {
      if (z % 3 === 1) b = "glass_pane";
    } else if (p.faceZ && !p.faceX) {
      if (x % 3 === 1) b = "glass_pane";
    }
    // Ground storey on the street face is boarded
    if (y === gg + 1 && b === "glass_pane" && p.Sm) b = "oak_planks";
    // Pilaster reads: corners stay solid brick (faceX && faceZ)
    if (p.faceX && p.faceZ && y > gg) b = (y === gg + 2) ? "stone_bricks" : "bricks";
    put(x, y, z, b);
  }

  // Stone parapet cap
  put(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Interior-facing floor/slab edges
  put(x, gg, z, "smooth_stone");
  if (gg + 2 < r - 1) put(x, gg + 2, z, "stone_bricks");
}

// Pass 2: entrance on the street face, with a small stone canopy over it
if (door) {
  put(door.x, door.g + 1, door.z, "oak_door",
    { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 2, door.z, "oak_door",
    { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy: slab just above the door head, on the wall line
  if (door.g + 3 <= R) {
    put(door.x, door.g + 3, door.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 3: one warm light behind a north-face glass window (interior air)
for (const [key, { g: gg }] of C) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1)) continue;
  if (!has(x, z + 1)) continue;
  if (perim(x, z + 1).any) continue;
  if (x % 3 === 1) {
    put(x, gg + 1, z + 1, "glowstone");
    break;
  }
}

g.save(`${DIR}/DC87065.nbt`);
