import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Roof ~21 blocks above lowest ground (lidar).
// Read as a 1990s-2000s four-storey Xinyi mixed-use block: white tiled
// spandrels, quartz storey lines, light-blue glass grid with concrete mullions,
// a dark shopfront with a central entrance and canopy, and a small plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280238";
const W = 22, H = 33, D = 17;
const TOP = 21;          // parapet cap, absolute y from lowest ground
const ROOF = 20;         // roof slab, absolute y
const STOREY = 5;        // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);

// Outward faces of a cell (north = -z, south = +z, west = -x, east = +x).
function outward(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Pass 1: foundations, walls, floors, roof, parapet.
const edgeFace = new Map();
for (const [x, z, gr0] of cells) {
  const gr = clamp(Math.round(gr0), 0, TOP - 4);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = outward(x, z);
  const edge = faces.length > 0;
  if (edge) edgeFace.set(`${x},${z}`, faces);
  const along = faces.length && (faces[0] === "north" || faces[0] === "south") ? x : z;

  for (let y = gr; y <= TOP; y++) {
    if (y >= ROOF) {
      if (edge) {
        if (y === ROOF) g.set(x, y, z, "smooth_quartz");
        else g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      } else if (y === ROOF) {
        g.set(x, y, z, "light_gray_concrete");   // roof slab
      }
      continue;
    }

    if (!edge) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gr || y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const r = y % STOREY;
    const ground = y < STOREY;
    if (y === gr) {
      g.set(x, y, z, "polished_andesite");    // base course
    } else if (r === 0) {
      g.set(x, y, z, "smooth_quartz");         // storey line
    } else if (r === 4) {
      g.set(x, y, z, "white_concrete");        // spandrel
    } else {
      // window zone (r = 1..3)
      const mullion = along % 3 === 0;
      if (ground) {
        if (mullion) g.set(x, y, z, "black_concrete");
        else if ((x * 31 + z * 17 + y * 7) % 13 === 0) g.set(x, y, z, "glowstone");
        else g.set(x, y, z, "light_blue_stained_glass");
      } else {
        if (mullion) g.set(x, y, z, "light_gray_concrete");
        else if ((x * 31 + z * 17 + y * 7) % 13 === 0) g.set(x, y, z, "glowstone");
        else g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Pass 2: rooftop plant room and AC units on interior roof cells.
for (const [x, z] of [...groundOf.keys()].map(k => k.split(",").map(Number))) {
  if (edgeFace.has(`${x},${z}`)) continue;
  if (x >= 7 && x <= 14 && z >= 5 && z <= 11) {
    g.set(x, TOP - 0, z, "white_concrete");
  }
}
// Plant room: 2 blocks tall box at y 21..22 (roof slab already below).
for (const [x, z] of [...groundOf.keys()].map(k => k.split(",").map(Number))) {
  if (edgeFace.has(`${x},${z}`)) continue;
  if (x >= 7 && x <= 14 && z >= 5 && z <= 11) {
    g.set(x, TOP + 1, z, "white_concrete");
    if (x === 10 || x === 11) g.set(x, TOP + 1, z, "smooth_quartz");
  }
}
// Small AC units scattered on the roof.
for (const [x, z] of [...groundOf.keys()].map(k => k.split(",").map(Number))) {
  if (edgeFace.has(`${x},${z}`)) continue;
  if ((x + 2 * z) % 9 === 0 && !(x >= 6 && x <= 15 && z >= 4 && z <= 12)) {
    g.set(x, TOP, z, "iron_block");
  }
}

// Pass 3: entrance on the north (-z) face, nearest the middle of its run.
const northCells = [...edgeFace.entries()]
  .filter(([, f]) => f.includes("north"))
  .map(([k]) => k.split(",").map(Number));
if (northCells.length) {
  const xs = northCells.map(([x]) => x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  northCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  const [dx, dz] = northCells[0];
  const gr = clamp(Math.round(groundOf.get(`${dx},${dz}`)), 0, TOP - 4);
  g.set(dx, gr, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the entrance, within the footprint, on the storey-0 top row.
  for (const cx of [dx - 1, dx, dx + 1]) {
    if (has(cx, dz)) g.set(cx, 4, dz, "black_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
