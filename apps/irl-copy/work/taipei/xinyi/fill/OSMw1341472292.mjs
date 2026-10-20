import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341472292";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 39. Low commercial block (one storey plus a tall shopfront band),
// cream tiled facade with stone base, glass shopfront, upper window band, flat roof.
const W = 20, H = 19, D = 39;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map(c => c[2]));
const B = new Map(); // "x,z" -> foundation top offset (ground minus lowest ground)
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) B.set(`${x},${z}`, gr - minG);
}
const inside = (x, z) => B.has(`${x},${z}`);
const bAt = (x, z) => B.get(`${x},${z}`);

// outward normals, checked in order (west first so the long west face reads as the front)
const DIRS = [
  [-1, 0, "west"],
  [1, 0, "east"],
  [0, -1, "north"],
  [0, 1, "south"],
];
function exteriorOf(x, z) {
  for (const [dx, dz, name] of DIRS) {
    if (!inside(x + dx, z + dz)) return { dx, dz, name };
  }
  return null;
}

const set = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- main shell ----
for (const [key, b] of B) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorOf(x, z);

  // foundation (solid from y 0 up to this cell's ground) and floor/base course at ground
  for (let y = 0; y < b; y++) set(x, y, z, "stone_bricks");
  set(x, b, z, ext ? "stone_bricks" : "smooth_stone");

  const top = Math.max(7, b);
  for (let y = b + 1; y <= top; y++) {
    if (!ext) {
      // interior: storey slab, roof deck, otherwise air (no interiors)
      if (y === 3) set(x, y, z, "smooth_stone");
      else if (y === 6) set(x, y, z, "gray_concrete");
      continue;
    }

    const t = (ext.name === "west" || ext.name === "east") ? z : x;
    const pier = t % 3 === 0;

    if (y <= 2) {
      // shopfront zone
      set(x, y, z, pier ? "quartz_pillar" : "glass_pane");
    } else if (y === 3) {
      // storey line / fascia
      set(x, y, z, "smooth_stone");
    } else if (y === 4 || y === 5) {
      // upper window band with quartz mullions
      set(x, y, z, pier ? "quartz_pillar" : "glass_pane");
      // warm light behind some upper windows (air gap inside, then glowstone)
      if (y === 4 && !pier && t % 6 === 2) {
        const ix = x - ext.dx, iz = z - ext.dz;
        if (inside(ix, iz) && bAt(ix, iz) < 4) set(ix, 4, iz, "glowstone");
      }
    } else if (y === 6) {
      // cornice band
      set(x, y, z, "stone_bricks");
    } else if (y === 7) {
      // parapet
      set(x, y, z, "stone_bricks");
    }
  }
}

// ---- roof equipment (only where the roof deck exists) ----
function box(x0, x1, z0, z1, y0, y1, id) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++)
        if (inside(x, z) && bAt(x, z) <= 6) set(x, y, z, id);
}
box(4, 6, 6, 8, 7, 7, "light_gray_concrete");
box(4, 6, 6, 8, 8, 8, "iron_bars");
box(12, 14, 28, 30, 7, 7, "light_gray_concrete");
box(12, 14, 28, 30, 8, 8, "iron_bars");
if (inside(10, 19) && bAt(10, 19) <= 6) {
  set(10, 7, 19, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// ---- entrance door on the front (west) face, at the lowest reachable ground ----
let best = null;
for (const [key, b] of B) {
  if (b > 1) continue;
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorOf(x, z);
  if (!ext) continue;
  const score = (ext.name === "west" ? 0 : 10) + Math.abs(z - 19) + b * 2;
  if (!best || score < best.score) best = { x, z, b, ext, score };
}
if (best) {
  const y0 = best.b + 1;
  const facing = best.ext.name;
  set(best.x, y0, best.z, "iron_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  set(best.x, y0 + 1, best.z, "iron_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
