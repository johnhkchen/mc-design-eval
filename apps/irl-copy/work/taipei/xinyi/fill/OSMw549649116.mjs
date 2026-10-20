import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549649116";
const W = 19, H = 23, D = 18;
const ROOF = 11;          // roof deck top, blocks above lowest ground
const PARAPET = 12;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, gr] of raw) fp.set(`${x},${z}`, Math.round(gr));

const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
// Outward normal of an edge cell (first missing neighbour), or null if interior
const outward = (x, z) => {
  for (const [dx, dz] of DIRS) if (!inFp(x + dx, z + dz)) return [dx, dz];
  return null;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const putIf = (x, y, z, id, props) => { if (inFp(x, z)) put(x, y, z, id, props); };

// Pane connection states: walls running along X connect east/west, along Z connect north/south
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";
const RIB = "white_concrete";
const isWindowBand = (y) => (y >= 2 && y <= 4) || (y >= 6 && y <= 9);

// ---- Columns ----
for (const [key, g0] of fp) {
  const [x, z] = key.split(",").map(Number);
  const n = outward(x, z);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab
  put(x, g0, z, "smooth_stone");

  if (!n) {
    // Interior cell: storey slabs and roof deck only
    for (const L of [5, 10]) if (L > g0) put(x, L, z, "smooth_stone");
    if (ROOF > g0) put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Edge cell: facade
  const alongX = n[1] !== 0;                 // wall runs along x when normal is along z
  const pos = alongX ? x : z;                // position along the wall
  const front = n[0] === 0 && n[1] === -1;   // north (min z) facade carries the entrance
  const pane = alongX ? paneX : paneZ;
  const ix = x - n[0], iz = z - n[1];        // inward neighbour
  const inwardOk = inFp(ix, iz) && !outward(ix, iz);

  for (let y = g0 + 1; y <= 10; y++) {
    // Storey lines: belt courses at 5 and 10
    if (y === 5 || y === 10) { put(x, y, z, "smooth_quartz"); continue; }

    if (front && pos >= 7 && pos <= 11) {
      if (y === g0 + 1) {
        if (pos === 9) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "stone_bricks");
        continue;
      }
      if (y === g0 + 2 && pos === 9) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 4) { put(x, y, z, "red_terracotta"); continue; }   // awning fascia
      if (y > g0 + 1 && y <= 3 && !(pos === 9 && y <= g0 + 2)) {
        put(x, y, z, GLASS, pane);                                 // shopfront glazing
        continue;
      }
    }

    if (y === g0 + 1) { put(x, y, z, "stone_bricks"); continue; }  // base course / plinth

    if (isWindowBand(y) && y > g0 + 1) {
      const rib = pos % 3 === 0;
      if (rib) { put(x, y, z, RIB); continue; }
      put(x, y, z, GLASS, pane);
      // warm light behind some panes
      if (inwardOk) {
        if (y === 7 && pos % 6 === 2) put(ix, y, iz, "glowstone");
        if (y === 3 && pos % 6 === 5) put(ix, y, iz, "shroomlight");
      }
      continue;
    }

    put(x, y, z, "white_concrete");  // spandrel
  }

  // Roof edge: cornice and parapet
  for (let y = Math.max(ROOF, g0 + 1); y <= PARAPET; y++) {
    if (y > g0) put(x, y, z, "smooth_quartz");
  }
}

// ---- Roof equipment (only on footprint cells) ----
// Stair/lift penthouse
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 7; z++) {
  for (let y = PARAPET + 1; y <= 14; y++) putIf(x, y, z, "white_concrete");
  putIf(x, 15, z, "smooth_quartz");
}
// Air-conditioning plant
for (let x = 12; x <= 14; x++) for (let z = 6; z <= 8; z++) {
  for (let y = PARAPET + 1; y <= 13; y++) putIf(x, y, z, "light_gray_concrete");
}
// Small mast
putIf(9, PARAPET + 1, 8, "lightning_rod");
putIf(9, PARAPET + 2, 8, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
