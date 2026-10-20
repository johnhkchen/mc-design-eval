import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1296604267";
const W = 24, H = 23, D = 9;
const TOP = 10;          // last wall row; roof surface sits at y = 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));

// Exterior faces of a cell: N = z-1 side (street frontage), S = z+1, W = x-1, E = x+1.
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const isPerim = (x, z) => has(x, z) && facesOf(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Returns [id, props?] for a perimeter wall cell at height y.
function wallBlock(face, p, y, gy, corner) {
  if (corner) return ["light_gray_concrete"];
  if (y === gy) return ["polished_andesite"];           // base course
  if (y === TOP) return ["smooth_stone"];               // cornice course
  if (y === 9) return ["light_gray_concrete"];          // upper storey spandrel / band
  if (y === 5 && gy < 5) return ["light_gray_concrete"]; // storey line

  if (y < 5) {
    // ground storey (commercial)
    if (face === "N") {
      if (y === 4) return ["dark_oak_planks"];           // fascia sign band
      if (p % 3 === 0) return ["light_gray_concrete"];   // mullion
      return ["glass"];                                  // shopfront glass
    }
    if (y === 4) return ["white_terracotta"];
  }

  // window rows (upper storeys 6..8, ground storey on non-street faces 1..3)
  if (p % 3 === 0) return ["light_gray_concrete"];       // mullion / pier
  return ["glass_pane", paneProps(face)];
}

// 1. Foundations and interior floor slabs
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  if (!isPerim(x, z)) {
    const floors = [...new Set([gy, 5, TOP])].filter((f) => f >= gy && f <= TOP);
    for (const f of floors) put(x, f, z, "smooth_stone");
  }
}

// 2. Perimeter walls, cornice and parapet
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  const face = faces.includes("N") ? "N" : faces[0];
  const p = face === "N" || face === "S" ? x : z;
  for (let y = gy; y <= TOP; y++) {
    const [id, props] = wallBlock(face, p, y, gy, corner);
    put(x, y, z, id, props);
  }
  // parapet cap
  put(x, 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Warm lights: glowstone just inside some lit windows
const FACE_IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  if (face === "N") continue; // street frontage kept as shopfront
  const p = face === "S" || face === "N" ? x : z;
  const [dx, dz] = FACE_IN[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const faceIdx = { S: 1, W: 2, E: 3 }[face];
  for (const y of [1, 2, 3, 6, 7, 8]) {
    if (y <= gy) continue;
    if (p % 3 === 0) continue;
    if (((p * 7 + y * 13 + faceIdx * 5) % 9) !== 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// 4. Street entrance: double dark oak doors at x 11..12 with hanging lanterns
for (const x of [11, 12]) {
  if (!has(x, 0)) continue;
  const gy = ground.get(key(x, 0));
  if (gy + 1 > 3) continue;
  put(x, gy, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" });
  put(x, gy + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" });
}
for (const x of [10, 13]) {
  if (!has(x, 0)) continue;
  const gy = ground.get(key(x, 0));
  if (gy > 2) continue;
  put(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. Roof equipment: a water tank on the roof, clear of the parapet
const tankCells = [];
for (let x = 3; x <= 5; x++) for (let z = 2; z <= 4; z++) tankCells.push([x, z]);
if (tankCells.every(([x, z]) => has(x, z) && !isPerim(x, z))) {
  for (const [x, z] of tankCells) {
    const ring = x === 3 || x === 5 || z === 2 || z === 4;
    for (let y = 11; y <= 12; y++) {
      if (ring) put(x, y, z, "white_concrete");
    }
    put(x, 13, z, "light_gray_concrete");
  }
}

// 6. Save
g.save(`${DIR}/${ID}.nbt`);
