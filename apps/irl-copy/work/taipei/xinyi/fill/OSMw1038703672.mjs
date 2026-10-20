import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703672";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 18, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const gmin = Math.min(...ground.values());

// Storey plan (absolute y, relative to lowest ground):
//  ground floor  gmin .. gmin+4   (shopfront)
//  storey line   gmin+5
//  upper floor   gmin+6 .. gmin+9 (window band)
//  roof slab     T = gmin+10 (roof surface at gmin+11, ~11 blocks above lowest ground)
const T = gmin + 10;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces: direction to neighbour, outward normal
const SIDES = [
  { n: "N", dx: 0, dz: -1 },
  { n: "S", dx: 0, dz: 1 },
  { n: "W", dx: -1, dz: 0 },
  { n: "E", dx: 1, dz: 0 },
];

// Facade material by height r above gmin and position along the face
function facade(r, along, side) {
  if (r === 0) return "stone_bricks";                       // base course
  if (r <= 4) {                                              // shopfront
    if (side.n === "S" && along === 9 && (r === 1 || r === 2)) return "DOOR";
    if (r === 3 && side.n === "S" && along >= 6 && along <= 12) return "red_terracotta"; // awning
    if (r === 4) return "smooth_quartz";                     // fascia
    if (along % 3 === 0) return "smooth_quartz";             // pilasters
    return "glass";
  }
  if (r === 5) return "smooth_quartz";                       // storey line
  if (r >= 6 && r <= 8) {                                    // window band
    return along % 3 === 1 ? "light_blue_stained_glass_pane" : "white_concrete";
  }
  if (r === 9) return "smooth_quartz";                       // cornice
  return "white_concrete";
}

// 1. Foundations, interior floors, roof slab
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const start = Math.max(gr, gmin);
  for (let y = 0; y < start; y++) put(x, y, z, "stone_bricks");   // solid up to ground
  if (gmin + 5 >= start) put(x, gmin + 5, z, "light_gray_concrete"); // storey floor
  if (T >= start) put(x, T, z, "gray_concrete");                   // roof slab
}

// 2. Exterior walls, doors, lights behind glass
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const start = Math.max(gr, gmin);
  for (const side of SIDES) {
    if (ground.has(key(x + side.dx, z + side.dz))) continue; // not exterior
    const along = side.dx !== 0 ? z : x;
    for (let y = start; y <= T - 1; y++) {
      const r = y - gmin;
      const blk = facade(r, along, side);
      if (blk === "DOOR") {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, blk);
      }
    }
    // Warm light behind the glass (interior cell opposite the face)
    const ix = x - side.dx, iz = z - side.dz;
    if (ground.has(key(ix, iz))) {
      const istart = Math.max(ground.get(key(ix, iz)), gmin);
      if (along % 6 === 1 && 7 >= istart + 0 && T - 1 >= 7) {
        put(ix, gmin + 7, iz, "glowstone");                   // upper window light
      }
      if (along % 6 === 2 && 2 >= 0 && istart <= gmin + 2) {
        put(ix, gmin + 2, iz, "lantern");                      // shopfront light
      }
    }
  }
  // Parapet coping on the roof edge
  if (T >= start) {
    for (const side of SIDES) {
      if (!ground.has(key(x + side.dx, z + side.dz))) {
        put(x, T, z, "smooth_quartz");
        break;
      }
    }
  }
}

// 3. Rooftop plant: a small stone-clad equipment box with a cap
for (let x = 6; x <= 8; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!ground.has(key(x, z))) continue;
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
    put(x, T + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
