// 1130 Connecticut Ave NW: a 1960s-70s Commercial-Office block (the DC Height Act's ~130 ft roof, pale stone and tinted glazing).
// Massing follows the lidar roof: a 17-block main body, a 19-block tower core set in from the east side, a 14 light court,
// and a 12-block north-west corner wing. The envelope is a hollow shell: floor slabs every storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75871.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..27, z 0..19

// Roof tiers, smoothed from the lidar: 19 is the tower, 14 a 2x2 light court, 11-14 the north-west wing, and the 1-3 stubs on the
// east edge and the 18s on the north-west edge are lidar noise that joins the main body at 17.
const TOP = new Map();
for (const [x, z, , r] of cells) {
  let t = 17;
  if (r >= 19) t = 19;
  else if (r === 14 && x >= 12 && x <= 13 && z >= 10 && z <= 11) t = 14;
  else if (x <= 1 && z >= 3 && z <= 4 && r <= 14) t = 12;
  TOP.set(`${x},${z}`, t);
}
const cellList = cells.map(([x, z]) => [x, z]);
const inFoot = (x, z) => TOP.has(`${x},${z}`);
const topAt = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                               // N, S, W, E
// the faces of a cell that are outside at height y: no footprint beyond them, or a lower roof beside them
const exposedAt = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);

// storey lines: floor slabs at these heights (ground storey 1-3 as a shopfront lobby, upper storeys 3 blocks each)
const FLOORS = [0, 4, 7, 10, 13, 16];
const PLINTH = "polished_andesite", BAND = "smooth_quartz", CAP = "smooth_quartz", DECK = "smooth_stone", FLOOR = "smooth_stone";
const PIER = "quartz_pillar", GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane", AWNING = "black_concrete";

const g = new Voxels([28, 31, 20]);
const windows = [];
for (const [x, z] of cellList) {
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    const ex = exposedAt(x, z, y);
    if (y === T - 1) { g.set(x, y, z, ex.length ? CAP : DECK); continue; }     // roof deck, its edge a parapet
    if (FLOORS.includes(y) && y <= T - 2) {                                   // a floor slab (a storey line on the outside)
      g.set(x, y, z, ex.length ? (y === 0 ? PLINTH : BAND) : FLOOR);
      continue;
    }
    if (!ex.length) continue;                                                 // inside: air
    const corner = ex.length > 1;
    const along = ex.some(([, dz]) => dz !== 0) ? x : z;                      // the wall's own coordinate
    if (y <= 3) {                                                             // ground storey: lobby, door, awning, shopfront
      if (z === 19 && x === 14 && y <= 2) {
        const half = y === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else if (z === 19 && x >= 14 && x <= 15 && y === 3) g.set(x, y, z, AWNING);   // over the door, not a stray dark tab at the wing's corner
      else if (corner || along % 3 === 0) g.set(x, y, z, PIER);
      else g.set(x, y, z, SHOP);
      continue;
    }
    if (corner || along % 3 === 0) g.set(x, y, z, PIER);                      // upper storeys: 2-wide panes between stone piers
    else { g.set(x, y, z, GLASS); windows.push([x, y, z, ex]); }
  }
}

// warm light behind some panes: a glowstone in the air gap just inside the glass
for (const [x, y, z, ex] of windows) {
  if ((x * 7 + y * 3 + z * 5) % 11 !== 0) continue;
  const [dx, dz] = ex[0];
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || topAt(ix, iz) - 1 <= y || exposedAt(ix, iz, y).length) continue;
  g.set(ix, y, iz, "glowstone");
}

// rooftop plant: a 2-block penthouse on the tower core, two plant boxes on the main roof
for (let x = 17; x <= 20; x++) for (let z = 10; z <= 13; z++) if (topAt(x, z) === 19) {
  g.set(x, 19, z, "light_gray_concrete");
  g.set(x, 20, z, CAP);
}
for (const [x0, x1, z0, z1] of [[3, 5, 7, 8], [8, 10, 3, 4]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (topAt(x, z) === 17) {
    g.set(x, 17, z, "light_gray_concrete");
    g.set(x, 18, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC75871.nbt`);
