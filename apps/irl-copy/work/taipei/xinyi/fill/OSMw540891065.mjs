import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891065.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891065.nbt";

const W = 14, H = 23, D = 12;
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground (rounded), y0 = lowest ground under the footprint.
const cellMap = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const minG = Math.min(...cellMap.values());

const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward directions: [dx, dz, facing name]
const dirs = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

// Exterior faces per footprint cell.
const facesOf = (x, z) =>
  Object.keys(dirs).filter(k => {
    const [dx, dz] = dirs[k];
    return !has(x + dx, z + dz);
  });

// Storey plan relative to building base b (= cell ground - y0):
// k0 floor slab, k1 base course, k2-k4 ground floor shopfront band,
// k5 storey belt, k6-k9 upper floor, k10 roof slab/cornice, k11 parapet,
// k12-k13 roof plant.
const cells = [...cellMap.entries()].map(([key, gr]) => {
  const [x, z] = key.split(",").map(Number);
  return { x, z, b: gr - minG, faces: facesOf(x, z) };
});

// 1) Foundations, floor slabs, walls, and roof for every footprint cell.
for (const c of cells) {
  const { x, z, b, faces } = c;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < b; y++) set(x, y, z, "stone_bricks");

  // Ground slab and interior floor/roof slabs.
  set(x, b, z, "smooth_stone");
  set(x, b + 5, z, "smooth_quartz");
  set(x, b + 10, z, "smooth_quartz");

  if (faces.length === 0) {
    // Interior cell: rooftop plant boxes on a few cells.
    if (x % 5 === 2 && z % 4 === 1) {
      set(x, b + 11, z, "light_gray_concrete");
      set(x, b + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell.
  const primary = faces[0];
  const isNS = primary === "N" || primary === "S";
  const corner = faces.length >= 2;
  const pillar = corner || (isNS && x % 3 === 0) || (!isNS && z % 3 === 0);
  const paneProps = isNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let k = 1; k <= 11; k++) {
    const y = b + k;
    if (k === 5 || k === 10) {
      set(x, y, z, "quartz_block");                       // storey belt and cornice
    } else if (k === 11) {
      set(x, y, z, "smooth_quartz");                      // parapet
    } else if (pillar) {
      set(x, y, z, "quartz_pillar", { axis: "y" });       // structural piers
    } else if (k === 1) {
      set(x, y, z, "smooth_stone");                       // base course
    } else if (k === 4 || k === 9) {
      set(x, y, z, "quartz_block");                       // lintels
    } else if (k === 6) {
      set(x, y, z, "white_terracotta");                   // sill course
    } else if (k === 2 || k === 3 || k === 7 || k === 8) {
      // Window band: glass panes with frames; a few lit windows.
      const lit = (x + z + k) % 7 === 0;
      if (lit) set(x, y, z, "glowstone");
      else set(x, y, z, "light_gray_stained_glass_pane".replace("light_gray_stained_glass_pane", "gray_stained_glass_pane"), paneProps);
    } else {
      set(x, y, z, "white_terracotta");
    }
  }
}

// 2) Entrance: front face is north (lowest z) if available.
const perimeter = cells.filter(c => c.faces.length > 0);
let candidates = perimeter.filter(c => c.faces.includes("N") && c.faces.length === 1);
let face = "N";
if (candidates.length === 0) {
  candidates = perimeter.filter(c => c.faces.length === 1);
  face = candidates.length ? candidates[0].faces[0] : "N";
}
if (candidates.length) {
  candidates.sort((a, b) => a.x - b.x);
  const door = candidates[Math.floor(candidates.length / 2)];
  const facing = dirs[face][2];
  const { x, z, b } = door;
  // Door pair at k1-k2 with a hanging lantern above at k3.
  set(x, b + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, b + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  set(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(OUT);
