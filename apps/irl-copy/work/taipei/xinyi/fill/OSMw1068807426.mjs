import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807426.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807426.nbt";

const W = 18, H = 23, D = 18;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// ground lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Building: 2 storeys of 5 blocks, parapet to offset 11 (roof ~11 above ground),
// rooftop plant to offset 12, lightning rod at 13.
// Facade bands per storey (offset from the cell's own ground):
//   0 base course, 1-3 glazing (storey 1), 4-5 spandrel/floor line,
//   6-8 glazing (storey 2), 9-10 spandrel/parapet, 11 coping slab.
const WINDOW_OFFS = new Set([1, 2, 3, 6, 7, 8]);

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // exterior faces: sides where the neighbour is not part of the footprint
  const faces = [];
  if (!has(x, z - 1)) faces.push("n");
  if (!has(x, z + 1)) faces.push("s");
  if (!has(x - 1, z)) faces.push("w");
  if (!has(x + 1, z)) faces.push("e");
  const perim = faces.length > 0;
  const face = faces[0];

  // along-face index for window rhythm
  const idx = face === "n" || face === "s" ? x : z;

  for (let off = 0; off <= 12; off++) {
    const y = gr + off;

    if (perim) {
      if (off === 0) {
        put(x, y, z, "polished_andesite");
      } else if (off === 11) {
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      } else if (off === 4 || off === 5 || off === 9 || off === 10) {
        put(x, y, z, "white_concrete");
      } else if (WINDOW_OFFS.has(off)) {
        // entrance on south face, centre of the wall
        if (face === "s" && (idx === 8 || idx === 9) && off <= 2) {
          if (idx === 8 && off === 1) {
            put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (idx === 8 && off === 2) {
            put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "light_blue_stained_glass");
          }
        } else if (face === "s" && (idx >= 7 && idx <= 10) && off === 3) {
          // entrance canopy lintel
          put(x, y, z, "white_concrete");
        } else if (idx % 3 === 0) {
          put(x, y, z, "white_concrete"); // mullion
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }

        // warm light set just inside the glass in some bays (storey 1 and 2 at off 2 / 7)
        if ((off === 2 || off === 7) && idx % 6 === 2) {
          let ix = x, iz = z;
          if (face === "n") iz = z + 1;
          else if (face === "s") iz = z - 1;
          else if (face === "w") ix = x + 1;
          else if (face === "e") ix = x - 1;
          const ig = G.get(`${ix},${iz}`);
          if (ig !== undefined && ig === gr) put(ix, ig + off, iz, "glowstone");
        }
      } else {
        // off 3 outside entrance zone or other gaps: shopfront frame
        put(x, y, z, "white_concrete");
      }
    } else {
      // interior: floor slabs only, air elsewhere (no interiors)
      if (off === 0 || off === 5 || off === 10) {
        put(x, y, z, "smooth_stone");
      } else if ((off === 11 || off === 12) && x >= 7 && x <= 10 && z >= 7 && z <= 10) {
        // rooftop plant block
        put(x, y, z, "light_gray_concrete");
      }
    }
  }

  // lightning rod on the plant block centre
  if (!perim && x === 8 && z === 8) {
    put(x, gr + 13, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
