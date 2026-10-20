import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 22 x 20. Roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed Taipei commercial/civic block of the 1980s-90s:
// cream quartz wall, grey-glass windows in polished andesite piers, a stone base,
// a shopfront ground floor with a central entrance, and a parapet with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458234";
const W = 22, H = 23, D = 20;

const DECK = 10;      // roof deck (top of second storey)
const PARAPET = 11;   // parapet course on the perimeter
const STOREY = 5;     // storey line between the two floors

const WALL = "smooth_quartz";
const PIER = "polished_andesite";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const GLASS = "gray_stained_glass_pane";
const LINTEL = "smooth_stone";
const ROOFMAT = "light_gray_concrete";
const CAP = "smooth_quartz_slab";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), Math.round(g));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Exterior faces of a footprint cell: N (z-1), S (z+1), W (x-1), E (x+1)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Index extents along each face so windows can be spaced and ends made into piers
const span = {};
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const f of faces(x, z)) {
    const t = (f === "N" || f === "S") ? x : z;
    if (!span[f]) span[f] = { min: t, max: t };
    span[f].min = Math.min(span[f].min, t);
    span[f].max = Math.max(span[f].max, t);
  }
}

const g = new Voxels([W, H, D]);

// Pass 1: foundations, ground course, walls, storey lines, roof deck
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gAt(x, z);
  const fs = faces(x, z);
  const perim = fs.length > 0;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (gr >= PARAPET) continue; // nothing buildable above this cell

  // Base course on the ground
  g.set(x, gr, z, BASE);

  // Perimeter walls from above the base up to the roof deck
  if (perim) {
    for (let y = gr + 1; y <= DECK - 1; y++) g.set(x, y, z, WALL);
  }

  // Storey floor line at y=5 across the footprint
  if (gr < STOREY) g.set(x, STOREY, z, WALL);

  // Roof deck across the footprint
  if (gr <= DECK) g.set(x, DECK, z, ROOFMAT);

  // Parapet cap on the perimeter
  if (perim) g.set(x, PARAPET, z, `${CAP}`, { type: "bottom", waterlogged: "false" });
}

// Pass 2: facade articulation on perimeter cells
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const gr = gAt(x, z);
  if (gr >= DECK) continue;

  // Corner cells become piers
  const single = fs.length === 1 ? fs[0] : null;
  let pier = true, t = 0, face = null, mid = false, entrance = false;

  if (single) {
    face = single;
    const idx = (face === "N" || face === "S") ? x : z;
    const sp = span[face];
    t = idx - sp.min;
    const len = sp.max - sp.min;
    pier = (t % 3 === 0) || t === len;
    mid = len >= 4 && t === Math.floor(len / 2);
    entrance = face === "S" && mid; // main entrance on the street (south) face
  }

  // Ground floor: shopfronts with glass, piers, entrance
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (y > STOREY - 1) break;
    if (!single || pier) {
      g.set(x, y, z, PIER);
    } else if (entrance) {
      if (y === gr + 1) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else g.set(x, y, z, "air");
    } else {
      g.set(x, y, z, GLASS);
    }
  }
  // Lintel band over the ground floor (canopy over the entrance)
  if (gr < STOREY) {
    if (entrance) g.set(x, STOREY - 1, z, "dark_prismarine");
    else g.set(x, STOREY - 1, z, LINTEL);
  }

  // Upper storey: window grid between piers
  for (let y = STOREY + 1; y <= DECK - 2; y++) {
    if (!single || pier) {
      g.set(x, y, z, PIER);
    } else {
      g.set(x, y, z, GLASS);
    }
  }
  // Upper lintel band under the roof deck
  if (single && !pier) g.set(x, DECK - 1, z, LINTEL);
  else g.set(x, DECK - 1, z, PIER);

  // Warm light behind some windows: glowstone in the first interior cell
  if (single && !pier && (t % 2 === 1) && !entrance) {
    let ix = x, iz = z;
    if (face === "S") iz = z - 1;
    if (face === "N") iz = z + 1;
    if (face === "E") ix = x - 1;
    if (face === "W") ix = x + 1;
    if (has(ix, iz) && faces(ix, iz).length === 0) {
      g.set(ix, STOREY + 2, iz, "glowstone");
    }
  }
  if (single && !pier && (t % 3 === 2) && !entrance) {
    let ix = x, iz = z;
    if (face === "S") iz = z - 1;
    if (face === "N") iz = z + 1;
    if (face === "E") ix = x - 1;
    if (face === "W") ix = x + 1;
    if (has(ix, iz) && faces(ix, iz).length === 0) {
      g.set(ix, 2, iz, "shroomlight");
    }
  }
}

// Pass 3: rooftop plant and a lightning rod, kept inside the footprint
const plantCells = cells
  .map(c => [c[0], c[1], c[2]])
  .filter(([x, z]) => x >= 8 && x <= 13 && z >= 6 && z <= 12 && faces(x, z).length === 0);
for (const [x, z, gr] of plantCells) {
  if (gr >= PARAPET) continue;
  g.set(x, PARAPET, z, ROOFMAT);
  g.set(x, PARAPET + 1, z, "gray_concrete");
}
const rod = cells.map(c => [c[0], c[1]]).find(([x, z]) => x === 4 && z === 4)
  ?? cells.map(c => [c[0], c[1]]).find(([x, z]) => faces(x, z).length === 0);
if (rod) {
  g.set(rod[0], PARAPET, rod[1], "lightning_rod");
  g.set(rod[0], PARAPET + 1, rod[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
