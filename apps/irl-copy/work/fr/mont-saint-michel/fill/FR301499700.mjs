import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Hôtel - Restaurant La Vieille Auberge (FR301499700), Grande Rue, Mont-Saint-Michel.
// Commercial, built 1700. Record says 1 storey, but the lidar roof is ~20 blocks above
// the lowest ground, so the massing reads as about three storeys of ~5 blocks under a
// mansard-like slate roof: granite-grey walls, polished band courses, a restaurant
// shopfront at street level with a red awning, and warm glowstone behind some windows.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499700.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499700.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 32, D = 19;
const g = new Voxels([W, H, D]);

function S(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const at = new Map();
for (const [x, z, gr, ro] of cells) at.set(x + "," + z, { gr, ro });
const has = (x, z) => at.has(x + "," + z);
const ring = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const xmin = Math.min(...cells.map(c => c[0])), xmax = Math.max(...cells.map(c => c[0]));
const zmin = Math.min(...cells.map(c => c[1])), zmax = Math.max(...cells.map(c => c[1]));
const grounds = cells.map(c => c[2]);
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const G = Math.min(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];

// Wall-top / roof-base level: lidar roof minus the 4-block mansard pitch, never below the foundations.
const wt = Math.max(Math.round(medRoof) - 4, Math.max(...grounds) + 8);

// Storey lines every 5 blocks from the street level.
const FL = [0, 1, 2, 3].map(k => G + 5 * k).filter(f => f < wt - 1);
const floorOf = y => { let f = G; for (const q of FL) if (q <= y) f = q; return f; };

const doorX = xmin + 7;

// helper: is a cell inside the footprint and not on the ring?
function isInteriorCell(x, z) {
  return has(x, z) && !ring(x, z);
}

for (const [x, z, gr] of cells) {
  const isR = ring(x, z);
  const nE = !has(x, z - 1), sE = !has(x, z + 1), wE = !has(x - 1, z), eE = !has(x + 1, z);
  const zFace = nE || sE;
  const corner = (nE || sE) && (wE || eE);
  // inward offset from the exterior face
  const dz = zFace ? (nE ? 1 : -1) : 0;
  const dx = zFace ? 0 : (wE ? 1 : -1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "cobblestone");

  // Ring walls with facade articulation.
  if (isR) {
    for (let y = gr; y < wt; y++) {
      if (y === wt - 1) { S(x, y, z, "polished_andesite"); continue; } // cornice course
      const f = floorOf(y);
      const rel = y - f;
      const k = FL.indexOf(f);
      if (rel === 0) { S(x, y, z, "polished_andesite"); continue; } // storey line
      if (corner) { S(x, y, z, "polished_andesite"); continue; }     // quoins at the angles
      const idx = zFace ? x - xmin : z - zmin;
      const win = idx % 3 !== 0;
      if (rel === 4) { S(x, y, z, "polished_andesite"); continue; } // band
      if (k === 0) {
        if (rel >= 1 && rel <= 3) {
          S(x, y, z, win ? "glass" : "chiseled_stone_bricks");
        } else S(x, y, z, "stone_bricks");
      } else {
        if (rel === 1) {
          if (win) S(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
          else S(x, y, z, "stone_bricks");
        } else if (rel === 2 || rel === 3) {
          S(x, y, z, win ? "glass" : "polished_andesite");
        } else S(x, y, z, "stone_bricks");
      }
      // warm light on the floor just inside some windows (ground and first storey)
      if (win && rel === 1 && k <= 1 && !isInteriorCell(x + dx, z + dz) === false) {
        S(x + dx, y, z + dz, "glowstone");
      }
    }
  }

  // Interior: floor slab per storey and a ceiling under the roof.
  if (!isR) {
    for (const f of FL) if (f >= gr) S(x, f, z, "smooth_stone");
    if (wt - 1 >= gr) S(x, wt - 1, z, "smooth_stone");
  }

  // Roof: mansard pitch of 4 blocks on the z-edges, flat deck in the middle.
  const d = Math.min(z - zmin, zmax - z);
  if (d >= 4) {
    for (let y = wt; y <= wt + 2; y++) S(x, y, z, "stone_bricks");
    S(x, wt + 3, z, "deepslate_tiles");
  } else {
    const b = wt + d;
    for (let y = wt; y < b; y++) S(x, y, z, "stone_bricks");
    const zlow = (z - zmin) <= (zmax - z);
    S(x, b, z, "deepslate_tile_stairs", {
      facing: zlow ? "north" : "south",
      half: "bottom",
      shape: "straight",
      waterlogged: "false",
    });
  }
}

// Restaurant entrance on the north (street) face, centred, with a chiselled surround.
if (has(doorX, zmin) && G + 1 >= at.get(doorX + "," + zmin).gr) {
  for (const sx of [doorX - 1, doorX + 1]) {
    S(sx, G + 1, zmin, "chiseled_stone_bricks");
    S(sx, G + 2, zmin, "chiseled_stone_bricks");
    S(sx, G + 3, zmin, "chiseled_stone_bricks");
  }
  S(doorX, G + 1, zmin, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(doorX, G + 2, zmin, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(doorX, G + 3, zmin, "glass");
}

// Red awning: full blocks across the door bay so it reads from the street.
if (G + 4 < wt - 1) {
  for (let x = doorX - 2; x <= doorX + 2; x++) {
    if (has(x, zmin) && G + 4 >= at.get(x + "," + zmin).gr) {
      S(x, G + 4, zmin, "red_terracotta");
    }
  }
}

// Two chimneys on the flat deck.
const zmid = Math.floor((zmin + zmax) / 2);
for (const cx of [xmin + 4, xmin + 11]) {
  if (has(cx, zmid)) {
    S(cx, wt + 4, zmid, "stone_bricks");
    S(cx, wt + 5, zmid, "stone_bricks");
    S(cx, wt + 6, zmid, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(OUT);
