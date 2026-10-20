import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001523";
const W = 10, H = 19, D = 5;

// 3 WILLOW STREET, Brooklyn Heights: 1980 brick one/two-family house, three
// storeys of about two blocks each, stone string courses, glass sash windows,
// a dark roof, a stoop-level entrance and a brick chimney.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cm = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  let roof = Math.round(rf);
  roof = Math.min(Math.max(roof, ground + 5), H - 4);
  cm.set(`${x},${z}`, { x, z, ground, roof });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function faces(x, z) {
  return DIRS.filter(([dx, dz]) => !cm.has(`${x + dx},${z + dz}`)).map(([dx, dz]) => ({ dx, dz }));
}

// Window columns alternate along each outward face; corners stay solid brick.
function isWindowFace(x, z, f) {
  const along = f.dx !== 0 ? z : x;
  const lo = f.dx !== 0 ? minZ : minX;
  const hi = f.dx !== 0 ? maxZ : maxX;
  return (along - lo) % 2 === 1 && along > lo && along < hi;
}

// Entrance: the street-side (z-min) perimeter cell nearest the middle of the front.
let doorKey = null;
{
  const midX = (minX + maxX) / 2;
  let best = Infinity;
  for (const c of cm.values()) {
    if (c.z !== minZ) continue;
    if (!faces(c.x, c.z).some((f) => f.dz === -1)) continue;
    const d = Math.abs(c.x - midX);
    if (d < best) { best = d; doorKey = `${c.x},${c.z}`; }
  }
}

for (const c of cm.values()) {
  const { x, z, ground: gr, roof: r } = c;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storey floor / string-course rows; window rows sit between them.
  const levels = [];
  for (let L = gr; L + 1 <= r - 2; L += 2) levels.push(L);

  const fs = faces(x, z);

  if (fs.length) {
    // Street-facing or side perimeter wall.
    const winF = fs.find((f) => isWindowFace(x, z, f));
    const isDoor = doorKey === `${x},${z}`;

    for (let y = gr; y < r; y++) {
      if (isDoor && y === gr) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && y === gr + 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === r) {
        g.set(x, y, z, "stone_brick_wall", { up: "true", north: "none", east: "none", south: "none", west: "none", waterlogged: "false" });
        continue;
      }
      if (y === r - 1 || levels.includes(y)) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      if ((y - gr) % 2 === 1 && winF) {
        const props = winF.dx !== 0
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  } else {
    // Interior: air gap with a floor slab per storey and a ceiling below the roof.
    for (let y = gr; y < r; y++) {
      if (levels.includes(y) || y === r - 1) g.set(x, y, z, "spruce_planks");
    }
    // Warm light behind some street-side windows.
    if (z === 1 && [3, 7].includes(x)) {
      for (const L of levels) {
        if (L + 1 <= r - 2) g.set(x, L + 1, z, "glowstone");
      }
    }
  }

  // Dark tile roof over the interior; perimeter cells already carry the parapet.
  if (!fs.length) g.set(x, r, z, "deepslate_tiles");
}

// Brick chimney on the interior roof, on a cell that is actually present.
{
  let ch = cm.get("8,1");
  if (!ch) ch = [...cm.values()].find((c) => faces(c.x, c.z).length === 0);
  if (ch) {
    const { x, z, roof: r } = ch;
    g.set(x, r + 1, z, "bricks");
    g.set(x, r + 2, z, "bricks");
    g.set(x, r + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
