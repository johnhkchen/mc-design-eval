import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: a 1930s brick commercial block (stripped classical, Art Deco cream bands) on the Eden Terrace / CBD edge.
// Massing from the lidar roof: a five-storey main body (roof 20), a six-storey NE tower whose core steps back from its
// podium (roof 23), and a two-storey SE wing (roof 12). Floors sit at y 4, 8, 12, 16 (and 20 in the tower); the high north
// side meets the ground at y 4, the downhill south and west sides get a plinth and a lower-ground storey down to y 0.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465567.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465567.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([28, 36, 38]);

// Materials: red brick piers and spandrels, cream terracotta string courses and cornices, a dark timber shopfront.
const BRICK = "bricks", PLINTH = "polished_andesite", BAND = "white_terracotta", SLAB = "smooth_stone";
const GLASS = "glass", FASCIA = "dark_oak_planks", PLANT = "light_gray_concrete", COPPER = "oxidized_copper";
const LIGHT = "glowstone";

// E and W faces run along z; N and S along x.
const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map(), top = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roof.set(key(x, z), r); }

// Storey tiers from the lidar roof: the tower core (roof 22+, all four neighbours also tower) rises to 23; the rest of the
// tower steps back to the podium at 20; the main body is 20; the SE wing (roof under 19) is 12.
const TOP = { main: 20, tower: 23, wing: 12 };
const isTowerCell = (x, z) => (roof.get(key(x, z)) ?? 0) >= 22;
for (const [x, z, , r] of cells) {
  let t;
  if (r >= 22) t = DIRS.every(([dx, dz]) => isTowerCell(x + dx, z + dz)) ? TOP.tower : TOP.main;
  else if (r >= 19) t = TOP.main;
  else t = TOP.wing;
  top.set(key(x, z), t);
}

// The faces of cell (x, z) open to the air at height y: off the footprint, or beside a cell that stops below y.
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => { const t = top.get(key(x + dx, z + dz)); return t === undefined || t <= y; });
// Window bays: along a face, two of every four cells are glass, the other two are brick piers.
const bayWindow = (x, z, face) => { const u = face === "E" || face === "W" ? z : x; return [1, 2].includes(u % 4); };

// The entrance: a dark timber door on the west face at z 28, under a canopy across the three cells of its bay.
const westEdge = (z) => Math.min(...cells.filter(([, zz]) => zz === z).map(([x]) => x));
const DOOR = { x: westEdge(28), z: 28 };
const doorBay = [27, 28, 29].map((z) => ({ x: westEdge(z), z }));

for (const [x, z, gr] of cells) {
  const T = top.get(key(x, z));
  for (let y = 0; y < T; y++) {
    const open = faces(x, z, y);
    const outer = open.length > 0;
    let block = null;
    if (y < 4) {
      // the plinth: solid from y 0 under the ground, and a lower-ground window where the downhill side shows above grade
      block = PLINTH;
      if (outer && gr <= 1 && (y === 1 || y === 2) && open.length === 1 && bayWindow(x, z, open[0][2])) block = GLASS;
    } else if (y === T - 1) {
      block = outer ? BAND : SLAB;                       // cornice on the outside, roof deck inside
    } else if ((y - 4) % 4 === 0) {
      block = outer ? BAND : SLAB;                       // floor slab, and the string course on the outside
    } else if (outer) {
      const o = (y - 4) % 4;                               // 1, 2 glass band; 3 header
      const single = open.length === 1 ? open[0] : null;  // corners are brick
      if (o === 3) block = y === 7 ? FASCIA : BRICK;      // the ground-floor fascia over the shopfront
      else if (single && bayWindow(x, z, single[2])) block = GLASS;
      else block = BRICK;
      // warm light just inside some glass bands, in the air behind the pane
      if (block === GLASS && o === 1 && (x * 7 + z * 5 + y) % 3 === 0) {
        const [dx, dz] = single;
        const ix = x - dx, iz = z - dz;
        if (top.get(key(ix, iz)) > y && faces(ix, iz, y).length === 0) g.set(ix, y, iz, LIGHT);
      }
    }
    if (block) g.set(x, y, z, block);
  }
  // the parapet: brick piers rise one course above the cornice, the window bays stay open, so the skyline crenellates
  const pf = faces(x, z, T - 1);
  if (pf.length && (pf.length > 1 || !bayWindow(x, z, pf[0][2]))) g.set(x, T, z, BRICK);
}

// Entrance bay: door (two cells high) on the door cell, glass either side, and the canopy above the bay.
for (const { x, z } of doorBay) {
  for (const y of [5, 6]) g.set(x, y, z, GLASS);
  g.set(x, 7, z, "dark_oak_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
}
g.set(DOOR.x, 5, DOOR.z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 6, DOOR.z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// Roof plant: a 2 x 2 unit on the main roof where the deck is flat and clear of the parapet.
const plantAt = (x, z) => {
  const ok = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => top.get(key(a, b)) === TOP.main && faces(a, b, 19).length === 0);
  if (!ok) return false;
  for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) g.set(a, TOP.main, b, PLANT);
  return true;
};
const plantSpots = [[5, 10], [11, 9], [19, 16], [7, 22], [15, 30]].filter(([x, z]) => plantAt(x, z));

// Tower crown: a 3 x 3 cream cap on the core roof, with a green copper finial.
const core = cells.filter(([x, z]) => top.get(key(x, z)) === TOP.tower);
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length);
const cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(cx + dx, TOP.tower, cz + dz, BAND);
for (let y = TOP.tower; y <= TOP.tower + 2; y++) g.set(cx, y, cz, COPPER);

const counts = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...counts, plantSpots, crown: [cx, cz], coreCells: core.length }));
