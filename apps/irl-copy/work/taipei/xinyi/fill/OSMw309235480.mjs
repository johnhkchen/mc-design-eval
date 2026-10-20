import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235480";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 60, H = 23, D = 60;
const ROOF = 10;                       // top layer of the 11-block roof (lidar: 11 above lowest ground)
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIR4 = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const ORDER = ["south", "north", "east", "west"];
function missingCount(x, z) {
  let n = 0;
  for (const f of ORDER) { const [dx, dz] = DIR4[f]; if (!has(x + dx, z + dz)) n++; }
  return n;
}
function faceOf(x, z) {
  for (const f of ORDER) {
    const [dx, dz] = DIR4[f];
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
}
const tCoord = (face, x, z) => (face === "north" || face === "south" ? x : z);

function core(x, z, r) {
  for (let i = -r; i <= r; i++)
    for (let j = -r; j <= r; j++)
      if (!has(x + i, z + j)) return false;
  return true;
}

// main entrance: median t along the south face (fallback north)
let entFace = null;
for (const [x, z] of cells) if (faceOf(x, z) === "south") { entFace = "south"; break; }
if (!entFace) entFace = "north";
const entTs = cells
  .filter(([x, z]) => faceOf(x, z) === entFace)
  .map(([x, z]) => tCoord(entFace, x, z))
  .sort((a, b) => a - b);
const t0 = entTs.length ? entTs[Math.floor(entTs.length / 2)] : 30;

function paneProps(face) {
  const ns = face === "north" || face === "south";
  return ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// ---- pass 1: foundations, interiors, facades ----
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < Math.min(gr, H); y++) put(x, y, z, "stone_bricks");
  if (gr > ROOF) continue;

  const face = faceOf(x, z);
  if (!face) {
    // interior: floor slabs per storey and roof deck; air otherwise (no interiors)
    if (gr <= 4) put(x, gr, z, "light_gray_concrete");
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  const t = tCoord(face, x, z);
  const [dx, dz] = DIR4[face];
  const corner = missingCount(x, z) >= 2;
  const pier = corner || t % 4 === 0;
  const isEntFace = face === entFace;
  const nearEnt = isEntFace && Math.abs(t - t0) <= 3;     // canopy width
  const surround = isEntFace && Math.abs(t - t0) <= 1;    // stone door surround

  for (let y = gr; y <= ROOF; y++) {
    // entrance: door, stone surround, canopy, lanterns
    if (isEntFace && t === t0 && (y === gr + 1 || y === gr + 2) && gr + 2 <= 3) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (surround && y > gr && y <= gr + 2 && y <= 3 && t !== t0) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (nearEnt && y === gr + 3 && y <= 3) {
      put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (isEntFace && (t === t0 - 2 || t === t0 + 2) && y === gr + 2 && y <= 3) {
      put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }

    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }          // parapet
    if (y === 9) { put(x, y, z, "light_gray_concrete"); continue; }        // cornice
    if (y === 5 || y === 4) { put(x, y, z, "light_gray_concrete"); continue; } // storey lines
    if (y === gr) { put(x, y, z, "smooth_stone"); continue; }             // base course
    if (corner) { put(x, y, z, "white_concrete"); continue; }             // corner pilasters

    const isWin = (y > gr && y <= 3) || (y >= 6 && y <= 8);
    if (isWin) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      // warm light behind some panes (interior cell must be air)
      const lit = (y === 7 && t % 8 === 6) || (y === 2 && t % 8 === 2);
      if (lit) {
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && faceOf(ix, iz) === null && y >= gAt(ix, iz) && y <= ROOF - 1) {
          put(ix, y, iz, y === 7 ? "shroomlight" : "glowstone");
        }
      }
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

// ---- pass 2: roof terrace, screen walls, setback tower, mast ----
let mastX = null, mastZ = null;
for (const [x, z] of cells) {
  if (faceOf(x, z) !== null) continue;

  if (core(x, z, 10)) {
    put(x, 11, z, "gray_concrete");                                        // roof terrace floor
    if (x % 10 === 0 || z % 10 === 0) {
      put(x, 11, z, "white_concrete");                                     // screen walls
      put(x, 12, z, "white_concrete");
    }
  } else if (core(x, z, 1) && x % 12 === 4 && z % 12 === 4) {
    put(x, 11, z, "smooth_stone");                                         // rooftop units
    put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  if (core(x, z, 4)) {
    put(x, 12, z, "white_concrete");
    put(x, 14, z, "white_concrete");
    put(x, 15, z, "light_gray_concrete");                                  // tower cap
    if (core(x, z, 3)) put(x, 13, z, "white_concrete");
    else put(x, 13, z, "light_blue_stained_glass");                        // glazed band
    if (mastX === null) { mastX = x; mastZ = z; }
    if (x === 30 && z === 30) { mastX = x; mastZ = z; }
  }
}
if (mastX !== null) {
  for (let y = 16; y <= 18; y++)
    put(mastX, y, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
