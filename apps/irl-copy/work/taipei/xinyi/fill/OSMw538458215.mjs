import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458215";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 16;
const TOP = 10;          // last solid course; roof surface at y = 11
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inF.has(key(x, z));
const S = (x, y, z, id, p) => { if (y >= 0 && y < H) g.set(x, y, z, id, p); };

// outward-facing sides of a footprint cell (based on actual footprint, not bbox)
function outSides(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("north");
  if (!has(x, z + 1)) s.push("south");
  if (!has(x - 1, z)) s.push("west");
  if (!has(x + 1, z)) s.push("east");
  return s;
}

// inward neighbour cell for a facade side
function inward(x, z, side) {
  if (side === "north") return [x, z + 1];
  if (side === "south") return [x, z - 1];
  if (side === "west") return [x + 1, z];
  return [x - 1, z];
}

for (const [x, z, gr0] of cells) {
  // ground level of this cell, clamped so the building keeps its storeys
  const gr = Math.min(Math.max(0, Math.round(gr0)), TOP - 2);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  const sides = outSides(x, z);
  const corner = sides.length >= 2;

  for (let y = gr; y <= TOP; y++) {
    // roof slab / parapet course across the whole footprint
    if (y === TOP) { S(x, y, z, "stone_bricks"); continue; }
    // floor slab at storey line 5 and cornice band at 9, across the footprint
    if (y === 5 || y === 9) { S(x, y, z, "smooth_stone"); continue; }
    // ground-level slab / plinth
    if (y === gr) { S(x, y, z, sides.length ? "stone_bricks" : "smooth_stone"); continue; }
    // interior: air gap, nothing else
    if (sides.length === 0) continue;

    if (corner) { S(x, y, z, "quartz_pillar"); continue; }

    const side = sides[0];
    const u = (side === "north" || side === "south") ? x : z;

    // ground floor fascia
    if (y === 4) { S(x, y, z, "stone_bricks"); continue; }

    // entrance door on the street (north) face, centred
    if (side === "north" && u === 4 && gr <= 2 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      S(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // window grid: mullions every 3 blocks, glass between
    if (u % 3 === 0) {
      S(x, y, z, "white_concrete");
    } else {
      S(x, y, z, "glass");
      const [ix, iz] = inward(x, z, side);
      // warm light behind some glass
      if (y === 7 && u % 6 === 1 && has(ix, iz)) S(ix, y, iz, "glowstone");
      if (y === gr + 2 && u % 6 === 4 && y <= 3 && has(ix, iz)) S(ix, y, iz, "shroomlight");
    }
  }
}

// rooftop plant room on the interior of the roof
for (const [x, z] of cells) {
  if (outSides(x, z).length === 0 && x >= 2 && x <= 5 && z >= 4 && z <= 9) {
    S(x, TOP + 1, z, "light_gray_concrete");
    S(x, TOP + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
