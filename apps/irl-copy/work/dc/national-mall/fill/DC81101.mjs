// 1099 New York Ave NW: a 1960s precast-and-tinted-glass office block, 9 storeys over a 3-block ground floor on the
// body, an 18-block wing to the west, a low glazed link across the middle, and a two-storey crown on the core.
// Shell model: the footprint's outer ring and any face that stands above a lower neighbour are walls; everything
// inside is air, with one floor slab per storey and a full roof slab. Storeys are 2 blocks (about 4.8 m at 0.42 b/m).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81101.cells.json", "utf8"));

// Materials
const FOUNDATION = "stone_bricks";
const PLINTH = "polished_andesite";      // base course, lintels, cornice, piers at grade
const SPANDREL = "white_concrete";       // precast floor bands and piers
const GLASS = "light_blue_stained_glass";
const FLOOR = "light_gray_concrete";     // interior floor slab, one per storey
const ROOF = "gray_concrete";            // roof membrane over the interior
const PLANT = "smooth_stone";            // roof plant boxes
const GLOW = "glowstone";
const WARM = "shroomlight";

// Roof-tier from the lidar roof height (smoothing the 18/19/20/21 noise into flat tiers; the 10s are a glazed link)
const tier = (R) => (R >= 21 ? 21 : R >= 19 ? 20 : R >= 13 ? 18 : 10);

const key = (x, z) => x * 100 + z;
const FOOT = new Map();
for (const [x, z, g, R] of cells) FOOT.set(key(x, z), { g, H: tier(R) });

// The crown: two extra storeys on the middle of the core spine (x 3..4, z 12..28), set back from the 18-block wing
for (const [k, c] of FOOT) {
  const x = Math.floor(k / 100), z = k % 100;
  if (c.H === 21 && x >= 3 && x <= 4 && z >= 12 && z <= 28) c.H = 23;
}

const at = (x, z) => FOOT.get(key(x, z));
const H = (x, z) => (at(x, z) ? at(x, z).H : 0);

// A cell's face is a wall where the neighbour is outside the footprint or stands lower than this row
const isWall = (x, z, y) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = H(x + dx, z + dz);
    if (n === 0 || n <= y) return true;
  }
  return false;
};

const g = new Voxels([16, 33, 41]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Entrance on the north face (z = 0), centred on the body
const DOOR_X = 7;

for (const [k, { g: base, H: top }] of FOOT) {
  const x = Math.floor(k / 100), z = k % 100;
  const wall = (y) => isWall(x, z, y);
  const pier = (x + z) % 3 === 0;

  // foundation under the cell's ground
  for (let y = 0; y < base; y++) set(x, y, z, FOUNDATION);

  for (let y = base; y < top; y++) {
    const rel = y - base;

    if (y === top - 1) {                       // roof: a cornice on the walls, a roof slab over the interior
      set(x, y, z, wall(y) ? PLINTH : ROOF);
      continue;
    }
    if (rel === 0) {                            // base course / floor slab
      set(x, y, z, wall(y) ? PLINTH : FLOOR);
      continue;
    }
    if (rel === 1) {                            // ground floor: storefront glazing, piers, entrance
      if (!wall(y)) {
        if (z === 1 && x === DOOR_X) set(x, y, z, GLOW);       // lobby light behind the door
        continue;
      }
      if (z === 0 && x === DOOR_X) {
        set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else set(x, y, z, pier ? PLINTH : GLASS);
      continue;
    }
    if (rel === 2) {                            // ground-floor lintel / canopy band
      if (!wall(y)) continue;
      if (z === 0 && x === DOOR_X) set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else set(x, y, z, PLINTH);
      continue;
    }

    const upper = (rel - 3) % 2 === 0;           // upper storeys: a floor row, then a window row
    if (upper) {                                 // floor slab (interior) / precast spandrel band (wall)
      set(x, y, z, wall(y) ? SPANDREL : FLOOR);
    } else if (wall(y)) {                        // window row: glass in tinted frames, precast piers
      set(x, y, z, pier ? SPANDREL : GLASS);
    } else if (z === 1 && (x + y) % 6 === 0) {   // a warm light behind the glass, here and there
      set(x, y, z, (x + y) % 18 === 0 ? WARM : GLOW);
    }
  }
}

// Plant on the body roof: two stacked plant boxes, standing on the roof slab
for (const [x0, z0] of [[8, 6], [10, 14]]) {
  for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
    if (H(x, z) === 20) for (let y = 20; y < 22; y++) set(x, y, z, PLANT);
  }
}
// And a lower plant box on the wing roof
for (let x = 0; x < 2; x++) for (let z = 3; z < 5; z++) {
  if (H(x, z) === 18) for (let y = 18; y < 20; y++) set(x, y, z, PLANT);
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81101.nbt");
console.log(stats);
