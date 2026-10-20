import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682864";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 16, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, h] of cells) ground.set(`${x},${z}`, h);
const has = (x, z) => ground.has(`${x},${z}`);

// Bounds-checked setter; props are optional
function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Glass pane connection props: panes run along x on N/S faces, along z on E/W faces
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Two-storey commercial block, Xinyi shophouse-era: stone plinth, white concrete piers,
// ground-floor shopfront on the north (z=0) street face, upper storey of framed windows,
// cornice and parapet. Roof sits about 11 blocks above the lowest ground.
for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1);
  const s = !has(x, z + 1);
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const perimeter = n || s || w || e;

  // Foundation under every cell, then the floor slab at the cell's ground level
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, perimeter ? "polished_andesite" : "smooth_stone");

  // Storey slabs over every cell (interior floor/roof slabs, exterior storey lines)
  // Level gr+5: first-floor slab / upper storey line
  put(x, gr + 5, z, perimeter ? "white_concrete" : "smooth_stone");
  // Level gr+10: roof deck; perimeter is a stone cornice course
  put(x, gr + 10, z, perimeter ? "smooth_stone" : "light_gray_concrete");

  if (!perimeter) {
    // Rooftop equipment on the deck
    const acCells = (x >= 3 && x <= 4 && z >= 2 && z <= 3);
    if (acCells && gr + 12 < H) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    const tank = (x >= 11 && x <= 12 && z >= 5 && z <= 6);
    if (tank && gr + 12 < H) {
      put(x, gr + 11, z, "oak_planks");
      put(x, gr + 12, z, "oak_planks");
    }
    continue;
  }

  // Parapet on the roof edge
  put(x, gr + 11, z, "white_concrete");

  // Facade face priority: north (street), south, west, east
  const face = n ? "N" : s ? "S" : w ? "W" : "E";
  // Pier rhythm index along the face
  const along = (face === "W" || face === "E") ? z : x;
  const last = (face === "W" || face === "E") ? 8 : 15;
  const isPier = along % 3 === 0 || along === last;
  const pane = (face === "W" || face === "E") ? paneEW : paneNS;
  // Interior cell directly behind the facade (for warm light behind glass)
  const inX = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
  const inZ = face === "N" ? z + 1 : face === "S" ? z - 1 : z;

  // ---- Ground storey: gr+1 .. gr+4 ----
  if (face === "N") {
    if (x === 7) {
      // Entrance door with transom and lintel
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass_pane", pane);
      put(x, gr + 4, z, "white_concrete");
      continue;
    }
    const shopPier = x === 0 || x === 15 || x === 4 || x === 11;
    if (shopPier) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "polished_andesite");
      put(x, gr + 2, z, "glass_pane", pane);
      put(x, gr + 3, z, "glass_pane", pane);
      put(x, gr + 4, z, "white_concrete");
      if (x % 2 === 0) put(inX, gr + 2, inZ, "glowstone");
    }
  } else {
    if (isPier) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "polished_andesite");
      put(x, gr + 2, z, "glass_pane", pane);
      put(x, gr + 3, z, "glass_pane", pane);
      put(x, gr + 4, z, "white_concrete");
    }
  }

  // ---- Upper storey: gr+6 .. gr+9 ----
  if (isPier) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "white_concrete");          // sill
    put(x, gr + 7, z, "glass_pane", pane);
    put(x, gr + 8, z, "glass_pane", pane);
    put(x, gr + 9, z, "white_concrete");          // lintel
    if (along % 2 === 0) put(inX, gr + 7, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
