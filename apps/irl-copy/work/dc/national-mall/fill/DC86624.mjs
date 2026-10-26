import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86624.cells.json`, "utf8"));

// 1667 K St NW: 1980s speculative Class A office block on K Street.
// Granite-base podium, white precast grid with smooth quartz piers, tinted glass
// curtain wall on 4-block storeys, stone cornice, one centred mechanical penthouse,
// glazed street-level lobby with a recessed dark oak entrance flanked by quartz piers.
const W = 10, H = 31, D = 26;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, r] of cells) cm.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(r) });
const has = (x, z) => cm.has(`${x},${z}`);

const FOUND = "polished_andesite";
const BAND = "light_gray_concrete";
const WALL = "white_concrete";
const PIER = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const CORN = "smooth_stone";
const ROOF = "light_gray_concrete";
const BASE = "polished_granite";
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

let minZ = Infinity;
for (const k of cm.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));

const edgeOf = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const idxOf = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

// Entrance column choice (on the street face, z = minZ)
let doorX = null;
for (const x of [4, 5, 3, 6]) { if (has(x, minZ)) { doorX = x; break; } }
if (doorX === null) {
  for (const [k] of cm) { const [x, z] = k.split(",").map(Number); if (z === minZ) { doorX = x; break; } }
}

// Main massing and facades
for (const [k, c] of cm) {
  const [x, z] = k.split(",").map(Number);
  const edge = edgeOf(x, z);
  const idx = idxOf(x, z);
  const gY = c.g;
  const roofY = Math.min(c.r, H - 5);

  // Foundation / granite podium up to the cell's ground
  for (let y = 0; y <= gY; y++) g.set(x, y, z, y === gY ? BASE : FOUND);
  if (roofY <= gY) continue;

  // Penthouse: a single centred block of stone cells above the roof
  const penth = !edge && x >= 3 && x <= 6 && z >= 8 && z <= 17;
  const penthCore = x >= 4 && x <= 5 && z >= 10 && z <= 15;

  for (let y = gY + 1; y <= roofY; y++) {
    if (y === roofY) {
      g.set(x, y, z, edge ? CORN : ROOF);
      continue;
    }
    if (!edge) {
      if (y % 4 === 0) g.set(x, y, z, BAND);
      continue;
    }
    const m = y % 4;
    const storefront = z === minZ && y <= gY + 3;
    if (storefront) {
      // Glazed lobby: piers at the bays, glass between, base band at the floor line
      if (y === gY + 1 && idx % 3 !== 0) g.set(x, y, z, GLASS, PANE);
      else if (y === gY + 1) g.set(x, y, z, PIER);
      else if (idx % 3 === 0) g.set(x, y, z, PIER);
      else g.set(x, y, z, GLASS, PANE);
      continue;
    }
    if (m === 0) g.set(x, y, z, BAND);
    else if (m === 3) g.set(x, y, z, WALL);
    else if (idx % 3 === 0) g.set(x, y, z, PIER);
    else g.set(x, y, z, GLASS, PANE);
  }

  // Penthouse on top of the roof: stone box with a smaller core
  if (penth && roofY + 1 < H) {
    g.set(x, roofY + 1, z, WALL);
    if (penthCore && roofY + 2 < H) g.set(x, roofY + 2, z, WALL);
  }
}

// Warm light behind some glazing (interior air cells, sparse)
for (const [k, c] of cm) {
  const [x, z] = k.split(",").map(Number);
  if (!edgeOf(x, z)) continue;
  const idx = idxOf(x, z);
  if (idx % 3 === 0 || idx % 4 !== 2) continue;
  if (z === minZ) continue;
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || edgeOf(ix, iz)) continue;
  const roofY = Math.min(c.r, H - 5);
  for (let y = c.g + 1; y < roofY; y++) {
    if (y % 4 === 1 && (x + z + y) % 3 === 0) g.set(ix, y, iz, "shroomlight");
  }
}

// Entrance: dark oak doors, quartz pilasters either side, lintel above
if (doorX !== null) {
  const dc = cm.get(`${doorX},${minZ}`);
  const dg = dc.g;
  g.set(doorX, dg + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, dg + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    const px = doorX + dx;
    if (has(px, minZ)) {
      g.set(px, dg + 1, minZ, PIER);
      g.set(px, dg + 2, minZ, PIER);
    }
  }
  for (const dx of [-1, 0, 1]) {
    const px = doorX + dx;
    if (has(px, minZ)) g.set(px, dg + 3, minZ, PIER);
  }
}

g.save(`${DIR}/DC86624.nbt`);
