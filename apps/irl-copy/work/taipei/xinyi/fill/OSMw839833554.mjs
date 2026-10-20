import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 19 x 24 footprint, roof ~11 blocks above lowest ground.
// Read as a 1970s-80s Xinyi-style mid-rise commercial block (two storeys of
// about 5 blocks each, a tiled-concrete cornice, parapet, shopfront at street level).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833554";
const W = 19, H = 23, D = 24;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const MAX_G = H - 12; // roof parapet must stay inside the volume

const cols = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of raw) {
  cols.set(key(x, z), { x, z, g: Math.min(Math.max(Math.round(gr), 0), MAX_G) });
}
const has = (x, z) => cols.has(key(x, z));
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const outs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint classification
const cellList = [...cols.values()];
const perimeter = new Set();
for (const c of cellList) if (outs(c.x, c.z).length > 0) perimeter.add(key(c.x, c.z));

// Entrance: street-facing (north, z-min) perimeter cell nearest the footprint's centre x
const xs = cellList.map((c) => c.x);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const c of cellList) {
  const o = outs(c.x, c.z);
  if (o.length !== 1) continue;
  const north = o[0][0] === 0 && o[0][1] === -1;
  if (!north) continue;
  if (!door || Math.abs(c.x - cx) < Math.abs(door.x - cx)) door = { ...c, o };
}
if (!door) {
  for (const c of cellList) {
    const o = outs(c.x, c.z);
    if (o.length === 1 && (!door || Math.abs(c.x - cx) < Math.abs(door.x - cx))) door = { ...c, o };
  }
}
const doorKey = door ? key(door.x, door.z) : null;

// 1. Foundation, floor slabs and roof deck over every column
for (const c of cellList) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  // ground floor is g..g+4, slab g+5, upper floor g+6..g+9, roof deck g+10
  put(c.x, c.g + 5, c.z, "light_gray_concrete");
  put(c.x, c.g + 10, c.z, "light_gray_concrete");
}

// 2. Perimeter walls, shopfronts, window grids, cornice and parapet
for (const c of cellList) {
  if (!perimeter.has(key(c.x, c.z))) continue;
  const o = outs(c.x, c.z);
  const corner = o.length >= 2;
  const wallAlongX = !corner && o[0][0] === 0;
  const along = corner ? 0 : (wallAlongX ? c.x : c.z);
  const bay = along % 3;
  const isPier = corner || bay === 0;
  const gl = c.g;
  const paneProps = wallAlongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // base course
  put(c.x, gl, c.z, "polished_andesite");
  // ground floor (shopfront)
  for (let y = gl + 1; y <= gl + 4; y++) {
    if (y === gl + 4) put(c.x, y, c.z, "white_concrete");
    else if (isPier) put(c.x, y, c.z, "white_concrete");
    else put(c.x, y, c.z, "glass_pane", paneProps);
  }
  // string course at slab level
  put(c.x, gl + 5, c.z, "white_concrete");
  // upper floor window band
  for (let y = gl + 6; y <= gl + 9; y++) {
    if (isPier) put(c.x, y, c.z, "white_concrete");
    else if (y === gl + 6 || y === gl + 9) put(c.x, y, c.z, "white_concrete");
    else put(c.x, y, c.z, "cyan_stained_glass_pane", paneProps);
  }
  // cornice and parapet
  put(c.x, gl + 10, c.z, "white_concrete");
  put(c.x, gl + 11, c.z, "white_concrete");
}

// 3. Entrance: door, lintel
if (door) {
  const f = FACING[`${door.o[0][0]},${door.o[0][1]}`];
  put(door.x, door.g + 1, door.z, "oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 2, door.z, "oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 3, door.z, "white_concrete");
  put(door.x, door.g + 4, door.z, "white_concrete");
}

// 4. Warm lights in some windows: glowstone behind the glass on interior cells
for (const c of cellList) {
  if (!perimeter.has(key(c.x, c.z))) continue;
  const o = outs(c.x, c.z);
  if (o.length !== 1) continue;
  const [dx, dz] = o[0];
  const wallAlongX = dz !== 0;
  const along = wallAlongX ? c.x : c.z;
  if (along % 3 === 0) continue;
  const ix = c.x - dx, iz = c.z - dz;
  if (!has(ix, iz) || perimeter.has(key(ix, iz))) continue;
  if ((along * 7 + c.x * 3 + c.z) % 4 === 0) put(ix, c.g + 7, iz, "glowstone");
  else if ((along * 5 + c.z) % 7 === 0) put(ix, c.g + 2, iz, "glowstone");
}

// 5. Roof: a few mechanical units and a small plant block on the deck
for (const c of cellList) {
  if (perimeter.has(key(c.x, c.z))) continue;
  if (c.x % 6 === 3 && c.z % 6 === 3) put(c.x, c.g + 11, c.z, "iron_block");
  else if (c.x % 6 === 1 && c.z % 6 === 4) put(c.x, c.g + 11, c.z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
