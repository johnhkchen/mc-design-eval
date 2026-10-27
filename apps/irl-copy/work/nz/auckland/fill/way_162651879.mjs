// A 1960s office block on a basalt plinth, Auckland (way 162651879). The lidar reads a 5-storey (20-block) mass across
// most of the footprint, stepping up to a 9-storey (36-block) tower at the south-east end, with a 16-block wing on the
// north-west side. Tops are median-filtered over the 3 x 3 and quantised to 4-block floor lines, so each tier is flat.
// Storeys are 4 blocks: a floor band, two window rows (bronze-grey glass between brick piers), a spandrel. Every column
// is solid from its ground up to its top, so nothing floats; the core is solid slabs with an air pocket behind each
// window row, and glowstone sits in some of those pockets. The entrance is on the lowest street-facing cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162651879.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162651879.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const BASE = "polished_basalt", BAND = "smooth_stone", SPANDREL = "light_gray_concrete", PIER = "bricks";
const GLASS = "light_blue_stained_glass_pane", CORE = "light_gray_concrete", DECK = "light_gray_concrete";
const PARAPET = "bricks", COPING = "smooth_stone", LAMP = "glowstone", DOOR = "dark_oak_door";
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const g = new Voxels([57, 49, 29]);
const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { x, z, g: gr, r }]));
const cell = (x, z) => byXZ.get(key(x, z));
const ALL = [...byXZ.values()];

// the top surface of each cell: the lidar roof, a median of the 3 x 3 applied twice (speckle goes, the tower stays one
// mass), to a 4-block floor line, at least a storey above its ground
const median3 = (field) => new Map(ALL.map(c => {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = field.get(key(c.x + dx, c.z + dz)); if (v !== undefined) vals.push(v); }
  vals.sort((a, b) => a - b);
  return [key(c.x, c.z), vals[Math.floor(vals.length / 2)]];
}));
const lidar = new Map(ALL.map(c => [key(c.x, c.z), c.r]));
const smooth = median3(median3(lidar));
const top = new Map();
for (const c of ALL) top.set(key(c.x, c.z), Math.max(4 * Math.round(smooth.get(key(c.x, c.z)) / 4), 4 * Math.ceil((c.g + 1) / 4), 4));
const T = (x, z) => (cell(x, z) ? top.get(key(x, z)) : -1);   // -1 outside the footprint: open to the sky and the street
const topOf = (c) => top.get(key(c.x, c.z));
const edge = (c) => DIRS.some(([dx, dz]) => !cell(c.x + dx, c.z + dz));
// a block at height y is facade when a neighbour is outside the footprint or its top is at or below y
const facing = (c, y) => DIRS.filter(([dx, dz]) => T(c.x + dx, c.z + dz) <= y);
const facade = (c, y) => facing(c, y).length > 0;
// an air pocket behind a window row: a core block whose neighbour in plane is facade at the same height
const pocket = (c, y) => DIRS.some(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return n && y > n.g && y < topOf(n) && facade(n, y); });

// the entrance: the lowest street-facing cell, the north side first
const entryDirs = (c) => DIRS.filter(([dx, dz]) => !cell(c.x + dx, c.z + dz));
const entryCandidates = ALL.filter(c => c.g === 0 && entryDirs(c).length > 0);
const entry = entryCandidates.find(c => entryDirs(c).some(([dx, dz]) => dz === -1)) ?? entryCandidates[0];
const [ex, ez] = entryDirs(entry)[0];

function facadeBlock(c, y) {
  const r = y % 4;
  if (r === 0) return BAND;
  if (r === 3) return y < 4 ? BASE : SPANDREL;                  // the ground-storey fascia is basalt
  const [fx] = facing(c, y)[0];
  const along = fx !== 0 ? c.z : c.x;                            // piers every 3rd block along the face
  return along % 3 === 0 ? PIER : GLASS;
}

const glazed = [];
for (const c of ALL) {
  const t = topOf(c), roofEdge = edge(c);
  for (let y = 0; y <= c.g; y++) g.set(c.x, y, c.z, BASE);      // the plinth and the foundation
  for (let y = c.g + 1; y < t; y++) {
    if (facade(c, y)) {
      const b = facadeBlock(c, y);
      g.set(c.x, y, c.z, b);
      if (b === GLASS) glazed.push([c.x, y, c.z]);
    } else if (y % 4 === 0 || y % 4 === 3 || !pocket(c, y)) {
      g.set(c.x, y, c.z, y === t - 1 ? DECK : CORE);            // floor and ceiling slabs, solid core
    }
  }
  if (roofEdge) { g.set(c.x, t, c.z, PARAPET); g.set(c.x, t + 1, c.z, COPING); }
}

// warm light: glowstone in the pocket behind some upper window rows
for (const [x, y, z] of glazed) {
  if (y % 4 !== 2 || (x * 31 + z * 17 + y) % 5 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const n = cell(x - dx, z - dz);                             // the inward neighbour
    if (n && y > n.g && y < topOf(n) && !facade(n, y)) { g.set(n.x, y, n.z, LAMP); break; }
  }
}

// the entrance door, outward-facing, on the ground floor of the chosen cell
const outward = FACING[`${ex},${ez}`];
g.set(entry.x, 1, entry.z, DOOR, { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(entry.x, 2, entry.z, DOOR, { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });

// glass panes connect to their neighbours (panes, solid faces, lamps), so each ribbon reads as one run
const connect = (x, y, z) => { const b = g.get(x, y, z); return b && b.block !== "minecraft:air" ? "true" : "false"; };
for (const [x, y, z] of glazed) {
  if (g.get(x, y, z)?.block !== `minecraft:${GLASS}`) continue;   // the entrance may have replaced a pane
  g.set(x, y, z, GLASS, { north: connect(x, y, z - 1), south: connect(x, y, z + 1), east: connect(x + 1, y, z), west: connect(x - 1, y, z), waterlogged: "false" });
}

const r = g.save(OUT);
console.log(`way_162651879: ${r.blocks} blocks, palette ${r.palette}, entry at (${entry.x},${entry.z}) facing ${outward}, top ${Math.max(...ALL.map(topOf))}`);
