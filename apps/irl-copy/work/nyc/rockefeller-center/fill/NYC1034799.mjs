// 5 West 54th Street, 1899 commercial and office building, an NYC individual landmark. Decided from the record: a
// load-bearing brick office block of the 1890s, a shop at street level and about seven storeys of offices above, with
// stone bands and a corbelled cornice. Footprint 7 x 23 (x across the front, low z = north = the 54th Street frontage).
// Lidar tops are read as clean tiers: a 16-block street wall at the front, a 26-block tall stack on the west side
// (the spine), 21-block offices across the middle, an 18-block rear wing. The east front is a one-storey shop wing.
// Two open lots at the front (x 4-5, z 0-1) and two small light wells are paved and left open to the sky.
//
// Construction: a brick core to each tier's top, a granite base course, stone storey bands every third block, and
// windows as glass panes two blocks tall between brick piers every third block (stone quoins at the corners). Each
// window has an air gap behind it with a floor slab per storey (no interiors); some windows hold glowstone behind the
// glass. Roofs are tar-and-gravel with a stone parapet on the edge. A door sits in the street front at x 3.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034799.cells.json`, "utf8"));
const X = 7, Y = 27, Z = 23;

// Roof tops in blocks above y 0, [z][x], from the lidar smoothed into tiers. 0 = open ground in the footprint.
const TOP = [
  [16, 16, 16, 16, 0, 0, 3],
  [24, 16, 16, 16, 0, 0, 3],
  [24, 21, 21, 6, 16, 16, 16],
  [26, 21, 21, 21, 21, 21, 21],
  [26, 21, 21, 21, 21, 0, 0],
  [26, 21, 21, 21, 21, 21, 21],
  [26, 21, 21, 21, 21, 21, 21],
  [26, 21, 21, 0, 21, 21, 21],
  [26, 26, 26, 24, 24, 24, 24],
  [26, 26, 26, 24, 24, 24, 24],
  [26, 26, 26, 26, 24, 24, 24],
  [26, 26, 26, 24, 24, 24, 24],
  [26, 24, 24, 24, 24, 24, 24],
  [24, 24, 24, 24, 24, 24, 24],
  [24, 24, 24, 24, 24, 24, 24],
  [24, 21, 21, 21, 21, 24, 24],
  [21, 21, 21, 21, 21, 21, 26],
  [21, 21, 21, 21, 21, 21, 26],
  [21, 21, 21, 21, 21, 21, 26],
  [21, 21, 21, 21, 21, 21, 26],
  [21, 21, 21, 21, 21, 21, 21],
  [21, 21, 21, 21, 21, 21, 21],
  [21, 18, 18, 18, 18, 18, 18],
];

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const T = (x, z) => (inFoot(x, z) ? TOP[z][x] : 0);
const open = (x, y, z) => !inFoot(x, z) || T(x, z) <= y;

// Outward faces: N = low z (street front), S = rear, W/E = the side walls. N and S run along x; W and E along z.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const air = [], glows = [];

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const top = T(x, z), gr = G(x, z);
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Open ground in the footprint: paved, no building.
  if (!top) { g.set(x, gr, z, "stone_bricks"); continue; }
  // Brick core to the roof; the top layer is a stone parapet on the edge, tar-and-gravel inside.
  for (let y = gr; y < top; y++) g.set(x, y, z, "bricks");
  const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => T(x + dx, z + dz) < top || !inFoot(x + dx, z + dz));
  g.set(x, top - 1, z, edge ? "smooth_stone" : "gravel");

  // Exterior faces, storey by storey. y 0 is the granite base course; every third block is a stone storey band.
  for (let y = gr; y <= top - 2; y++) {
    const faces = Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });
    if (!faces.length) continue;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }
    let quoin = false;
    const wins = [];
    for (const d of faces) {
      const along = d === "N" || d === "S";
      const u = along ? x : z, L = along ? X : Z;
      if (top <= 3) { wins.push(d); continue; }                  // the one-storey shop wing is all glass
      if (u === 0 || u === L - 1) { quoin = true; continue; }     // stone quoins at the corners
      if (u % 3 === 0) continue;                                  // brick pier
      wins.push(d);
    }
    if (quoin && !(top <= 3)) { g.set(x, y, z, "stone_bricks"); continue; }
    for (const d of wins) {
      const [dx, dz] = DIRS[d];
      g.set(x, y, z, "glass_pane", d === "N" || d === "S" ? NS : EW);
      const ix = x - dx, iz = z - dz;                             // the air gap behind the glass
      if (inFoot(ix, iz)) {
        air.push([ix, y, iz]);
        const k = Object.keys(DIRS).indexOf(d);
        if (lit(d === "N" || d === "S" ? x : z, y, k)) glows.push([ix, y, iz]);
      }
    }
  }
}

// Bulkhead on the office roof: a two-block stair house on four interior cells, capped in stone.
for (const [x, z] of [[2, 4], [3, 4], [2, 5], [3, 5]]) {
  g.set(x, 21, z, "bricks"); g.set(x, 22, z, "smooth_stone");
}

// Lobby air behind the street door (x 3, z 0), then the door itself.
for (const y of [1, 2]) air.push([3, y, 1]);
for (const [x, y, z] of air) g.set(x, y, z, "air");
for (const [x, y, z] of glows) g.set(x, y, z, "glowstone");
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(3, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(3, 2, 0, "dark_oak_door", { ...door, half: "upper" });

const out = g.save(`${DIR}/NYC1034799.nbt`);
console.log(`NYC1034799.nbt: ${out.blocks} blocks, ${out.palette} palette entries, size ${X}x${Y}x${Z}`);
