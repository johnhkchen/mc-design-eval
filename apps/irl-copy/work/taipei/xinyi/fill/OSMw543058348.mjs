import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058348";
const W = 20, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inside = (x, z) => G.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Front face: south if the footprint has a south edge, otherwise north.
const hasSouth = cells.some(([x, z]) => !inside(x, z + 1));
const frontFace = hasSouth ? "south" : "north";
const frontRow = hasSouth ? maxZ : minZ;

// Pick a window column on the front face nearest its middle for the entrance.
const midX = (minX + maxX) / 2;
let doorX = -1;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (z !== frontRow) continue;
    const corner = (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));
    if (corner) continue;
    const u = x - minX;
    if (u % 3 !== 1) continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; doorX = x; }
  }
}
const doorZ = frontRow;

for (const [x, z, gr] of cells) {
  const N = !inside(x, z - 1), S = !inside(x, z + 1);
  const Wf = !inside(x - 1, z), E = !inside(x + 1, z);
  const perim = N || S || Wf || E;

  // Foundation under every footprint cell, up to the ground line.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, no interiors.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    // Roof equipment on the deck, sparse.
    if ((x + 2 * z) % 7 === 0) put(x, gr + 11, z, "iron_block");
    continue;
  }

  const corner = (N || S) && (Wf || E);
  const face = N ? "north" : S ? "south" : Wf ? "west" : "east";
  const alongX = N || S;
  const u = alongX ? x - minX : z - minZ;
  const win = !corner && (u % 3 === 1);
  const isDoor = !corner && x === doorX && z === doorZ && face === frontFace;

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Storey 1: gr+1..gr+4 walls, band at gr+5.
  for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "smooth_quartz");
  put(x, gr + 5, z, "polished_andesite");

  // Storey 2: gr+6..gr+9 walls, band at gr+10.
  for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "smooth_quartz");
  put(x, gr + 10, z, "polished_andesite");

  // Parapet cap at gr+11.
  put(x, gr + 11, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });

  if (!win) continue;

  const paneP = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (isDoor) {
    // Entrance: door at gr+1..gr+2, transom glass above, sill below is part of wall.
    put(x, gr + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane", paneP);
    put(x, gr + 4, z, "stone_bricks");
  } else {
    // Shopfront: sill, glass, lintel.
    put(x, gr + 1, z, "smooth_stone");
    put(x, gr + 2, z, "glass_pane", paneP);
    put(x, gr + 3, z, "glass_pane", paneP);
    put(x, gr + 4, z, "stone_bricks");
  }

  // Upper storey windows with frames; some lit from behind.
  const bay = Math.floor(u / 3);
  put(x, gr + 6, z, "stone_bricks");
  if ((bay + 1) % 3 === 0) {
    put(x, gr + 7, z, "glowstone");
  } else {
    put(x, gr + 7, z, "glass_pane", paneP);
  }
  put(x, gr + 8, z, "glass_pane", paneP);
  put(x, gr + 9, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
