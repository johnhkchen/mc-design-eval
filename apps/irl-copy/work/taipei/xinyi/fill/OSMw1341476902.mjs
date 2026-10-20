import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341476902";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, H = 19, D = 30;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), Math.round(gr));

// Faces: outward normal and inward offset
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Flat roof at y=7 on the lowest ground; uphill cells keep at least a two-storey shell
const roofFor = (gr) => Math.min(16, Math.max(7, gr + 7));

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const cap = roofFor(gr);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exposed = DIRS.filter((d) => !occ.has(key(x + d.dx, z + d.dz)));

  // Ground floor slab
  g.set(x, gr, z, exposed.length ? "stone_bricks" : "gray_concrete");

  if (exposed.length === 0) {
    // Interior cell: floor slab per storey and roof deck, air between
    g.set(x, gr + 4, z, "gray_concrete");
    g.set(x, cap, z, "gray_concrete");
    // Rooftop plant boxes on a few interior cells
    if (cap + 1 <= H - 1 && (x === 2 || x === 5) && (z % 9 === 4)) {
      g.set(x, cap + 1, z, "stone_bricks");
    }
    continue;
  }

  // Corners (two exposed faces) and pure vertical pilasters
  const isCorner = exposed.length > 1;

  // Roof parapet / cornice on every exterior cell
  g.set(x, cap, z, "smooth_stone");

  for (let y = gr; y < cap; y++) {
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isCorner) { g.set(x, y, z, "white_concrete"); continue; }

    const d = exposed[0];
    const t = d.dx !== 0 ? z : x;          // position along the facade
    const pilaster = t % 3 === 0;

    if (y === gr + 3 || y === gr + 4) {
      g.set(x, y, z, "light_gray_concrete"); // lintel band and storey line
      continue;
    }

    if (y <= gr + 2) {
      // Ground floor: shopfront, door on the north face
      const isDoor = d.name === "north" && x === 3 && z === 0;
      if (isDoor) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "dark_oak_door", {
            facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false",
          });
        }
        continue;
      }
      g.set(x, y, z, pilaster ? "white_concrete" : "glass_pane");
      continue;
    }

    // Upper floors: window grid, pilasters every third cell
    if (pilaster) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane");
      // Warm light just inside some windows
      const ix = x - d.dx, iz = z - d.dz;
      const inside = occ.has(key(ix, iz));
      if (inside && (t + y) % 4 === 0 && y === gr + 5) {
        g.set(ix, y, iz, (t % 2 === 0) ? "glowstone" : "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
