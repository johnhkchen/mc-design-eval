import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1076147139.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1076147139.nbt";

const W = 24, H = 38, D = 13;
const ROOF_DECK = 25;   // top of 5th storey slab
const PARAPET = 26;     // roof about 26 blocks above lowest ground

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 8, Math.round(gr))));
}
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exposed faces of a cell: which outward side has no neighbour in the footprint.
function exposedFaces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade-facing north entrance: the middle exposed north-face cell.
const northXs = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!inside(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const ex = northXs.length ? northXs[Math.floor(northXs.length / 2)] : Math.floor(W / 2);

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // along z

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Storeys, base, storey lines, facade, parapet and roof deck.
const glowSpots = [];
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const boundary = faces.length >= 1;
  const corner = faces.length >= 2;
  const primary = faces[0];
  const along = (primary === "E" || primary === "W") ? z : x;

  for (let y = gr; y <= PARAPET + 1; y++) {
    if (y === PARAPET + 1) {
      if (boundary) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === PARAPET) {
      if (boundary) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === ROOF_DECK) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y % 5 === 0) {
      // Storey line / floor slab across the whole footprint.
      if (y === 0 && boundary) put(x, y, z, "stone_bricks");
      else put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!boundary) continue; // interiors: air gap only

    const r = y % 5;
    if (r === 4) {
      // Spandrel band between storey line and window zone.
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // Window zone rows r = 1..3.
    if (corner || along % 3 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }
    const pane = (primary === "E" || primary === "W") ? PANE_EW : PANE_NS;
    put(x, y, z, "gray_stained_glass_pane", pane);

    // Warm light behind some windows (inward cell, air gap filled).
    if (r === 2) {
      const storey = Math.floor(y / 5);
      if ((along + storey) % 4 === 0) {
        let ix = x, iz = z;
        if (primary === "N") iz = z + 1;
        else if (primary === "S") iz = z - 1;
        else if (primary === "W") ix = x + 1;
        else if (primary === "E") ix = x - 1;
        if (inside(ix, iz)) glowSpots.push([ix, y, iz]);
      }
    }
  }
}

// Warm lights behind glass.
for (const [x, y, z] of glowSpots) put(x, y, z, "glowstone");

// 3. Entrance: double-height door bay on the north face with a dark canopy.
put(ex, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx++) {
  const cx = ex + dx;
  if (inside(cx, 0)) put(cx, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  if (inside(cx, 1)) put(cx, 3, 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
if (inside(ex, 1)) put(ex, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Roof plant: a mechanical block and a mast on the deck.
for (let x = 3; x <= 6; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!inside(x, z)) continue;
    for (let y = PARAPET; y <= PARAPET + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, PARAPET + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (inside(18, 6)) {
  for (let y = PARAPET; y <= PARAPET + 5; y++) put(18, y, 6, "iron_bars");
}

g.save(OUT);
