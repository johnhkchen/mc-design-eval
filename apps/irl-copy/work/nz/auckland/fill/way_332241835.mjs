// Mt Eden / Eden Terrace, Auckland: a 1930s rendered-concrete commercial block (the era of the city's Deco
// shopfronts and plastered parapets). Four storeys of 4 blocks on the stepped footprint, a two-storey wing on the
// north-east corner, shopfronts on the ground floor, stone string courses and a cornice. The lidar roof heights are
// smoothed into three flat tiers: 17 (the block), 9 (the wing) and ground + 4 (the edge noise, one storey).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_332241835.cells.json`, "utf8"));

const W = 24, H = 30, D = 18;
const FOOT = new Map();                                  // "x,z" -> { g: ground, top: flat roof tier }
for (const [x, z, g, r] of cells) {
  const top = r >= 14 ? 17 : r >= 6 ? 9 : g + 4;
  FOOT.set(`${x},${z}`, { g, top });
}
const cell = (x, z) => FOOT.get(`${x},${z}`);
// a footprint cell is solid from y 0 up to its top: the foundation below its ground, the body above
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.top; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const open = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const STONE = "stone_bricks", WALL = "white_concrete", STRING = "smooth_stone", PLINTH = "polished_andesite";
const GLASS = "light_blue_stained_glass_pane", PLANT = "light_gray_concrete";
const PANE = { north: "true", east: "true", south: "true", west: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);
const windows = [];                                      // glass voxels, to carve their air gap behind

// pass 1: the massing and the facade. Shell voxels (a side open to air or to a lower roof) get the articulation.
for (const [k, { g: ground, top }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    const out = open(x, y, z);
    let block = WALL;
    if (y < ground) block = STONE;                                  // foundation, to the lowest ground
    else if (y === top - 1) block = STRING;                         // cornice on the roof edge, and the roof surface
    else if (out.length) {
      const [dx] = out[0];
      const along = dx ? z : x;                                     // position along the face
      const pier = out.length > 1 || along % 3 === 0;                // corners and every third bay are piers
      if (y === ground) block = PLINTH;                             // base course
      else if (y < 4) block = pier ? PLINTH : GLASS;                // shopfront: bulkhead piers, glazing
      else if (y % 4 === 0) block = STRING;                         // storey line
      else if (pier || y % 4 === 3) block = WALL;                   // piers and spandrels
      else block = GLASS;
      if (block === GLASS) { windows.push({ x, y, z, dx: out[0][0], dz: out[0][1], along }); }
    }
    g.set(x, y, z, block, block === GLASS ? PANE : undefined);
  }
}

// pass 2: an air gap behind each pane, one cell deep, with a shroomlight in some for the warm light
for (const w of windows) {
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!solid(ix, w.y, iz) || open(ix, w.y, iz).length) continue;   // only inside, never through a thin wall
  g.set(ix, w.y, iz, (w.along + w.y) % 11 === 0 ? "shroomlight" : "air");
}

// pass 3: the entrance on the north face (cell 5,0; ground 1): a dark oak door, its lobby and a stone fascia above
g.set(5, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(5, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(5, 1, 1, "air"); g.set(5, 2, 1, "air");
for (const x of [4, 5, 6]) g.set(x, 3, 0, PLINTH);

// pass 4: roof plant on the block's roof and on the wing's roof, standing on the surface
for (let x = 9; x <= 11; x++) for (let z = 6; z <= 8; z++) if (cell(x, z)?.top === 17) g.set(x, 17, z, PLANT);
g.set(10, 18, 7, PLANT);
for (let x = 19; x <= 21; x++) for (let z = 5; z <= 7; z++) if (cell(x, z)?.top === 9) g.set(x, 9, z, PLANT);

const { blocks, palette } = g.save(`${HERE}/way_332241835.nbt`);
console.log(`way_332241835: ${blocks} blocks, ${palette} palette entries, ${windows.length} glass panes`);
