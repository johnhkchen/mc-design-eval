import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950882.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950882.nbt";
const W = 9, H = 23, D = 14;

const cells = JSON.parse(readFileSync(CELLS, "utf8")).map(([x, z, g]) => [x, z, Math.round(g)]);
const key = (x, z) => x + "," + z;
const G = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const g = new Voxels([W, H, D]);

const isPerim = (x, z) => DIRS.some(([, dx, dz]) => !G.has(key(x + dx, z + dz)));
const outwardOf = (x, z) => {
  const m = DIRS.find(([, dx, dz]) => !G.has(key(x + dx, z + dz)));
  return m ? m[0] : "south";
};
const inwardOf = (x, z) => {
  const m = DIRS.find(([, dx, dz]) => G.has(key(x + dx, z + dz)));
  return m ? [x + m[1], z + m[2]] : null;
};

// Entrance: street side (north, low z), nearest the footprint centre.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let door = null, best = Infinity;
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const score = (outwardOf(x, z) === "north" ? 0 : 100) + Math.abs(x - cx) + 0.1 * Math.abs(z - cz);
  if (score < best) { best = score; door = [x, z]; }
}

for (const [x, z, gr] of cells) {
  const perim = isPerim(x, z);
  const cornerOrPillar = DIRS.filter(([, dx, dz]) => !G.has(key(x + dx, z + dz))).length > 1;
  const pillar = cornerOrPillar || ((x + z) % 2 === 0);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab / plinth.
  g.set(x, gr, z, perim ? "polished_granite" : "smooth_stone");

  if (perim) {
    // Walls: storey 1 (g+1..g+4), storey 2 (g+6..g+8).
    for (let dy = 1; dy <= 8; dy++) {
      if (dy === 5) continue;
      g.set(x, gr + dy, z, "smooth_quartz");
    }
    // Storey line / string course above the ground floor.
    g.set(x, gr + 4, z, "polished_andesite");
    g.set(x, gr + 5, z, "polished_andesite");
    // Cornice.
    g.set(x, gr + 8, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    // Parapet.
    g.set(x, gr + 10, z, "stone_bricks");

    // Shopfront glazing with granite pillars.
    for (let dy = 1; dy <= 3; dy++) {
      g.set(x, gr + dy, z, pillar ? "polished_granite" : "light_blue_stained_glass");
    }
    // Upper-storey glazing with quartz mullions.
    for (let dy = 6; dy <= 7; dy++) {
      g.set(x, gr + dy, z, pillar ? "smooth_quartz" : "gray_stained_glass");
    }
  } else {
    // Interior floor slab for storey 2.
    g.set(x, gr + 5, z, "smooth_quartz");
  }

  // Roof deck over the whole footprint.
  g.set(x, gr + 9, z, "smooth_stone");
}

// Entrance door, lintel, and hanging lantern.
if (door) {
  const [x, z] = door;
  const gr = G.get(key(x, z));
  const facing = outwardOf(x, z);
  g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(x, gr + 4, z, "polished_andesite");
}

// Warm lights behind some glazing (interior cells one step in from the facade).
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const inn = inwardOf(x, z);
  if (!inn) continue;
  const [ix, iz] = inn;
  if (isPerim(ix, iz)) continue;
  const igr = G.get(key(ix, iz));
  const pillar = DIRS.filter(([, dx, dz]) => !G.has(key(x + dx, z + dz))).length > 1 || ((x + z) % 2 === 0);
  if (pillar) continue;
  if ((x * 7 + z * 3) % 5 === 0) g.set(ix, gr + 6, iz, "glowstone");
  if ((x * 2 + z) % 4 === 0) g.set(ix, gr + 2, iz, "shroomlight");
}

// Roof plant: a small block of equipment on the roof, in the interior.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 3 && x <= 5 && z >= 4 && z <= 6) {
    g.set(x, gr + 10, z, "light_gray_concrete");
  }
}

g.save(OUT);
