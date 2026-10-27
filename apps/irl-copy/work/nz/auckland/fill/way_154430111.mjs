// Airdale Apartments (Mt Eden, Auckland): a 1960s-70s reinforced-concrete flat block.
// Five storeys of white plastered concrete on a basalt-look stone plinth, storey lines every
// 4 blocks, 2-wide blue-glass windows between 1-wide concrete piers, a lower one-storey-and-a-
// bit wing with a roof garden, a rooftop plant room, a recessed entrance on the downhill face.
// Massing follows the lidar roof: 20 blocks over most of the footprint, 10 over the notch wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430111.cells.json", "utf8"));
const W = 56, D = 55, MAIN = 20, WING = 10;
const g = new Voxels([56, 33, 55]);

// per-cell ground (g) and top (H): the lidar roof is flat at 20 except a notch wing at 10 on ground 4-5;
// the 16/18 and 2 readings on the ground-16 rim and the corner are edge noise and take the main height
const info = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) {
  const wing = roof >= 10 && roof <= 16 && ground <= 8 && roof >= ground + 5;
  info[z][x] = { g: ground, H: wing ? WING : MAIN };
}
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && info[z][x] !== null;
const occ = (x, y, z) => inFp(x, z) && y < info[z][x].H;                // solid layers: foundation up to the roof deck
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];                         // W, E, N, S
const exterior = (x, y, z) => occ(x, y, z) && DIRS.some(([dx, dz]) => !occ(x + dx, y, z + dz));
const outward = (x, y, z) => DIRS.find(([dx, dz]) => !occ(x + dx, y, z + dz));
const airInside = (x, y, z) => occ(x, y, z) && !exterior(x, y, z) && y >= info[z][x].g && y % 4 !== 0 && y !== info[z][x].H - 1;

const panes = [];   // glass panes, connected in a second pass once their neighbours exist
const WARM = ["glowstone", "shroomlight"];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = info[z][x]; if (!c) continue;
  for (let y = 0; y < c.H; y++) {
    if (exterior(x, y, z)) {
      if (y < c.g) { g.set(x, y, z, "stone"); continue; }                           // exposed foundation on the slope
      if (y === c.g) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth course on the ground line
      const [dx, dz] = outward(x, y, z);
      const along = dx ? z : x;                                                       // position along the facade
      const r = y % 4;                                                                // 0 storey line, 1-2 window, 3 spandrel
      if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }
      if (r === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (along % 3 === 0 || !airInside(x - dx, y, z - dz)) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane");
      panes.push([x, y, z, dx ? "ns" : "ew"]);
      if ((x * 7 + y * 5 + z * 3) % 11 === 0) {                                      // warm light behind some panes
        g.set(x - dx, y, z - dz, WARM[(x + z) % 2]);
      }
    } else if (y < c.g) {
      g.set(x, y, z, "stone");                                                        // foundation under the footprint
    } else if (y === c.H - 1) {
      // roof deck: concrete on the tower, a planted roof garden on the lower wing
      g.set(x, y, z, c.H === WING ? "grass_block" : "light_gray_concrete");
    } else if (y % 4 === 0) {
      g.set(x, y, z, "light_gray_concrete");                                          // floor slab per storey
    }
  }
  // parapet / coping on the roof edge, where the cell meets open air or a lower roof
  const edge = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || info[z + dz][x + dx].H < c.H);
  if (edge) g.set(x, c.H, z, "smooth_stone");
  else if (c.H === WING && (x + z) % 3 === 0) g.set(x, c.H, z, "azalea");         // roof-garden planting
}

// glass panes: connect along the facade plane to whatever stands there
for (const [x, y, z, plane] of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  const side = plane === "ns" ? [["east", 1, 0], ["west", -1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  for (const [name, dx, dz] of side) if (g.get(x + dx, y, z + dz)) st[name] = "true";
  g.set(x, y, z, "light_blue_stained_glass_pane", st);
}

// entrance: recessed dark-oak door on the downhill west face at z 37 (ground 0)
const door = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
g.set(0, 1, 37, "dark_oak_door", door("lower"));
g.set(0, 2, 37, "dark_oak_door", door("upper"));
g.set(0, 3, 37, "light_gray_concrete");
g.set(1, 2, 37, "shroomlight");

// rooftop plant room on the main deck (deck top is y 20), 7 x 5 with a stone lid
for (let z = 21; z <= 25; z++) for (let x = 24; x <= 30; x++) {
  for (let y = 20; y <= 22; y++) {
    if (x === 24 || x === 30 || z === 21 || z === 25) g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, 23, z, "smooth_stone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430111.nbt");
console.log("way_154430111: blocks", g.count(), "palette", g.palette.length);
