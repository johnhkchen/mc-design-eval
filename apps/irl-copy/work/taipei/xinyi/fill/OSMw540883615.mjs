import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883615.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883615.nbt";

const W = 8, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const G = Math.min(...cells.map(([, , gr]) => Math.round(gr)));   // lowest ground under the building

// Building read as a 1980s-90s Xinyi mid-rise: two storeys of light tiled
// concrete, a stone base course, glass bays with white mullions, a stone
// storey line and cornice, a flat roof deck with a parapet and a plant box.
// r = height above the lowest ground G.
//   r0 base course | r1-4 ground floor (shopfront, door on south) | r5 storey line
//   r6-8 upper storey windows | r9 cornice | r10 roof slab / parapet
//   r11 roof plant

const solid = (x, y, z, id) => { if (y >= 0 && y < H) g.set(x, y, z, id); };

function doorProps(half) {
  return { facing: "south", half, hinge: "left", open: "false", powered: "false" };
}

for (const [xr, zr, gr] of cells) {
  const x = Math.round(xr), z = Math.round(zr), gd = Math.round(gr);

  // Foundation from y 0 up to this cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gd && y < H; y++) solid(x, y, z, "stone");

  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Walls, floors and roof from the cell's ground up to the roof deck (r = 10),
  // plus roof plant at r = 11.
  for (let r = 0; r <= 11; r++) {
    const y = G + r;
    if (y < gd) continue;          // already inside foundation
    if (y >= H) break;

    if (!edge) {
      // Interior: floor slabs, air gaps, a few glowstone lights behind glass.
      if (r === 0) g.set(x, y, z, "gray_concrete");
      else if (r === 5) g.set(x, y, z, "smooth_stone");
      else if (r === 10) g.set(x, y, z, "gray_concrete");
      else if (r === 7 && ((x === 3 && z === 1) || (x === 3 && z === 6) || (x === 6 && z === 3))) {
        g.set(x, y, z, "glowstone");
      } else if (r === 11 && (x === 2 || x === 3) && (z === 2 || z === 3)) {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Exterior ring.
    const onSouth = z === D - 1;
    const idx = (z === 0 || z === D - 1) ? x : z;   // position along the face
    let id = null, props = undefined;

    if (r === 0) {
      id = "polished_andesite";                      // base course
    } else if (r >= 1 && r <= 4) {                   // ground floor
      if (r === 4) id = "smooth_stone";              // lintel band
      else if (corner || idx % 2 === 0) id = "white_concrete";
      else if (onSouth && idx === 3) {
        if (r === 1) { id = "oak_door"; props = doorProps("lower"); }
        else if (r === 2) { id = "oak_door"; props = doorProps("upper"); }
        else id = "smooth_stone";                    // door head
      } else id = "glass";
    } else if (r === 5 || r === 9 || r === 10) {     // storey line, cornice, parapet
      id = "smooth_stone";
    } else if (r >= 6 && r <= 8) {                   // upper storey
      if (corner || idx % 2 === 0) id = "white_concrete";
      else id = "glass";
    }

    if (id) {
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    }
  }
}

g.save(OUT);
