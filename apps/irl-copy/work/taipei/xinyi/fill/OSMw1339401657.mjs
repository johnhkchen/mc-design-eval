import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401657";

const W = 7, H = 24, D = 73;
const ROOF = 12;      // roof top, absolute, measured from lowest ground (y 0)
const DECK = ROOF - 1; // top solid course of roof deck / parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const perimeter = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Outward wall of a perimeter cell: "west" | "east" | "north" | "south"
function outward(x, z) {
  if (!inFp(x - 1, z)) return "west";
  if (!inFp(x + 1, z)) return "east";
  if (!inFp(x, z - 1)) return "north";
  return "south";
}

// ---- block helpers -----------------------------------------------------
const PANE = (onXWall) => ({
  north: onXWall ? "true" : "false",
  south: onXWall ? "true" : "false",
  east: onXWall ? "false" : "true",
  west: onXWall ? "false" : "true",
  waterlogged: "false",
});

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// ---- 1. foundation, floor slabs and roof deck --------------------------
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // floor slabs at ground and the second storey line
  g.set(x, gr, z, "light_gray_concrete");
  if (gr + 5 < DECK) g.set(x, gr + 5, z, "light_gray_concrete");

  // roof deck over interior cells (perimeter gets the parapet instead)
  if (!perimeter(x, z)) g.set(x, DECK, z, "light_gray_concrete");
}

// ---- 2. facades on perimeter cells ------------------------------------
for (const [x, z, gr] of cells) {
  if (gr >= ROOF || !perimeter(x, z)) continue;
  const dir = outward(x, z);
  const onXWall = dir === "west" || dir === "east"; // wall runs along z
  const t = onXWall ? z : x;                         // position along the wall

  for (let y = gr; y < ROOF; y++) {
    const d = y - gr;
    let placed = false;

    // parapet and cornice first (absolute heights)
    if (y >= DECK) {
      g.set(x, y, z, "white_concrete");
      placed = true;
    } else if (y === DECK - 1) {
      g.set(x, y, z, "smooth_stone_slab", SLAB_BOTTOM);
      placed = true;
    }
    if (placed) continue;

    // door on the west long facade, at the midpoint of the street face
    if (dir === "west" && z === 35 && (d === 1 || d === 2)) {
      const half = d === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "west", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (d === 0) {
      // base course / plinth
      g.set(x, y, z, "stone_bricks");
    } else if (d <= 3) {
      // shopfront: glass with frames
      if (t % 3 === 0) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "glass_pane", PANE(onXWall));
    } else if (d === 4) {
      // shopfront lintel
      g.set(x, y, z, "smooth_stone");
    } else if (d === 5) {
      // storey line spandrel
      g.set(x, y, z, "light_gray_concrete");
    } else if (d <= 8) {
      // upper storey window grid
      if (t % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane", PANE(onXWall));
    } else {
      // sill spandrel below the cornice
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// ---- 3. warm lights behind glass (interior side of the facade) --------
for (const [x, z, gr] of cells) {
  if (gr >= ROOF || !perimeter(x, z)) continue;
  const dir = outward(x, z);
  const onXWall = dir === "west" || dir === "east";
  const t = onXWall ? z : x;
  // step one cell inward
  const dx = dir === "west" ? 1 : dir === "east" ? -1 : 0;
  const dz = dir === "north" ? 1 : dir === "south" ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || perimeter(ix, iz)) continue;

  // glowstone behind shopfront glass
  if (t % 9 === 4 && gr + 2 < DECK) g.set(ix, gr + 2, iz, "glowstone");
  // shroomlight behind upper windows
  if (t % 6 === 4 && gr + 7 < DECK) g.set(ix, gr + 7, iz, "shroomlight");
}

// ---- 4. roof equipment: a few heat-pump boxes on the deck -------------
for (const [x, z, gr] of cells) {
  if (gr >= DECK || perimeter(x, z)) continue;
  if (x === 3 && z % 14 === 7) {
    g.set(x, DECK + 1, z, "gray_concrete");
    g.set(x, DECK + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
