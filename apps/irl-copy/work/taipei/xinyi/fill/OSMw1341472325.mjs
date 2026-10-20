import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341472325";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 19, D = 27;
const g = new Voxels([W, H, D]);

// Record: roof ~7 blocks above lowest ground. Reads as a 1970s-80s mid-rise
// commercial block: two storeys of tiled white concrete, glazed shopfronts,
// a band between floors, a parapet and a plant box on the roof.
const ROOF_TOP = 7;       // roof surface at y=7 (top block y=6)
const FLOOR_Y = 3;        // slab between ground storey and upper storey
const ROOF_Y = 6;         // roof slab / parapet level

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => inside.has(key(x, z));

// Door: on the north (z-min) edge, nearest the middle of the width.
const northEdge = cells.filter(c => !has(c[0], c[1] - 1));
const midX = Math.floor(W / 2);
northEdge.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const doorCell = northEdge.length ? northEdge[0] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, c[2] ?? 0);

  const xWall = !has(x - 1, z) || !has(x + 1, z); // wall faces +/-x
  const zWall = !has(x, z - 1) || !has(x, z + 1); // wall faces +/-z
  const edge = xWall || zWall;
  const along = xWall ? z : x;                      // position along the facade
  const pillar = (xWall && zWall) || along % 3 === 0;

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys, setback-free, flat roof at ROOF_TOP for every cell.
  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === FLOOR_Y) {
      // Floor slab between storeys (solid across footprint).
      g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
    } else if (y === ROOF_Y) {
      // Roof slab (interior) and parapet (edge).
      if (edge) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    } else if (edge) {
      // Facade: pillars in white tile, glazing in between.
      if (y <= 2) {
        // Ground storey: shopfront glazing, door in the centre of the north wall.
        if (key(x, z) === doorKey && (y === gr || y === gr + 1) && y <= 2) {
          // placed below as a door
        } else if (pillar) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "glass_pane");
        }
      } else {
        // Upper storey: window grid with white frames.
        if (pillar) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "glass_pane");
        }
      }
    }
    // Interior air above the floor slabs; no interiors modelled.
  }

  // Warm light behind the upper-storey glazing on a loose grid.
  if (!edge && (x + z) % 4 === 0 && gr <= 4) {
    g.set(x, 4, z, "glowstone");
  }
}

// Entrance door (two blocks tall) on the north wall.
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  const gr = Math.max(0, doorCell[2] ?? 0);
  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dx, gr, dz, "oak_door", doorProps("lower"));
  g.set(dx, gr + 1, dz, "oak_door", doorProps("upper"));
  // Small canopy over the door, on the ground-floor ceiling line.
  for (const cx of [dx - 1, dx, dx + 1]) {
    if (has(cx, dz)) {
      g.set(cx, 3, dz, "smooth_quartz");
    }
  }
}

// Roof plant: a plain iron-clad box sitting on the roof slab, central.
for (const c of cells) {
  const [x, z] = c;
  if (x >= 3 && x <= 7 && z >= 10 && z <= 16 && (x === 3 || x === 7 || z === 10 || z === 16)) {
    g.set(x, ROOF_TOP, z, "iron_block");
  }
  if (x >= 4 && x <= 6 && z >= 11 && z <= 15) {
    g.set(x, ROOF_TOP, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
