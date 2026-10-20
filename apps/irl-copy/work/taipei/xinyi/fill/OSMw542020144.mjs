import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020144";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Span of footprint in each axis
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a perimeter cell
function outs(x, z) {
  const r = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inF(x + dx, z + dz)) r.push(name);
  }
  return r;
}

// Front face: the face with the most exposed cells; prefer south, north, east, west on ties
const counts = { north: 0, south: 0, east: 0, west: 0 };
for (const [x, z] of cells) for (const d of outs(x, z)) counts[d]++;
const pref = ["south", "north", "east", "west"];
let front = pref[0];
for (const d of pref) if (counts[d] > counts[front]) front = d;

const centerX = Math.floor((minX + maxX) / 2);
const centerZ = Math.floor((minZ + maxZ) / 2);

// A face-cell sits on a pier if it is a corner or on the 3-bay grid
function pierOn(x, z, d) {
  const alongX = d === "north" || d === "south";
  const u = alongX ? x : z;
  const lo = alongX ? minX : minZ;
  const hi = alongX ? maxX : maxZ;
  const i = u - lo;
  return i % 3 === 0 || u === hi;
}
function isPier(x, z, o) {
  if (o.length >= 2) return true;
  return o.some((d) => pierOn(x, z, d));
}

// Pass 1: foundation, floor slabs, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr + 1, z, "smooth_stone");   // ground floor slab
  put(x, gr + 6, z, "smooth_stone");   // second floor slab
  const o = outs(x, z);
  put(x, gr + 11, z, o.length ? "smooth_quartz" : "light_gray_concrete"); // parapet / roof deck
}

// Pass 2: facade on perimeter cells, rel = height above cell ground
const lights = [];
for (const [x, z, gr] of cells) {
  const o = outs(x, z);
  if (!o.length) continue;
  const pier = isPier(x, z, o);
  const face = o[0];
  const alongX = face === "north" || face === "south";
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Door column on the front face, centre bay
  const isDoorCell =
    o.includes(front) &&
    !pier &&
    (front === "north" || front === "south" ? x === centerX : z === centerZ);

  // Ground storey
  put(x, gr + 2, z, isDoorCell ? "dark_oak_door" : "stone_bricks",
    isDoorCell ? { facing: front, half: "lower", hinge: "left", open: "false", powered: "false" } : undefined);
  if (isDoorCell) {
    put(x, gr + 3, z, "dark_oak_door", { facing: front, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 4, z, "glass_pane", paneProps);
  } else {
    put(x, gr + 3, z, pier ? "quartz_block" : "glass_pane", pier ? undefined : paneProps);
    put(x, gr + 4, z, pier ? "quartz_block" : "glass_pane", pier ? undefined : paneProps);
  }
  put(x, gr + 5, z, "quartz_block"); // lintel / storey line

  // Upper storey
  put(x, gr + 7, z, pier ? "quartz_block" : "white_concrete"); // sill / pier
  put(x, gr + 8, z, pier ? "quartz_block" : "glass_pane", pier ? undefined : paneProps);
  put(x, gr + 9, z, pier ? "quartz_block" : "glass_pane", pier ? undefined : paneProps);
  put(x, gr + 10, z, "smooth_quartz"); // cornice band

  // Warm light behind selected windows (inside the shell)
  const u = alongX ? x : z;
  const lo = alongX ? minX : minZ;
  const i = u - lo;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!pier && !isDoorCell && inF(ix, iz)) {
    if (i % 6 === 2) lights.push([ix, gr + 8, iz, "shroomlight"]);
    if (i % 6 === 4) lights.push([ix, gr + 3, iz, "glowstone"]);
  }
}
for (const [x, y, z, id] of lights) put(x, y, z, id);

// Pass 3: roof plant on interior roof deck
for (const [x, z, gr] of cells) {
  if (outs(x, z).length) continue;
  if (x % 4 === 2 && z % 4 === 1 && gr + 12 < H) {
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
