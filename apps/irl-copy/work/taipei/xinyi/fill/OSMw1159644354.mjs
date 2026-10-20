import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Lidar roof ~11 blocks above lowest ground, footprint 17 x 14.
// Read as a two-storey, 1980s-style Xinyi shophouse-type commercial block:
// white concrete frame, blue-tinted glazing, a stone base course and cornice,
// a shopfront on the ground floor, a flat roof with a parapet and rooftop units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644354";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 14;
const TOP = 11;               // highest block (parapet cap), 11 above lowest ground
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.max(0, Math.min(TOP - 3, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));

// Outward faces of a footprint cell (cells with a missing 4-neighbour).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dx: 0, dz: -1, name: "north" });
  if (!has(x, z + 1)) f.push({ dx: 0, dz: 1, name: "south" });
  if (!has(x - 1, z)) f.push({ dx: -1, dz: 0, name: "west" });
  if (!has(x + 1, z)) f.push({ dx: 1, dz: 0, name: "east" });
  return f;
}

// Entrance: a north-face cell near the middle, not on a pilaster bay.
const northCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => {
    const fs = faces(x, z);
    return fs.length === 1 && fs[0].name === "north" && x % 3 !== 0;
  })
  .sort((a, b) => Math.abs(a[0] - 8) - Math.abs(b[0] - 8));
const [entX, entZ] = northCells.length ? northCells[0] : [-1, -1];

// Pass 1: structure, floors, walls, glazing, roof.
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  const fs = faces(x, z);
  const edge = fs.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slab, storey slab, roof deck, roof units. Air otherwise.
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, 10, z, "light_gray_concrete");
    if (x % 5 === 2 && z % 5 === 2) g.set(x, 11, z, "iron_block");
    continue;
  }

  // Edge: base course, cornice, parapet.
  g.set(x, gr, z, "polished_andesite");
  g.set(x, 10, z, "smooth_stone");
  g.set(x, 11, z, "stone_brick_wall");

  const f0 = fs[0];
  const along = f0.dx !== 0 ? z : x;
  const corner = fs.length >= 2;

  for (let y = gr + 1; y <= 9; y++) {
    if (y === 5) { g.set(x, y, z, "stone_bricks"); continue; } // storey line
    const pillar = corner || along % 3 === 0;
    let mat;
    if (pillar) mat = "white_concrete";
    else if (y <= 3) mat = "glass";                  // shopfront glazing
    else if (y === 4 || y === 9) mat = "white_concrete"; // lintels
    else if (y >= 6 && y <= 8) mat = "light_blue_stained_glass";
    else mat = "white_concrete";
    g.set(x, y, z, mat);
  }

  // Entrance door on the north face.
  if (x === entX && z === entZ) {
    if (gr + 1 <= 9) {
      g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    }
    if (gr + 2 <= 9) {
      g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }
}

// Pass 2: warm lights behind some upper windows (inside the footprint, air gap kept).
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const f = fs[0];
  const along = f.dx !== 0 ? z : x;
  if (along % 3 === 0) continue;          // pilaster
  if ((x + z) % 4 !== 0) continue;        // some windows only
  if (7 <= gr) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz)) continue;
  if (faces(ix, iz).length !== 0) continue;
  g.set(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
