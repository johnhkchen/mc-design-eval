import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area commercial block, c. 1980s: two storeys of cream tile-and-quartz
// facade over a shopfront plinth, light-grey concrete bands, flat roof with parapet,
// rooftop water tank. Storeys sit at absolute levels: shop 1-4, upper floor 6-9, roof 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991759";
const W = 13, H = 23, D = 18;
const TOP_WALL = 10;   // cornice course
const PARAPET = 11;    // parapet top, 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const f = exposed(x, z);
  return f.n || f.s || f.w || f.e;
};
const faceOf = (x, z) => {
  const f = exposed(x, z);
  if (f.n) return "n";
  if (f.s) return "s";
  if (f.w) return "w";
  if (f.e) return "e";
  return null;
};
const cornerOf = (x, z) => {
  const f = exposed(x, z);
  return (f.n + f.s + f.w + f.e) >= 2;
};

const g = new Voxels([W, H, D]);

// Entrance: middle of the north-facing wall (lowest z face).
const northXs = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).n) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

// Pass 1: foundations, interior floor slabs, walls, facade.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);

  // Foundation under every footprint cell.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: storey floor slabs and roof slab, air between (no interior fit-out).
    g.set(x, 5, z, "smooth_stone");
    g.set(x, TOP_WALL, z, "smooth_stone");
    continue;
  }

  const face = faceOf(x, z);
  const along = (face === "n" || face === "s") ? x : z;
  const corner = cornerOf(x, z);
  const pier = corner || along % 3 === 0;
  const bay = !pier;

  for (let y = gr; y <= TOP_WALL; y++) {
    let id;
    if (y === gr) id = "polished_andesite";                       // plinth
    else if (y <= 3) id = bay ? "glass_pane" : "smooth_quartz";    // shopfront
    else if (y === 4) id = "dark_oak_planks";                      // fascia
    else if (y === 5) id = "light_gray_concrete";                  // storey belt
    else if (y === 6) id = bay ? "light_gray_concrete" : "smooth_quartz"; // sill
    else if (y === 7 || y === 8) id = bay ? "glass_pane" : "smooth_quartz";
    else if (y === 9) id = bay ? "light_gray_concrete" : "smooth_quartz"; // head
    else id = "light_gray_concrete";                               // cornice
    g.set(x, y, z, id);
  }

  // Parapet.
  g.set(x, PARAPET, z, "smooth_quartz");

  // Entrance door on the north face.
  if (face === "n" && x === entranceX) {
    const dy = gr + 1;
    if (dy + 1 <= 4) {
      g.set(x, dy, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, dy + 1, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
  }
}

// Pass 2: warm lights behind some upper-floor windows and inside the entrance.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const along = (face === "n" || face === "s") ? x : z;
  const corner = cornerOf(x, z);
  const pier = corner || along % 3 === 0;
  if (pier) continue;

  const [ix, iz] = {
    n: [x, z + 1], s: [x, z - 1], w: [x + 1, z], e: [x - 1, z],
  }[face];
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  if (gr > 7) continue;

  if (((x * 7 + z * 13) % 5) === 0) {
    g.set(ix, 7, iz, "glowstone");
  }
}

if (entranceX >= 0) {
  const ez = 0;
  // Find the north-face cell at entranceX and light the interior cell behind the door.
  for (const [key, gr] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (x === entranceX && exposed(x, z).n) {
      if (has(x, z + 1) && !isPerim(x, z + 1) && gr + 2 <= 4) {
        g.set(x, 4, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Pass 3: rooftop water tank on a 3x3 interior footprint, if it fits.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let tankFits = true;
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!has(x, z) || isPerim(x, z)) tankFits = false;
  }
}
if (tankFits) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      for (let y = PARAPET; y <= PARAPET + 2; y++) g.set(x, y, z, "oak_planks");
      g.set(x, PARAPET + 3, z, "oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
