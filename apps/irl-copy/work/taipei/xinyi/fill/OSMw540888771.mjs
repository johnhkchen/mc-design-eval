import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888771.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888771.nbt";

// Footprint: [x, z, ground] per cell. Accept either a bare array or {cells: [...]}.
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 11, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of list) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr_at = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Outward faces of a perimeter cell.
function outward(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Wall material for a perimeter face at height offset o (0 = ground course).
function wallCell(x, y, z, face, o, gr) {
  const isCorner = outward(x, z).length > 1;
  const idx = face === "north" || face === "south" ? x : z;
  const pier = isCorner || idx % 3 === 0;
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
  const isDoor = face === "north" && x === Math.floor(W / 2) && o >= 1 && o <= 2;

  if (isDoor) {
    const half = o === 1 ? "lower" : "upper";
    put(x, y, z, "dark_oak_door", {
      facing: "south", half, hinge: "left", open: "false", powered: "false",
    });
    return;
  }

  // Storey 1: shopfront glass band rows gr+1..gr+3 (sills and lintel handled by caller).
  // Storey 2: windows rows gr+7..gr+8.
  if (o >= 1 && o <= 3 || o >= 7 && o <= 8) {
    if (pier) put(x, y, z, "white_concrete");
    else {
      put(x, y, z, "glass_pane", face === "north" || face === "south" ? PANE_NS : PANE_EW);
    }
    // Warm light just inside some upper-storey windows.
    if (!pier && o === 7 && idx % 6 === 2) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz)) put(ix, y, iz, "shroomlight");
    }
    if (!pier && o === 2 && idx % 6 === 4) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
    return;
  }
  // Spandrels and sills are handled by caller for o = 0, 4, 5, 6, 9.
  put(x, y, z, "white_concrete");
}

// ---- Build each footprint column ----
for (const [x, z, gr] of list) {
  const perim = outward(x, z).length > 0;
  const faces = outward(x, z);

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground course and floor.
  if (perim) put(x, gr, z, "polished_andesite");
  else put(x, gr, z, "smooth_stone");

  // Storey 1: rows gr+1..gr+3 walls/shopfront, gr+4 lintel band.
  for (let o = 1; o <= 3; o++) {
    if (perim) {
      // Choose the first outward face for the wall logic (corners are piers anyway).
      wallCell(x, gr + o, z, faces[0], o, gr);
    }
  }
  if (perim) put(x, gr + 4, z, "smooth_stone");
  else put(x, gr + 4, z, "air");

  // Storey line / floor slab between storeys at gr+5.
  put(x, gr + 5, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Storey 2: sill gr+6, windows gr+7..gr+8, spandrel gr+9.
  if (perim) {
    put(x, gr + 6, z, "smooth_stone");
    for (let o = 7; o <= 8; o++) wallCell(x, gr + o, z, faces[0], o, gr);
    put(x, gr + 9, z, "white_concrete");
  }

  // Roof deck and cornice.
  put(x, gr + 10, z, perim ? "smooth_stone" : "gray_concrete");

  // Parapet.
  if (perim) put(x, gr + 11, z, "white_concrete");
}

// Re-apply perimeter wall logic per face so that every outward face is articulated.
for (const [x, z, gr] of list) {
  const faces = outward(x, z);
  if (faces.length === 0) continue;
  for (const face of faces) {
    for (let o = 1; o <= 9; o++) {
      if (o === 4 || o === 5 || o === 6 || o === 9) continue;
      // Storey 1 (o 1..3) and storey 2 (7..8) windows.
      if (o <= 3 || (o >= 7 && o <= 8)) {
        wallCell(x, gr + o, z, face, o, gr);
      }
    }
  }
}

// Roof equipment: a cooling unit and a small penthouse on the deck.
for (const [x, z, gr] of list) {
  const inside = outward(x, z).length === 0;
  if (!inside) continue;
  if (x >= 2 && x <= 4 && z >= 4 && z <= 6) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

// Entrance canopy-ish: lantern beside the door on the inside ceiling line.
if (has(Math.floor(W / 2), 1)) {
  const gr = gr_at(Math.floor(W / 2), 1);
  put(Math.floor(W / 2), gr + 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(OUT);
