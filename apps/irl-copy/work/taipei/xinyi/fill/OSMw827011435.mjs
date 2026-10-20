import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei commercial block: 1970s concrete frame, white tiled walls,
// punched window bands, a red-fascia shopfront on the street face, a
// parapet roof with plant. Two storeys of about 5 blocks, roof at y 10 (parapet 11).

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw827011435";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 6, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), 10));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const PANE_Z_FACE = { north: "false", south: "false", east: "true", west: "true" };
const PANE_X_FACE = { north: "true", south: "true", east: "false", west: "false" };
const DOOR_BASE = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Which exterior faces a cell has, in priority order (street face first).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Door column on the street face (N): prefer x = 2.
let doorX = null;
for (const x of [2, 3, 1, 4, 0, 5]) {
  if (has(x, 0)) { doorX = x; break; }
}

for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const gr = G(x, z);
  const f = faces(x, z);
  const edge = f.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground floor at gr, second floor at 5, roof deck at 10.
  g.set(x, gr, z, "smooth_stone");
  if (gr < 5) g.set(x, 5, z, "smooth_stone");
  g.set(x, 10, z, "light_gray_concrete");

  if (!edge) {
    // Interior: air gap above the floors, lights behind selected windows.
    continue;
  }

  const face = f[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const paneProps = (face === "N" || face === "S") ? PANE_Z_FACE : PANE_X_FACE;
  const isStreet = face === "N";

  // Edge cell: solid wall from its ground up to the roof deck, then parapet.
  for (let y = gr; y <= 9; y++) {
    if (y < 5) {
      // Ground storey
      if (y === gr) {
        g.set(x, y, z, "stone_bricks");
      } else if (isStreet) {
        if (y === 4) g.set(x, y, z, "red_concrete");
        else if (y === 3) g.set(x, y, z, "glass");
        else g.set(x, y, z, "glass");
      } else {
        if (y === gr + 1 || y === gr + 2) {
          if (idx % 2 === 1) g.set(x, y, z, "glass_pane", paneProps);
          else g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, y === 4 ? "light_gray_concrete" : "white_concrete");
        }
      }
    } else {
      // Upper storey
      if (y === 5) g.set(x, y, z, "smooth_stone");
      else if (y === 9) g.set(x, y, z, "light_gray_concrete");
      else {
        if (idx % 2 === 1) g.set(x, y, z, "glass_pane", paneProps);
        else g.set(x, y, z, "white_concrete");
      }
    }
  }

  // Cornice and parapet on the edge ring.
  g.set(x, 10, z, "smooth_stone");
  g.set(x, 11, z, "white_concrete");
}

// Shopfront door on the street face: lower and upper halves.
if (doorX !== null && has(doorX, 0) && G(doorX, 0) <= 3) {
  const gr = G(doorX, 0);
  g.set(doorX, gr, 0, "iron_door", { ...DOOR_BASE, half: "lower" });
  g.set(doorX, gr + 1, 0, "iron_door", { ...DOOR_BASE, half: "upper" });
}

// Warm light behind street-side glass (interior cells at z = 1).
for (const x of [1, 4]) {
  if (has(x, 1) && has(x, 0)) {
    const gr = G(x, 0);
    if (gr + 2 <= 3) g.set(x, gr + 2, 1, "glowstone");
    g.set(x, 7, 1, "glowstone");
  }
}
// One lit window on the back face for variety.
if (has(2, 7) && has(2, 8)) {
  g.set(2, 7, 7, "shroomlight");
}

// Roof plant: a water tank block group and a small AC unit on interior roof cells.
const tankCells = [[1, 6], [2, 6], [1, 7], [2, 7]];
for (const [x, z] of tankCells) {
  if (has(x, z)) {
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}
if (has(4, 2)) g.set(4, 11, 2, "iron_block");
if (has(4, 3)) g.set(4, 11, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save(`${dir}/${id}.nbt`);
