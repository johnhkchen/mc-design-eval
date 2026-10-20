import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 171 Water Street, DUMBO. Built 2014, One & Two Family Buildings.
// Reads as a modern two-storey brick infill with a stone base, stone floor
// bands, a stone cornice, a glazed street front and a small brick chimney.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3411557";
const W = 5, H = 17, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Per-cell record: ground (foundation top) and roof (lidar height above y0),
// smoothed to whole blocks and clamped so the roof and chimney fit the canvas.
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.min(H - 6, Math.max(0, Math.round(gr)));
  const top = Math.min(H - 2, Math.max(ground + 3, Math.round(roof)));
  map.set(`${x},${z}`, { g: ground, r: top });
}
const has = (x, z) => map.has(`${x},${z}`);

const exposure = (x, z) => ({
  zMin: !has(x, z - 1),
  zMax: !has(x, z + 1),
  xMin: !has(x - 1, z),
  xMax: !has(x + 1, z),
});

// Entrance on the z-min edge, nearest the middle of the width.
let door = null;
{
  let best = Infinity;
  for (const [key, c] of map) {
    const [x, z] = key.split(",").map(Number);
    const e = exposure(x, z);
    if (!e.zMin) continue;
    const score = Math.abs(x - Math.floor(W / 2)) * 100 + z;
    if (score < best) { best = score; door = { x, z, g: c.g }; }
  }
}

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const { g: ground, r: roof } = c;
  const e = exposure(x, z);
  const onZFace = (e.zMin || e.zMax) && !(e.xMin || e.xMax);
  const onXFace = (e.xMin || e.xMax) && !(e.zMin || e.zMax);
  const perimeter = e.zMin || e.zMax || e.xMin || e.xMax;

  // 1. Foundation: stone base course from y0 up to the cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // 2. Storeys from the ground up.
  for (let y = ground; y <= roof - 1; y++) {
    const rel = y - ground;

    // Roof: perimeter gets a stone cornice course, interior a smooth roof deck.
    if (y === roof - 1) {
      g.set(x, y, z, perimeter ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Floor bands (storey lines) at even offsets from the ground.
    if (rel % 2 === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Odd offsets: the storey wall band. Interior is air behind the glass.
    if (!perimeter) continue;

    // Entrance: two-block door on the ground floor, stone lintel above.
    if (door && x === door.x && z === door.z && e.zMin) {
      if (y === ground + 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === ground + 3) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
    }

    // Window columns: odd along-face cells are windows, corners stay brick.
    let windowHere = false;
    if (onZFace) windowHere = x % 2 === 1;
    else if (onXFace) windowHere = z % 2 === 1;

    if (windowHere) {
      // One or two warm upper-storey windows per facade, not a cluster.
      const along = onZFace ? x : z;
      const lit = rel === 3 && along === 1;
      g.set(x, y, z, lit ? "glowstone" : "glass_pane", lit ? undefined : {
        north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // 3. Chimney on the central cell, rising from the roof, capped with a slab.
  if (x === Math.floor(W / 2) && z === Math.floor(D / 2)) {
    for (let y = roof; y <= roof + 1 && y < H - 1; y++) g.set(x, y, z, "bricks");
    if (roof + 2 < H) g.set(x, roof + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
