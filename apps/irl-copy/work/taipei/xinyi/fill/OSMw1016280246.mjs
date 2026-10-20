import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280246";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 33, D = 20;
const ROOF = 21;              // roof level above lowest ground (lidar)
const g = new Voxels([W, H, D]);

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());
const gy = (x, z) => ground.get(`${x},${z}`) - minG;

// outward faces of a footprint cell (neighbour missing)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade along north/south runs in x; along east/west runs in z.
const alongX = (fs) => fs.includes("north") || fs.includes("south");
const paneProps = (fs) => alongX(fs)
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

// Choose the entrance: on a west-facing wall, nearest the middle of the 20-block length.
let entrance = null;
{
  const cand = [];
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    const fs = faces(x, z);
    if (fs.length) cand.push({ x, z, fs });
  }
  const west = cand.filter((c) => c.fs.includes("west"));
  const pool = west.length ? west : cand;
  pool.sort((a, b) => Math.abs(a.z - 10) - Math.abs(b.z - 10));
  if (pool.length) {
    const c = pool[0];
    const face = c.fs.includes("west") ? "west" : c.fs[0];
    entrance = { x: c.x, z: c.z, face, idx: face === "west" || face === "east" ? c.z : c.x };
  }
}

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gy(x, z);
  const fs = faces(x, z);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (fs.length === 0) {
    // interior cell: floor slabs per storey and roof, air between (no interiors)
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y % 5 === 0 || y === ROOF) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // perimeter cell
  const idx = alongX(fs) ? x : z;
  const pane = paneProps(fs);

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }
    const k = Math.floor(y / 5);
    const r = y % 5;
    if (r === 0) {
      put(x, y, z, k === 0 ? "stone_bricks" : "smooth_quartz");   // base course / storey line
    } else if (r === 4) {
      put(x, y, z, "smooth_quartz");                               // sill / spandrel
    } else if (k === 0) {
      // ground-floor shopfront
      if (idx % 3 === 0) put(x, y, z, "stone_bricks");
      else if ((idx + y) % 5 === 1) put(x, y, z, "glowstone");     // warm shop light
      else put(x, y, z, "glass");
    } else {
      // upper storeys: piers and window panes
      if (idx % 2 === 0) put(x, y, z, "white_concrete");
      else if ((x * 3 + z * 5 + y) % 9 === 0) put(x, y, z, "glowstone"); // lit window
      else put(x, y, z, "light_blue_stained_glass_pane", pane);
    }
  }

  // parapet cap on the perimeter
  put(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// roof plant: small penthouse on interior roof cells near the centre
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (faces(x, z).length === 0 && x >= 2 && x <= 4 && z >= 8 && z <= 11) {
    put(x, ROOF + 1, z, "stone_bricks");
    put(x, ROOF + 2, z, "stone_bricks");
    put(x, ROOF + 3, z, "iron_bars");
  }
}

// entrance: double door, canopy lintel across the entrance bay (written last)
if (entrance) {
  const { x: ex, z: ez, face } = entrance;
  const gr = gy(ex, ez);
  const doorBase = { facing: face, hinge: "left", open: "false", powered: "false" };
  put(ex, gr, ez, "oak_door", { ...doorBase, half: "lower" });
  put(ex, gr + 1, ez, "oak_door", { ...doorBase, half: "upper" });

  // canopy lintel over the bay: entrance cell and its same-face neighbours
  const along = face === "west" || face === "east" ? "z" : "x";
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (!faces(x, z).includes(face)) continue;
    const near = along === "z" ? Math.abs(z - ez) <= 1 && x === ex
                               : Math.abs(x - ex) <= 1 && z === ez;
    if (near) put(x, gy(x, z) + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
