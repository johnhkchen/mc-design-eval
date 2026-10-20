import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098118";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 19, roof 11 blocks above lowest ground.
// Read as a 2-storey mid-century mixed-use block: stone-base shopfront,
// white tiled upper storey with a window grid, cornice and parapet, flat roof
// with a small plant box. Foundation fills under each cell to its ground.
const W = 23, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.round(gy)));
}
const has = (x, z) => ground.has(key(x, z));

// Outward facing of a perimeter cell (null if interior).
function outward(x, z) {
  if (!has(x, z - 1)) return { facing: "north", ix: 0, iz: 1 };
  if (!has(x, z + 1)) return { facing: "south", ix: 0, iz: -1 };
  if (!has(x - 1, z)) return { facing: "west", ix: 1, iz: 0 };
  if (!has(x + 1, z)) return { facing: "east", ix: -1, iz: 0 };
  return null;
}

const ROOF_LEVEL = 9;   // roof slab / cornice course
const PARAPET = 10;     // top block -> 11 blocks total
const FLOOR_2 = 5;      // first-floor slab line
const SHOP_TOP = 4;     // lintel course over shopfront

// Pass 1: foundations, base, shopfront, upper storey, roof.
for (const [k, G] of ground) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  const perim = out !== null;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  // Base course / floor at the cell's ground line.
  g.set(x, G, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Ground storey (shopfront).
  if (perim) {
    for (let y = G + 1; y <= SHOP_TOP; y++) {
      if (y === SHOP_TOP) {
        g.set(x, y, z, "light_gray_concrete");
      } else if ((x + z) % 3 === 0) {
        g.set(x, y, z, "white_concrete");     // pier
      } else {
        g.set(x, y, z, "glass_pane");         // shopfront glazing
      }
    }
  }

  // First-floor slab.
  if (G < FLOOR_2) g.set(x, FLOOR_2, z, "light_gray_concrete");

  // Upper storey: sill/lintel bands and a window grid.
  if (perim) {
    g.set(x, 6, z, "light_gray_concrete");
    g.set(x, 8, z, "light_gray_concrete");
    const bay = (x + z) % 3 === 1;
    if (bay) {
      g.set(x, 7, z, "glass_pane");
      // Warm light behind some windows (inward cell must be interior air).
      const ix = x + out.ix, iz = z + out.iz;
      if (((x * 5 + z * 3) % 4 === 0) && has(ix, iz) && outward(ix, iz) === null) {
        g.set(ix, 7, iz, "glowstone");
      }
    } else {
      g.set(x, 7, z, "white_concrete");
    }
    // Cornice and parapet.
    g.set(x, ROOF_LEVEL, z, "smooth_stone");
    g.set(x, PARAPET, z, "white_concrete");
  } else {
    // Roof slab over the interior.
    g.set(x, ROOF_LEVEL, z, "light_gray_concrete");
  }
}

// Pass 2: entrance on the south face near the middle, with a hood.
let door = null;
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (!out || out.facing !== "south") continue;
  if (door === null || Math.abs(x - 11) < Math.abs(door.x - 11)) door = { x, z, G: ground.get(k), out };
}
if (door) {
  const { x, z, G, out } = door;
  g.set(x, G + 1, z, "oak_door", { facing: out.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, G + 2, z, "oak_door", { facing: out.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy hood across the entrance bay, supported by the flanking walls.
  const hoodY = G + 3;
  if (hoodY <= SHOP_TOP) {
    for (const dx of [-1, 0, 1]) {
      if (has(x + dx, z)) g.set(x + dx, hoodY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 3: rooftop plant box on the roof slab, centred.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z) !== null) continue;
  if (x >= 9 && x <= 13 && z >= 7 && z <= 11) {
    g.set(x, PARAPET, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
