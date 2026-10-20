import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-century commercial block, two storeys over a stone base:
// white concrete walls with smooth quartz piers, a shopfront ground storey,
// a windowed upper storey, a flat roof with a quartz parapet and a small penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377791";
const W = 29, H = 23, D = 26;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : (raw.cells ?? [])).map((e) =>
  Array.isArray(e)
    ? { x: e[0], z: e[1], g: e[2] }
    : { x: e.x, z: e.z, g: e.g ?? e.ground ?? e.y ?? 0 }
);
const minG = Math.min(...list.map((c) => c.g));

// Footprint map: "x,z" -> ground (relative to lowest ground, clamped below the roof)
const G = new Map();
for (const c of list) {
  if (c.x < 0 || c.x >= W || c.z < 0 || c.z >= D) continue;
  G.set(`${c.x},${c.z}`, Math.min(c.g - minG, 9));
}
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ROOF = 11, FLOOR = 5, PARAPET = 12;
const BASE = "stone_bricks";
const BAND = "light_gray_concrete";
const WALL = "white_concrete";
const PIER = "smooth_quartz";
const FRAME = "gray_concrete";

const paneProps = (f) =>
  f === "N" || f === "S"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const outward = { N: "north", S: "south", W: "west", E: "east" };
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: a non-corner north-face cell near the middle, off the pier lines
let entKey = null;
{
  let best = Infinity;
  for (const [key, gr] of G) {
    const [x, z] = key.split(",").map(Number);
    if (has(x, z - 1)) continue;                 // not north face
    if (!has(x - 1, z) || !has(x + 1, z)) continue; // corner
    if (x % 3 === 0) continue;                   // keep off piers
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; entKey = key; }
  }
}

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);
  // Floor slab per storey and roof slab
  put(x, FLOOR, z, BAND);
  put(x, ROOF, z, "smooth_stone");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  if (faces.length === 0) continue; // interior: air above the slabs

  // Parapet on the perimeter
  put(x, PARAPET, z, PIER);

  const corner = faces.length > 1;
  const f = faces[0];
  const t = f === "N" || f === "S" ? x : z;
  const pier = corner || t % 3 === 0;
  const isEntrance = key === entKey;

  for (let y = gr; y <= 10; y++) {
    if (isEntrance) {
      if (y === gr) {
        put(x, y, z, "dark_oak_door", { facing: outward[f], half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 1) {
        put(x, y, z, "dark_oak_door", { facing: outward[f], half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }
    if (y === FLOOR) { put(x, y, z, BAND); continue; }
    if (pier) { put(x, y, z, PIER); continue; }
    if (y === 4) { put(x, y, z, BAND); continue; }          // lintel over shopfront
    if (y < gr + 2) { put(x, y, z, BASE); continue; }        // base course
    if (y <= 3) {                                            // shopfront glazing
      put(x, y, z, "glass_pane", paneProps(f));
      continue;
    }
    // Upper storey (rows 6..10)
    if (y === 10) { put(x, y, z, WALL); continue; }
    if (y === 6 || y === 9) { put(x, y, z, FRAME); continue; }
    // rows 7..8: glazing
    put(x, y, z, "glass_pane", paneProps(f));
    if (y === 7 && t % 6 === 1) {
      const [ix, iz] = inward[f];
      if (has(x + ix, z + iz)) put(x + ix, 7, z + iz, "glowstone");
    }
  }
}

// Penthouse on the roof, centred
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let x = cx - 3; x <= cx + 3; x++) {
  for (let z = cz - 3; z <= cz + 3; z++) {
    if (!has(x, z)) continue;
    const ring = x === cx - 3 || x === cx + 3 || z === cz - 3 || z === cz + 3;
    if (ring) {
      put(x, 12, z, BAND);
      put(x, 13, z, BAND);
    }
    put(x, 14, z, "smooth_stone");
  }
}

// Rooftop plant units
for (const [x, z] of [[cx + 6, cz - 6], [cx - 6, cz + 6], [cx + 6, cz + 5]]) {
  if (has(x, z)) put(x, 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
