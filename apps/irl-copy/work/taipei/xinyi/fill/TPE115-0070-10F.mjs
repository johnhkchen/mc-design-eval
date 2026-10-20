import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE115-0070-10F: 2026 two-storey commercial block, Xinyi district.
// White-tiled, glazed low-rise with a granite plinth, stone cornice,
// stone-capped parapet, pilasters every eighth bay and a stone entrance canopy.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE115-0070-10F";
const W = 52, H = 25, D = 16;
const TOP_OFFSET = 12; // parapet cap block sits 12 above lowest ground: 13 blocks tall

const RAW = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(RAW) ? RAW : (RAW.cells ?? []);

const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c)
    ? c
    : [c.x, c.z, c.ground ?? c.g ?? c.y ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("zmin");
  if (!has(x, z + 1)) f.push("zmax");
  if (!has(x - 1, z)) f.push("xmin");
  if (!has(x + 1, z)) f.push("xmax");
  return f;
};
const isPerim = (x, z) => facesOf(x, z).length > 0;

let minG = Math.min(...ground.values());
if (!Number.isFinite(minG)) minG = 0;
const TOP = minG + TOP_OFFSET;

const xs = [...ground.keys()].map((k) => +k.split(",")[0]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const mid = Math.floor((minX + maxX) / 2);

const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const glassPane = (axis) =>
  axis === "z"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floors, walls, roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > TOP) continue;

  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;

    if (!perim) {
      if (y === gr) put(x, y, z, "smooth_stone");                       // interior floor
      else if (rel === 5 || rel === 10) put(x, y, z, "gray_concrete");   // floor / roof slab
      else if (rel === 11 && (x % 10 === 3 || x % 10 === 4) && (z % 8 === 3 || z % 8 === 4))
        put(x, y, z, "smooth_quartz");                                   // rooftop plant boxes
      continue;
    }

    // Perimeter
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }        // plinth
    if (rel === 5) { put(x, y, z, "white_concrete"); continue; }         // storey belt course
    if (rel === 10) { put(x, y, z, "polished_andesite"); continue; }     // cornice
    if (rel === 11) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (rel === 12) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }

    // Glazing zone (rel 1..4 and 6..9)
    if (corner) { put(x, y, z, "light_gray_concrete"); continue; }

    const face = faces[0];
    const axis = face.startsWith("z") ? "z" : "x";
    const a = axis === "z" ? x : z;

    // Entrance canopy lintel over the door
    if (face === "zmin" && a >= mid - 2 && a <= mid + 1 && y === gr + 3) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    // Pilasters every eighth bay, ordinary mullions every fourth
    if (a % 8 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    if (a % 4 === 0) { put(x, y, z, "white_concrete"); continue; }

    // Entrance doors
    if (face === "zmin" && (a === mid - 1 || a === mid) && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: a === mid - 1 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }

    put(x, y, z, "glass_pane", glassPane(axis));
  }
}

// Pass 2: warm lights set just inside some window bays
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr > TOP) continue;
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const axis = face.startsWith("z") ? "z" : "x";
  const a = axis === "z" ? x : z;
  if (a % 8 !== 2 || a % 4 === 0) continue;

  let ix = x, iz = z;
  if (face === "zmin") iz = z + 1;
  else if (face === "zmax") iz = z - 1;
  else if (face === "xmin") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  const igr = gAt(ix, iz);
  for (const rel of [2, 7]) {
    const y = rel + minG;
    if (y < igr) continue;
    put(ix, y, iz, rel === 2 ? "glowstone" : "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
