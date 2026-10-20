import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538402992: no record, so the building is read from the lidar height (roof ~11 blocks
// above lowest ground, about two storeys of 5 blocks). It is treated as a 1980s Taiwanese
// two-storey commercial shophouse: concrete-faced walls, stone base, shopfront glazing on the
// ground floor, a storey band, a tinted-glass upper floor with concrete piers, and a parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402992";
const W = 24, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// [facing name, dx, dz] for the four wall directions
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const glassPane = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, interior floor slabs and roof deck, edge walls
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missing = DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
  const edge = missing.length > 0;
  const a = x + z;

  if (!edge) {
    // interior: floor slabs per storey and roof deck, air gaps between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    continue;
  }

  const [outName, ox, oz] = missing[0];
  const alongX = missing.some(([n]) => n === "north" || n === "south");
  const ix = -ox, iz = -oz; // inward offset
  const hasInner = has(x + ix, z + iz);

  // base course
  put(x, gr, z, "stone_bricks");

  // ground floor shopfront (offsets 1..3)
  const isDoor = a % 11 === 5;
  if (isDoor) {
    const doorProps = { facing: outName, hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "oak_door", { ...doorProps, half: "lower" });
    put(x, gr + 2, z, "oak_door", { ...doorProps, half: "upper" });
    put(x, gr + 3, z, "light_blue_stained_glass_pane", glassPane(alongX));
  } else {
    for (let o = 1; o <= 3; o++) {
      if (a % 3 === 0) put(x, gr + o, z, "quartz_pillar", { axis: "y" });
      else put(x, gr + o, z, "light_blue_stained_glass_pane", glassPane(alongX));
    }
    // warm shop light behind some glass
    if (!isDoor && a % 6 === 4 && hasInner) {
      put(x + ix, gr + 2, z + iz, "glowstone");
    }
  }

  // storey line
  put(x, gr + 4, z, "smooth_stone");

  // upper floor (offsets 5..9): concrete band, tinted windows with concrete piers
  put(x, gr + 5, z, "white_concrete");
  for (let o = 6; o <= 8; o++) {
    if (a % 3 !== 0) put(x, gr + o, z, "light_blue_stained_glass_pane", glassPane(alongX));
    else put(x, gr + o, z, "white_concrete");
  }
  if (a % 6 === 1 && hasInner) {
    put(x + ix, gr + 7, z + iz, "glowstone");
  }
  put(x, gr + 9, z, "smooth_stone"); // sill band

  // parapet
  put(x, gr + 10, z, "smooth_stone");
}

// Pass 2: roof equipment, a water tank on a 2x2 interior patch
for (const [x, z, gr] of cells) {
  const patch = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const interior = patch.every(([px, pz]) => {
    if (!has(px, pz)) return false;
    return DIRS.every(([, dx, dz]) => has(px + dx, pz + dz));
  });
  if (!interior) continue;
  if (x % 8 !== 3 || z % 8 !== 3) continue;

  for (const [px, pz] of patch) {
    const pg = ground.get(`${px},${pz}`);
    put(px, pg + 11, pz, "white_concrete");
    put(px, pg + 12, pz, "white_concrete");
  }
  // lid
  put(x, gr + 13, z, "stone_slab", { type: "bottom", waterlogged: "false" });
  put(x + 1, gr + 13, z + 1, "stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
