import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block: 2 storeys over a shopfront base,
// white-concrete facade with pillar bays, a shopfront with entrance on the
// south (front) face, a grey parapet, and a rooftop water tank and AC units.
// Roof sits at y = 11 above the lowest ground (lidar record).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024335982";
const W = 22, H = 23, D = 17;
const TOP = 11;          // parapet top, absolute y
const FLOOR1 = 5;        // storey-1 ceiling / storey-2 floor (belt course)
const ROOF = 10;         // roof deck / upper belt course
const DOOR_X = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, gr);

const has = (x, z) => groundAt.has(`${x},${z}`);
const clampG = (gr) => Math.min(ROOF, Math.max(0, Math.round(gr)));

// Outward faces of a footprint cell (faces that touch open air)
function outward(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
}
const interior = (x, z) => has(x, z) && outward(x, z).length === 0;
const inwardOffset = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Warm light behind a glass cell, placed in the interior cell just inside the facade
function maybeLight(x, z, face, y, t) {
  const [ox, oz] = inwardOffset[face];
  const ix = x + ox, iz = z + oz;
  if (!interior(ix, iz)) return;
  if ((t + y * 2 + x + z) % 4 === 0) put(ix, y, iz, "glowstone");
}

// Pass 1: foundation, floor slabs and roof deck on every footprint cell
for (const [x, z, rawG] of cells) {
  const gr = clampG(rawG);
  const base = Math.max(gr, 1);
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  // interior floor slabs
  if (base <= FLOOR1) put(x, FLOOR1, z, "smooth_stone");
  if (base <= ROOF) put(x, ROOF, z, "gray_concrete");
}

// Pass 2: facade, storey lines, parapet, shopfront, windows and lights
for (const [x, z, rawG] of cells) {
  const faces = outward(x, z);
  if (faces.length === 0) continue;
  const gr = clampG(rawG);
  const base = Math.max(gr, 1);
  const face = faces.includes("south") ? "south" : faces[0];
  const isFront = face === "south";
  const t = face === "north" || face === "south" ? x : z; // position along facade

  for (let y = base; y <= TOP; y++) {
    if (y === TOP) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === FLOOR1 || y === ROOF) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y < FLOOR1) {
      // Ground storey
      if (isFront) {
        if (t === DOOR_X && y <= base + 1 && base + 1 <= 3) {
          const half = y === base ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "south", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (t === DOOR_X && y === base + 2) { put(x, y, z, "gray_concrete"); continue; }
        if (y === 4) { put(x, y, z, "black_concrete"); continue; }   // shopfront fascia
        if (y === base) { put(x, y, z, "smooth_stone"); continue; }   // plinth
        if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
        put(x, y, z, "light_blue_stained_glass");
        maybeLight(x, z, face, y, t);
        continue;
      }
      // Non-front ground storey: bays with frames
      if (y === base) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y === 4) { put(x, y, z, "gray_concrete"); continue; }
      if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      maybeLight(x, z, face, y, t);
      continue;
    }

    if (y <= 9) {
      // Upper storey: pillar bays, sills and heads, glass between
      if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      if (y === 6 || y === 9) { put(x, y, z, "gray_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      maybeLight(x, z, face, y, t);
    }
  }
}

// Pass 3: roof equipment on interior roof cells
for (const [x, z] of [[4, 4], [5, 4], [4, 6]]) {
  if (!interior(x, z)) continue;
  put(x, TOP, z, "iron_block");
  put(x, TOP + 1, z, "iron_block");
}
const tank = [[14, 5], [15, 5], [14, 6], [15, 6]];
if (tank.every(([x, z]) => interior(x, z))) {
  for (const [x, z] of tank) {
    for (let y = TOP; y <= TOP + 2; y++) put(x, y, z, "oak_planks");
    put(x, TOP + 3, z, "oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
