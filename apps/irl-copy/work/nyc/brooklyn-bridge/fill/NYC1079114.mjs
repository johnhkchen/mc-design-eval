import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1079114";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  map.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));

// Entrance: a wall cell with one exterior face, scanning from the street side (low z first)
let door = null;
const sorted = [...map.keys()].map(k => k.split(",").map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
for (const [x, z] of sorted) {
  const ext = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const faces = Object.entries(ext).filter(([, v]) => v).map(([k]) => k);
  if (faces.length === 1 && x >= 1 && x <= W - 2) {
    const facing = { n: "north", s: "south", w: "west", e: "east" }[faces[0]];
    door = { x, z, facing };
    break;
  }
}

for (const [k, { gr, rf }] of map) {
  const [x, z] = k.split(",").map(Number);
  const ext = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const nExt = Object.values(ext).filter(Boolean).length;
  const wall = nExt > 0;
  const corner = nExt >= 2;

  const R = Math.min(Math.max(rf, gr + 4), H - 1);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground slab: granite-grey base course on the street walls
  g.set(x, gr, z, wall ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= R - 1; y++) {
    const rel = y - gr;

    // Parapet: stone wall cap on the facade, flat roof deck inside
    if (y === R - 1) {
      g.set(x, y, z, wall ? "stone_brick_wall" : "smooth_stone");
      continue;
    }

    // Interior: air gap with a floor slab per storey
    if (!wall) {
      if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Cornice course under the parapet
    if (y === R - 2) {
      g.set(x, y, z, "chiseled_stone_bricks");
      continue;
    }

    // Ground floor shopfront: glass bays with polished piers, one entrance door
    if (rel === 1 || rel === 2) {
      const isDoor = door && door.x === x && door.z === z;
      if (isDoor) {
        const props = { facing: door.facing, hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "oak_door", { ...props, half: rel === 1 ? "lower" : "upper" });
      } else if (corner || (x + z) % 2 === 0) {
        g.set(x, y, z, "polished_andesite");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    // Floor bands (storey lines and sills/lintels)
    if (rel % 2 === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Upper window rows: brick piers and framed glass panes, some lit
    const windowCol = !corner && (x + z) % 2 === 1;
    if (windowCol) {
      const lit = ((x * 3 + z * 5 + rel) % 7 === 0);
      g.set(x, y, z, lit ? "glowstone" : "glass_pane");
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
