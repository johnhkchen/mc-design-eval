import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block, c. 1990s: two storeys of 5 blocks,
// white tiled facade, smooth-quartz storey bands, tinted glazing in grey
// concrete frames, shopfront on the ground floor, and a plant box on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457997";
const W = 17, H = 23, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let lowest = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  lowest = Math.min(lowest, gr);
}

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [
  { d: "north", dx: 0, dz: -1, axis: "z" },
  { d: "south", dx: 0, dz: 1, axis: "z" },
  { d: "west", dx: -1, dz: 0, axis: "x" },
  { d: "east", dx: 1, dz: 0, axis: "x" },
];
const has = (x, z) => ground.has(`${x},${z}`);
const facesOf = (x, z) => DIRS.filter((o) => !has(x + o.dx, z + o.dz));
const baseOf = (gr) => Math.max(lowest + 1, gr + 1);

const pane = (face) =>
  face.axis === "z"
    ? ["light_blue_stained_glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }]
    : ["light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

// Facade block for an exposed cell at height rel above the floor level b.
function facadeAt(rel, u, corner, face) {
  if (rel >= 1 && rel <= 4) {
    if (corner || u % 4 === 0) return ["white_concrete"];
    if (rel === 4) return ["gray_concrete"];
    return pane(face);
  }
  if (rel >= 6 && rel <= 9) {
    if (corner || u % 3 === 0) return ["white_concrete"];
    if (rel === 6 || rel === 9) return ["gray_concrete"];
    return pane(face);
  }
  return null;
}

for (const [x, z, gr] of cells) {
  const b = baseOf(gr);
  const fc = facesOf(x, z);
  const edge = fc.length > 0;
  const corner = new Set(fc.map((f) => f.axis)).size === 2;

  // Foundation up to the floor level.
  for (let y = 0; y < b - 1; y++) put(x, y, z, edge ? "stone_bricks" : "stone");
  put(x, b - 1, z, edge ? "smooth_stone" : "stone");

  // Floor slabs (edge cells double as storey bands and cornice).
  put(x, b, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, b + 5, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, b + 10, z, edge ? "smooth_quartz" : "gray_concrete");

  if (!edge) continue;

  const prim = fc.find((f) => f.axis === "z") ?? fc[0];
  const u = prim.axis === "z" ? x : z;

  for (const rel of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const [id, props] = facadeAt(rel, u, corner, prim).length === 2
      ? facadeAt(rel, u, corner, prim)
      : [facadeAt(rel, u, corner, prim)[0]];
    put(x, b + rel, z, id, props);
  }

  // Lamps glowing in the air gap behind some windows.
  const ix = x - prim.dx, iz = z - prim.dz;
  const inwardInterior = has(ix, iz) && facesOf(ix, iz).length === 0;
  if (inwardInterior && !corner) {
    if (u % 8 === 2) put(ix, b + 2, iz, "shroomlight");
    if (u % 6 === 2) put(ix, b + 7, iz, "glowstone");
  }

  // Parapet cap on the exposed edge.
  put(x, b + 11, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

// Entrance: on the north (street) side, nearest the middle of the front.
{
  const front = cells.filter(([x, z]) => facesOf(x, z).some((f) => f.d === "north"));
  const pool = front.length ? front : cells.filter(([x, z]) => facesOf(x, z).length > 0);
  pool.sort((a, b) => Math.abs(a[0] - 8) - Math.abs(b[0] - 8));
  if (pool.length) {
    const [x, z, gr] = pool[0];
    const b = baseOf(gr);
    const face = facesOf(x, z)[0];
    const facing = face.d;
    put(x, b + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "light_blue_stained_glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
    const ix = x - face.dx, iz = z - face.dz;
    if (has(ix, iz) && facesOf(ix, iz).length === 0) {
      put(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof plant box, set back in the middle of the roof.
for (const [x, z, gr] of cells) {
  if (x < 5 || x > 11 || z < 10 || z > 18) continue;
  if (facesOf(x, z).length > 0) continue;
  const b = baseOf(gr);
  put(x, b + 11, z, "light_gray_concrete");
  put(x, b + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
