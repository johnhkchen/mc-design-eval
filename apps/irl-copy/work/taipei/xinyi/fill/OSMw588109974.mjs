import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unnamed Xinyi commercial block, c. 1990s: four storeys over a stone base, white tiled piers,
// blue-tinted glazing, a shopfront ground floor, a light-grey cornice and parapet, and a
// rooftop plant room. Roof top sits at local y 21 (ROOF = 20 is the last roof block).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109974";
const W = 19, H = 33, D = 85;
const ROOF = 20;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...cells.map((c) => c[2]));

const key = (x, z) => `${x},${z}`;
const gr = new Map();
for (const [x, z, g] of cells) gr.set(key(x, z), g - base);

const has = (x, z) => gr.has(key(x, z));
const groundOf = (x, z) => gr.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

const outSides = (x, z) =>
  Object.keys(DIRS).filter(([d]) => false || !has(x + DIRS[d][0], z + DIRS[d][1]));
const isEdge = (x, z) => outSides(x, z).length > 0;

// Facade face: prefer N/S (wall running along x), otherwise E/W.
const faceOf = (x, z) => {
  const out = Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
  if (out.includes("N")) return "N";
  if (out.includes("S")) return "S";
  return out[0];
};

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: columns for every footprint cell.
for (const [k, gl] of gr) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);
  const face = edge ? faceOf(x, z) : null;
  const idx = face === "N" || face === "S" ? x : z;
  const pier = idx % 3 === 0;

  // Foundation under the lowest ground.
  for (let y = 0; y < gl; y++) put(x, y, z, "stone_bricks");

  for (let y = gl; y <= ROOF; y++) {
    const rel = y - gl;
    const r = rel % STOREY;
    const k2 = Math.floor(rel / STOREY);

    if (!edge) {
      // Interior: solid floor slabs, air pockets for each storey.
      if (r >= 1 && r <= 3 && rel <= 18) continue;
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (rel === 0) {
      put(x, y, z, k2 === 0 ? "polished_andesite" : "smooth_quartz");
    } else if (r === 0) {
      put(x, y, z, "smooth_quartz"); // storey line
    } else if (r === 4) {
      put(x, y, z, k2 === 0 ? "dark_oak_planks" : "light_gray_concrete"); // spandrel / canopy band
    } else {
      // r in 1..3: window zone
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet and cornice for edge cells.
  if (edge) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: entrance on the street-side face, nearest the middle of the block.
const candidates = [...gr.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => isEdge(x, z))
  .sort((a, b) => {
    const pa = faceOf(a[0], a[1]) === "N" || faceOf(a[0], a[1]) === "S" ? 0 : 1000;
    const pb = faceOf(b[0], b[1]) === "N" || faceOf(b[0], b[1]) === "S" ? 0 : 1000;
    return (Math.abs(a[0] - (W - 1) / 2) + pa) - (Math.abs(b[0] - (W - 1) / 2) + pb);
  });

if (candidates.length) {
  const [dx, dz] = candidates[0];
  const gl = groundOf(dx, dz);
  const face = faceOf(dx, dz);
  const props = (half) => ({
    facing: FACING[face],
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, gl + 1, dz, "dark_oak_door", props("lower"));
  put(dx, gl + 2, dz, "dark_oak_door", props("upper"));
}

// Pass 3: warm light behind some upper-storey windows (glowstone in the interior air).
for (const [k, gl] of gr) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const face = faceOf(x, z);
  const idx = face === "N" || face === "S" ? x : z;
  if (idx % 3 === 0) continue;
  const [odx, odz] = DIRS[face];
  const ix = x - odx;
  const iz = z - odz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igl = groundOf(ix, iz);
  for (let y = gl + 1; y <= ROOF; y++) {
    const rel = y - gl;
    if (rel % STOREY !== 2 || rel < STOREY) continue;
    if ((x + z) % 3 !== 0) continue;
    const irel = y - igl;
    if (irel >= 1 && irel <= 3 && irel % STOREY !== 0) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 4: rooftop plant room, a solid block with a bottom-slab cap.
for (let x = 4; x <= 12; x++) {
  for (let z = 30; z <= 50; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
