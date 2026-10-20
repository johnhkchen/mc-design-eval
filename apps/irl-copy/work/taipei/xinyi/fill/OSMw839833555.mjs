import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833555";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 19; roof ~11 above lowest ground. Reads as a 2-storey
// early-1990s Xinyi commercial block: white tiled piers, grey spandrels,
// blue-glass shopfront below, flat roof with parapet and a plant box.
const W = 20, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Exposed faces: list of [dx, dz] whose neighbour is outside the footprint.
const exposures = (x, z) => {
  const out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!inside(x + dx, z + dz)) out.push([dx, dz]);
  }
  return out;
};

// Main entrance: a south-facing (+z) exposed cell nearest the centre line.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const ex = exposures(x, z);
    if (ex.length === 1 && ex[0][0] === 0 && ex[0][1] === 1) {
      const d = Math.abs(x - W / 2);
      if (d < best) { best = d; doorKey = key(x, z); }
    }
  }
}

for (const [x, z, gr] of cells) {
  const ex = exposures(x, z);
  const edge = ex.length > 0;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, first floor, roof deck.
  if (edge) {
    put(x, gr, z, "polished_granite");        // base course
    put(x, gr + 5, z, "smooth_quartz");       // string course
    put(x, gr + 10, z, "smooth_quartz");      // roof edge line
  } else {
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "smooth_stone");       // roof membrane
  }

  if (!edge) {
    // Interior plant box on the roof, central block.
    if (x >= 7 && x <= 12 && z >= 6 && z <= 11) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Parapet on the roof edge.
  put(x, gr + 11, z, "white_concrete");

  // Facade. Pick the exposed face used for pier spacing.
  const isCorner = ex.length >= 2;
  const [fdx, fdz] = ex[0];
  const coord = fdz !== 0 ? x : z;
  const pier = isCorner || coord % 3 === 0;
  const isDoorCell = key(x, z) === doorKey;

  for (let s = 0; s < 2; s++) {
    const b = gr + 5 * s;
    for (let k = 1; k <= 4; k++) {
      const y = b + k;

      if (isDoorCell && s === 0) {
        if (k === 1) {
          put(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (k === 2) {
          put(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (k === 3) {
          put(x, y, z, "dark_oak_planks");      // entrance lintel
        } else {
          put(x, y, z, "smooth_quartz");        // canopy edge
        }
        continue;
      }

      if (pier) {
        put(x, y, z, "white_concrete");
        continue;
      }

      if (s === 0) {
        // Shopfront: glass with dark fascia at the top.
        if (k === 4) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "light_blue_stained_glass");
      } else {
        // Upper storey: spandrels top and bottom, glazing between.
        if (k === 1 || k === 4) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      }

      // Warm light in the room behind some upper windows.
      if (s === 1 && k === 2 && (coord % 2 === 0)) {
        const ix = x - fdx, iz = z - fdz;
        if (inside(ix, iz) && exposures(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
