import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833553";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Block palette: 1970s Taipei low-rise commercial, pale tiled concrete, shopfronts below.
const FOUND = "stone_bricks";
const BODY = "white_concrete";
const BAND = "light_gray_concrete";
const ROOF = "smooth_stone";
const PARAPET = "stone_brick_wall";
const GLASS = "light_blue_stained_glass_pane";
const DOOR = "dark_oak_door";
const LIGHT = "glowstone";
const PLANT = "light_gray_concrete";

// Storey levels (absolute y, relative to lowest ground)
const SHOP_TOP = 3;   // shopfront glazing top
const LINTEL_G = 4;   // ground-floor cornice band
const SLAB1 = 5;      // storey line / floor slab
const SILL = 6;       // upper sill
const WIN_LO = 7;
const WIN_HI = 8;
const LINTEL = 9;     // upper lintel band
const ROOF_Y = 10;    // roof deck
const PARAPET_Y = 11; // parapet course (roof about 11 above lowest ground)

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const clampY = (v) => Math.max(0, Math.min(H - 1, Math.round(v)));

// Open faces of a perimeter cell (neighbour not in footprint)
function sides(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("north");
  if (!has(x, z + 1)) s.push("south");
  if (!has(x + 1, z)) s.push("east");
  if (!has(x - 1, z)) s.push("west");
  return s;
}

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Inward offset (from a facade cell into the building)
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// Choose the entrance: middle of the south facade (or first available perimeter face)
const southCells = cells
  .filter(([x, z]) => { const s = sides(x, z); return s.length === 1 && s[0] === "south"; })
  .sort((a, b) => a[0] - b[0]);
let entrance = null;
if (southCells.length) {
  entrance = southCells[Math.floor(southCells.length / 2)];
} else {
  const any = cells.find(([x, z]) => sides(x, z).length === 1);
  if (any) entrance = any;
}
const entKey = entrance ? `${entrance[0]},${entrance[1]}` : null;

// ---- Foundations, body, storey lines, roof ----
for (const [x, z, gr0] of cells) {
  const gr = clampY(gr0);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const s = sides(x, z);
  const perimeter = s.length > 0;
  const corner = s.length > 1;
  const face = s[0];

  // Along-facade index for window rhythm
  let idx = 0;
  if (perimeter && !corner) idx = (face === "north" || face === "south") ? x : z;
  const win = perimeter && !corner && (idx % 4 === 1 || idx % 4 === 2);
  const isEntrance = entKey === `${x},${z}`;

  if (!perimeter) {
    // Interior: floor slab at storey line and roof deck only (air gap otherwise)
    if (gr <= SLAB1) g.set(x, SLAB1, z, BAND);
    g.set(x, ROOF_Y, z, ROOF);
    // Plant box on the roof, interior only
    if (x >= 6 && x <= 13 && z >= 9 && z <= 14) {
      g.set(x, PARAPET_Y, z, PLANT);
    }
    // Warm light behind an upper window on the inward side (interior cell)
    continue;
  }

  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y <= SHOP_TOP) {
      if (win) g.set(x, y, z, GLASS, paneProps(face));
      else g.set(x, y, z, BODY);
    } else if (y === LINTEL_G) {
      g.set(x, y, z, BAND);
    } else if (y === SLAB1) {
      g.set(x, y, z, BAND);
    } else if (y === SILL) {
      g.set(x, y, z, BODY);
    } else if (y === WIN_LO || y === WIN_HI) {
      if (win) g.set(x, y, z, GLASS, paneProps(face));
      else g.set(x, y, z, BODY);
    } else if (y === LINTEL) {
      g.set(x, y, z, BAND);
    } else if (y === ROOF_Y) {
      g.set(x, y, z, ROOF);
    } else if (y === PARAPET_Y) {
      g.set(x, y, z, PARAPET);
    }
  }
}

// ---- Warm light behind glass (upper storey, every other window column) ----
for (const [x, z, gr0] of cells) {
  const s = sides(x, z);
  if (s.length !== 1) continue;
  const face = s[0];
  const idx = (face === "north" || face === "south") ? x : z;
  if (idx % 8 !== 1) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || sides(ix, iz).length) continue;
  if (gr0 > WIN_LO) continue;
  g.set(ix, WIN_LO, iz, LIGHT);
}

// ---- Ground-floor shop lights (glowstone behind shopfront glass) ----
for (const [x, z, gr0] of cells) {
  const gr = clampY(gr0);
  const s = sides(x, z);
  if (s.length !== 1) continue;
  const face = s[0];
  const idx = (face === "north" || face === "south") ? x : z;
  if (idx % 8 !== 2) continue;
  if (gr > SHOP_TOP - 1) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || sides(ix, iz).length) continue;
  g.set(ix, gr, iz, LIGHT);
}

// ---- Entrance: dark oak door with lintel lantern feel via band above ----
if (entrance) {
  const [x, z, gr0] = entrance;
  const gr = clampY(gr0);
  if (gr + 1 <= SHOP_TOP) {
    const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, gr, z, DOOR, { ...base, half: "lower" });
    g.set(x, gr + 1, z, DOOR, { ...base, half: "upper" });
    // Clear glazing above the door so the doorway reads
    if (gr + 2 <= SHOP_TOP) g.set(x, gr + 2, z, BAND);
  }
}

// ---- Roof plant box height (small, keeps roofline near 11 blocks) ----
for (const [x, z] of cells) {
  if (x >= 6 && x <= 13 && z >= 9 && z <= 14 && sides(x, z).length === 0) {
    // already set to PLANT at PARAPET_Y in the interior pass
  }
}

g.save(`${DIR}/${ID}.nbt`);
