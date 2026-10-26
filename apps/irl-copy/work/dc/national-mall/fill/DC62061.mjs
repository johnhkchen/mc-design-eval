// 1120 19th St NW, a 1970s-80s Commercial-Office in pale limestone: a 4-storey wing (lidar 12) round a 5-storey core (15)
// with a one-bay penthouse (16), a 4-high entrance bay on the north face and a one-storey shop bay on the east. Walls are
// two cells deep: the facade cell is the outer skin (stone piers every 3 cells, openings between), the cell behind it holds
// the glass, so every window is recessed in its opening with an air gap behind. Floors are solid slabs; the rest is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62061.cells.json", "utf8"));

// column (x, z) -> { g: ground, R: roof top, the building fills y in [0, R) }
const col = new Map();
for (const [x, z, g, R] of cells) col.set(`${x},${z}`, { g, R });
// lidar reads the entrance bay at 2 high on its middle row: smooth it into the 4-high porch
for (const [x, z] of [[4, 1], [5, 1]]) col.get(`${x},${z}`).R = 4;

const at = (x, z) => col.get(`${x},${z}`);
const solid = (x, z, y) => { const c = at(x, z); return !!c && y >= 0 && y < c.R; };
const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outX = (x, z, y) => !solid(x - 1, z, y) || !solid(x + 1, z, y);
const outZ = (x, z, y) => !solid(x, z - 1, y) || !solid(x, z + 1, y);
const exterior = (x, z, y) => solid(x, z, y) && (outX(x, z, y) || outZ(x, z, y));
// inside the skin: solid, not on the outside, but touching the skin (the glass layer or the wall behind a pier)
const ring1 = (x, z, y) => solid(x, z, y) && !exterior(x, z, y) && N.some(([dx, dz]) => exterior(x + dx, z + dz, y));
// a pier on the skin every third cell along each face (corners follow their own face)
const pier = (x, z, y) => (outZ(x, z, y) && x % 3 === 0) || (outX(x, z, y) && z % 3 === 0);
// the storey rows: 0 plinth, 1 shopfront / window band, 2 header; from 3 up each storey is spandrel, window, header
const kind = (x, z, y) => {
  const c = at(x, z);
  if (y < c.g) return "found";
  if (y === c.R - 1) return "cap";
  if (y === 0) return "plinth";
  if (y === 1) return "glazed";
  if (y === 2) return "header";
  return ["spandrel", "glazed", "header"][(y - 3) % 3];
};
// a skin cell is an opening when it is not a pier and has an inside cell behind it to hold the glass
const opening = (x, z, y) => exterior(x, z, y) && !pier(x, z, y) && kind(x, z, y) === "glazed" && N.some(([dx, dz]) => solid(x + dx, z + dz, y) && !exterior(x + dx, z + dz, y));
// glass sits in the inside cell behind an opening
const glass = (x, z, y) => ring1(x, z, y) && kind(x, z, y) === "glazed" && N.some(([dx, dz]) => opening(x + dx, z + dz, y));

const ground = "polished_granite", skin = "calcite", pierBlock = "stone_bricks", slab = "smooth_stone", deck = "smooth_stone";

const g = new Voxels([18, 28, 16]);

// the solid envelope, cell by cell
for (let z = 0; z < 16; z++) for (let x = 0; x < 18; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y < c.R; y++) {
    const k = kind(x, z, y), ext = exterior(x, z, y), r1 = ring1(x, z, y);
    if (k === "found") { g.set(x, y, z, ext ? ground : "stone"); continue; }
    if (k === "cap") { g.set(x, y, z, ext ? "stone_bricks" : deck); continue; }
    if (opening(x, z, y)) continue;                      // air in the opening: the glass is one cell behind
    if (glass(x, z, y)) { g.set(x, y, z, "light_blue_stained_glass"); continue; }
    if (k === "plinth") { g.set(x, y, z, ext || r1 ? ground : slab); continue; }
    if (k === "spandrel") { g.set(x, y, z, ext ? (pier(x, z, y) ? pierBlock : skin) : r1 ? skin : slab); continue; }
    if (k === "header") { if (!ext && !r1) continue; g.set(x, y, z, pier(x, z, y) && ext ? pierBlock : skin); continue; }
    if (k === "glazed") {
      // a solid cell in a window row: a pier on the skin, or the wall behind a pier
      if (ext) g.set(x, y, z, pierBlock);
      else if (r1) g.set(x, y, z, skin);
      continue;
    }
  }
  // roof coping: one slab course on the outer edge of the top
  const top = c.R;
  if (exterior(x, z, top - 1)) g.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind some glass: an inside cell in a window row, next to a pane, now and then
for (let z = 0; z < 16; z++) for (let x = 0; x < 18; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 1; y < c.R; y++) {
    if (exterior(x, z, y) || ring1(x, z, y)) continue;
    if (!(kind(x, z, y) === "glazed" || kind(x, z, y) === "header")) continue;
    if (!N.some(([dx, dz]) => glass(x + dx, z + dz, y))) continue;
    if ((x * 5 + z * 7 + y) % 9 === 0) g.set(x, y, z, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// the entrance on the north face: a door with a glazed side, under a dark-oak hood on the porch
g.set(4, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [4, 5]) for (const z of [0, 1])
  g.set(x, 4, z, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// rooftop plant: light-grey boxes on the deck, where the deck is inside (not on the coping)
for (const [ax, az] of [[13, 4], [12, 11], [6, 6]]) {
  const top = at(ax, az).R;
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => { const x = ax + dx, z = az + dz; return at(x, z) && at(x, z).R === top && !exterior(x, z, top - 1); });
  if (ok) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(ax + dx, top, az + dz, "light_gray_concrete");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62061.nbt");
console.log("DC62061", g.count(), "blocks,", g.palette.length - 1, "block states");
