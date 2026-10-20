import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807429";
const W = 31, H = 23, D = 30;

// Footprint: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z] of cells) {
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Deterministic pseudo-random 0..1 from coordinates
const hash = (a, b, c) => {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h >>> 0) % 1000) / 1000;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Storey levels (absolute, relative to lowest ground y=0):
// ground floor slab at each cell's ground, storey-1 windows y g+1..4,
// storey line at 5, storey-2 windows 6..9, roof slab 10, parapet 11.
const SLAB_MID = 5, ROOF = 10, PARAPET = 11;

for (const [x, z, gr] of cells) {
  const gg = gnd(x, z);
  const N = !has(x, z - 1), S = !has(x, z + 1), Wx = !has(x - 1, z), E = !has(x + 1, z);
  const edge = N || S || Wx || E;
  const corner = (N || S) && (Wx || E);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // Floor slabs for every footprint cell
  put(x, gg, z, edge ? "stone_bricks" : "smooth_quartz");
  if (SLAB_MID >= gg) put(x, SLAB_MID, z, "smooth_quartz");
  if (ROOF >= gg) put(x, ROOF, z, "smooth_quartz");

  if (!edge) {
    // Interior: air gap, only glowstone lights set just inside the glass
    continue;
  }

  // Facade: which face the cell is on, and along which axis it runs
  const alongX = N || S;
  const t = alongX ? x : z;
  const pier = corner || (t % 4 === 0);

  // Entrance on the front (min z) face, centred
  const entrance = (z === minZ) && Math.abs(x - cx) <= 1;

  const band = (y) => {
    if (y <= gg || y >= PARAPET) return;
    if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (alongX) {
      put(x, y, z, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else {
      put(x, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    }
  };

  // Storey 1 (shopfront band)
  for (let y = gg + 1; y <= 4; y++) band(y);
  // Storey line / spandrel
  if (SLAB_MID > gg) put(x, SLAB_MID, z, "smooth_quartz");
  // Storey 2
  for (let y = 6; y <= 9; y++) if (y > gg) band(y);
  // Cornice and parapet
  if (ROOF >= gg) put(x, ROOF, z, pier ? "smooth_quartz" : "quartz_slab", pier ? undefined : { type: "bottom", waterlogged: "false" });
  put(x, PARAPET, z, corner ? "quartz_pillar" : "smooth_quartz", corner ? { axis: "y" } : undefined);
  if (!corner && t % 2 === 0) put(x, PARAPET, z, "white_concrete");

  // Entrance: glass opening, lanterns and canopy on the front row
  if (entrance) {
    for (let y = gg + 1; y <= gg + 3; y++) put(x, y, z, "glass");
    put(x, gg + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm lights behind some storey windows (interior cell one step inward)
  if (!pier && !entrance) {
    const ix = N ? 0 : S ? 0 : Wx ? 1 : -1;
    const iz = N ? 1 : S ? -1 : 0;
    const inx = x + ix, inz = z + iz;
    if (has(inx, inz) && hash(x, z, 7) > 0.45) {
      for (const y of [2, 3, 7, 8]) {
        if (y > gg && hash(x, y, z) > 0.55) put(inx, y, inz, "glowstone");
      }
    }
  }
}

// Entrance lanterns hung just inside the front doorway
for (const [x, z] of cells) {
  if (z === minZ + 1 && Math.abs(x - cx) <= 1) {
    const gg = gnd(x, z);
    put(x, gg + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant room in the centre of the roof
for (const [x, z] of cells) {
  const gg = gnd(x, z);
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (edge || gg > ROOF) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) {
    put(x, PARAPET, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      put(x, PARAPET + 1, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
