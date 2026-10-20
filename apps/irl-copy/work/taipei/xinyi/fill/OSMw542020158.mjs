import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020158";

const W = 7, H = 23, D = 13;
const ROOF = 11;   // flat roof slab top, ~11 blocks above lowest ground
const BELT = 5;    // storey line (first floor slab / belt course)
const BAND2 = 10;  // cornice band under the roof

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const arr = Array.isArray(raw) ? raw : (raw.cells ?? []);
const rows = arr.map((c) =>
  Array.isArray(c) ? { x: c[0], z: c[1], g: c[2] } : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 }
);
const minG = Math.min(...rows.map((r) => r.g));
const ground = new Map();
for (const r of rows) {
  ground.set(`${r.x},${r.z}`, Math.min(8, Math.max(0, r.g - minG)));
}
const isIn = (x, z) => ground.has(`${x},${z}`);
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const faceOf = (x, z) =>
  Object.keys(OUT).filter((d) => !isIn(x + OUT[d][0], z + OUT[d][1]));

// ---- one entrance, on the street-facing (south) side, near the middle -------
const exposedNonCorner = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => faceOf(x, z).length === 1);
let doorCands = exposedNonCorner.filter(([x, z]) => faceOf(x, z)[0] === "south");
if (doorCands.length === 0) doorCands = exposedNonCorner.filter(([x, z]) => faceOf(x, z)[0] === "north");
if (doorCands.length === 0) doorCands = exposedNonCorner;
doorCands.sort((a, b) => Math.abs(a[0] - 3) - Math.abs(b[0] - 3) || Math.abs(a[1] - 6) - Math.abs(b[1] - 6));
const [dX, dZ] = doorCands[0] ?? [3, 0];
const doorFace = faceOf(dX, dZ)[0] ?? "south";
const doorAlong = (doorFace === "north" || doorFace === "south") ? dX : dZ;

// ---- materials ---------------------------------------------------------------
const WALL = ["white_concrete"];
const BAND = ["light_gray_concrete"];
const FOUNDATION = ["stone_bricks"];
const BASE = ["polished_andesite"];
const GLASS = (face) =>
  (face === "north" || face === "south")
    ? ["glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }]
    : ["glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (b[1]) g.set(x, y, z, b[0], b[1]);
  else g.set(x, y, z, b[0]);
};

// ---- facade block for one perimeter cell at height y -------------------------
function facade(x, z, y, gr, face, corner) {
  const along = (face === "north" || face === "south") ? x : z;
  const pier = corner || along % 3 === 0;

  if (y === BELT || y === BAND2) return BAND;

  const onDoor = doorFace === face && Math.abs(along - doorAlong) <= 1;
  if (door(x, z)) {
    if (y === gr + 1) return ["dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === gr + 2) return ["dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }];
  }

  if (y >= gr + 1 && y <= 4) {
    if (y === gr + 1) return BASE;
    if (y === 4) return (onDoor && !pier) || (door(x, z)) ? ["red_concrete"] : ["gray_concrete"];
    if (pier && !door(x, z)) return WALL;
    if (door(x, z)) return WALL;
    return GLASS(face);
  }

  if (y >= 6 && y <= 9) {
    if (y === 6) return pier ? WALL : ["smooth_quartz"];
    if (y === 9) return pier ? WALL : ["gray_concrete"];
    if (pier) return WALL;
    return GLASS(face);
  }

  return WALL;
}
function door(x, z) { return x === dX && z === dZ; }

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// ---- build columns ----------------------------------------------------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = faceOf(x, z);
  const perim = faces.length > 0;

  // foundation up to ground
  for (let y = 0; y <= gr; y++) put(x, y, z, FOUNDATION);

  for (let y = gr + 1; y <= BAND2; y++) {
    if (perim) {
      const face = faces[0];
      put(x, y, z, facade(x, z, y, gr, face, faces.length >= 2));
    } else if (y === BELT) {
      put(x, y, z, BAND); // storey floor slab across the interior
    }
  }

  // roof slab on everything, parapet on the perimeter
  put(x, ROOF, z, ["gray_concrete"]);
  if (perim) put(x, ROOF + 1, z, WALL);
}

// ---- roof equipment on interior cells ---------------------------------------
for (const [x, z] of [[2, 4], [4, 8]]) {
  if (isIn(x, z) && faceOf(x, z).length === 0) put(x, ROOF + 1, z, ["iron_block"]);
}

// ---- warm lights standing on interior floors behind some windows -------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = faceOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const along = (face === "north" || face === "south") ? x : z;
  if (along % 3 === 0) continue; // only behind windows, not piers
  const [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  if (!isIn(ix, iz) || faceOf(ix, iz).length !== 0) continue;

  if (along % 2 === 1 && gr + 1 <= 5) {
    // storey 2 floor slab is at BELT (5); stand the light on it
    put(ix, BELT + 1, iz, ["glowstone"]);
  }
  if (along % 3 === 1 && gr + 2 <= 4) {
    // ground floor shopfront light on the floor
    put(ix, gr + 1, iz, ["shroomlight"]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
