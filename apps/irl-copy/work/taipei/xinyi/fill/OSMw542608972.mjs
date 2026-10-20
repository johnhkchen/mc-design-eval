import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw542608972: unrecorded low-rise commercial block, Xinyi, two storeys over
// a stone plinth, white concrete frame, glazed shopfront, flat roof with parapet
// and a small plant room. Roof slab top sits 11 blocks above the lowest ground.
const CELLS_PATH = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608972.cells.json";
const OUT_PATH = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608972.nbt";

const cells = JSON.parse(readFileSync(CELLS_PATH, "utf8"));
const W = 14, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function s(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const glassX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pre-compute exterior faces
const info = new Map();
for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1), E = !has(x + 1, z), Wf = !has(x - 1, z);
  info.set(`${x},${z}`, { x, z, G: gr, N, S, E, W: Wf, ext: N || S || E || Wf });
}

// Entrance: north-face cell closest to the middle of the front
let door = null;
for (const c of info.values()) {
  if (!c.N) continue;
  if (!door || Math.abs(c.x - 7) < Math.abs(door.x - 7)) door = c;
}

// 1. Foundation, floor slabs, roof
for (const c of info.values()) {
  const { x, z, G, ext } = c;
  for (let y = 0; y < G; y++) s(x, y, z, "stone_bricks");
  s(x, G, z, ext ? "stone_bricks" : "smooth_stone");          // plinth / ground slab
  s(x, G + 5, z, "smooth_stone");                              // storey floor slab
  s(x, G + 10, z, ext ? "white_concrete" : "gray_concrete");   // roof slab and parapet ring
}

// 2. Walls
for (const c of info.values()) {
  if (!c.ext) continue;
  const { x, z, G } = c;
  const alongX = c.N || c.S;
  const i = alongX ? x : z;
  const gp = alongX ? glassX : glassZ;
  const isDoor = door && door.x === x && door.z === z;

  // Ground storey: G+1 .. G+4
  for (let y = G + 1; y <= G + 4; y++) {
    if (y === G + 4) { s(x, y, z, "white_concrete"); continue; }   // lintel band
    if (isDoor && y <= G + 2) continue;                              // door placed below
    if (y === G + 3 && isDoor) { s(x, y, z, "glass_pane", gp); continue; }
    if (i % 4 === 0) s(x, y, z, "white_concrete");                    // shopfront pillars
    else s(x, y, z, "glass_pane", gp);
  }
  if (isDoor) {
    s(x, G + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    s(x, G + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Upper storey: G+6 .. G+9
  for (let y = G + 6; y <= G + 9; y++) {
    if (y === G + 9) { s(x, y, z, "white_concrete"); continue };       // spandrel band
    if (i % 3 === 1) s(x, y, z, "glass_pane", gp);
    else s(x, y, z, "white_concrete");
  }
}

// 3. Warm lights behind glass, placed on the interior floor next to windows
for (const c of info.values()) {
  if (!c.ext) continue;
  const { x, z, G } = c;
  const alongX = c.N || c.S;
  const i = alongX ? x : z;
  let ix = x, iz = z;
  if (c.N) iz = z + 1;
  else if (c.S) iz = z - 1;
  else if (c.W) ix = x + 1;
  else if (c.E) ix = x - 1;
  const inner = info.get(`${ix},${iz}`);
  if (!inner || inner.ext) continue;
  if (door && door.x === x && door.z === z) continue;
  if (i % 4 === 2) s(ix, G + 1, iz, "glowstone");          // shop interior
  if (i % 6 === 1) s(ix, G + 6, iz, "glowstone");          // upper office behind window
}

// 4. Roof plant room on interior roof
for (const c of info.values()) {
  if (c.ext) continue;
  if (c.x >= 4 && c.x <= 6 && c.z >= 7 && c.z <= 9) {
    s(c.x, c.G + 11, c.z, "light_gray_concrete");
    s(c.x, c.G + 12, c.z, "light_gray_concrete");
  }
}

g.save(OUT_PATH);
