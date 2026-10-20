import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw839833617.cells.json`, "utf8"));

// 1990s-era mid-rise commercial block: white tiled facade, granite plinth,
// two storeys of tinted-glass bays with white pillars, quartz cornice, flat roof, parapet.
const W = 18, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const gkey = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(gkey(x, z), Math.round(gr));
const inside = (x, z) => ground.has(gkey(x, z));

const L0 = Math.min(...ground.values());   // lowest ground under the footprint
const TOP = L0 + 11;                        // parapet top, roof ~11 blocks

// perimeter = footprint cell with at least one neighbour outside the footprint
const edgeOf = (x, z) => ({
  N: !inside(x, z - 1),
  S: !inside(x, z + 1),
  W: !inside(x - 1, z),
  E: !inside(x + 1, z),
});
const isPerim = (x, z) => {
  const e = edgeOf(x, z);
  return e.N || e.S || e.W || e.E;
};

// Front = the north (z-min) face; door sits at the middle of that face.
const northXs = cells
  .filter(([x, z]) => edgeOf(x, z).N)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const e = edgeOf(x, z);
  const perim = isPerim(x, z);
  const corner = (e.N || e.S) && (e.E || e.W);
  // bay index along the wall the cell sits on
  const bay = (e.N || e.S) ? x : z;
  const pillar = corner || bay % 3 === 0;

  if (!perim) {
    // interior: floor slabs only, air otherwise (no interiors)
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      return inside(nx, nz) && isPerim(nx, nz);
    });
    for (let y = gr; y <= TOP; y++) {
      const r = y - L0;
      if (y === gr || r === 5) {
        g.set(x, y, z, "smooth_stone");
      } else if (r === 10) {
        g.set(x, y, z, "light_gray_concrete");          // roof deck
      } else if (r === 11 && x % 5 === 2 && z % 4 === 2) {
        g.set(x, y, z, "iron_block");                    // rooftop AC plant
      } else if ((r === 2 || r === 7) && near && (x + z) % 4 === 0) {
        g.set(x, y, z, "glowstone");                     // warm light behind glass
      }
    }
    continue;
  }

  // perimeter facade
  for (let y = gr; y <= TOP; y++) {
    const r = y - L0;
    let id = null;
    let props;

    if (y === gr) {
      id = "polished_granite";                           // base course
    } else if (r === 0) {
      id = "polished_granite";
    } else if (r >= 1 && r <= 3) {
      id = pillar ? "white_concrete" : "light_blue_stained_glass";
    } else if (r === 4) {
      id = "smooth_quartz";                              // ground-storey lintel
    } else if (r === 5) {
      id = "smooth_quartz";                              // second-floor band
    } else if (r >= 6 && r <= 8) {
      id = pillar ? "white_concrete" : "light_blue_stained_glass";
    } else if (r === 9) {
      id = "smooth_quartz";
    } else if (r === 10) {
      id = "smooth_quartz";                              // cornice
    } else if (r === 11) {
      id = "smooth_quartz_slab";                         // parapet cap
      props = { type: "top" };
    }

    // entrance on the north face
    if (e.N && x === doorX && (r === 1 || r === 2)) {
      id = "dark_oak_door";
      props = {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }
    if (e.N && x === doorX && r === 3) {
      id = "lantern";
      props = { hanging: "false", waterlogged: "false" };
    }

    if (id) g.set(x, y, z, id, props);
  }
}

g.save(`${dir}/OSMw839833617.nbt`);
