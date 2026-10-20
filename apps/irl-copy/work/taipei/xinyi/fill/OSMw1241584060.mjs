import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1980s Xinyi commercial block: terrazzo-style plinth, white
// concrete walls with light-grey piers, a glazed shopfront, a glazed upper
// storey, a cornice, a parapet, and a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241584060";
const W = 31, H = 23, D = 21;
const ROOF = 10;   // roof slab level; parapet sits on y=11
const PARAPET = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  // Floors stand no higher than storey 2's floor so the roof stays at the record height.
  ground.set(k(x, z), Math.max(0, Math.min(9, Math.round(gr))));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const faceOf = (x, z) =>
  Object.keys(DIRS).filter(f => !ground.has(k(x + DIRS[f][0], z + DIRS[f][1])));

// Glass panes must connect along the wall they sit in.
const pane = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: lowest single-face cell, preferring the south (street) face near the middle.
let entr = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    const f = faceOf(x, z);
    if (f.length !== 1) continue;
    const face = f[0];
    const t = face === "N" || face === "S" ? x : z;
    const center = face === "N" || face === "S" ? 15 : 10;
    const score = ground.get(key) * 100 + (face === "S" ? 0 : 40) + Math.abs(t - center);
    if (score < best) {
      best = score;
      entr = { x, z, face, t };
    }
  }
}

// Body block at (x, y, z) for a cell whose body starts at ground level gr.
function bodyAt(x, z, y, gr, faces) {
  const ext = faces.length > 0;
  const face = faces.length === 1 ? faces[0] : null;
  const corner = faces.length > 1;

  // Storey lines: roof slab at 10, floor slab at 5, ground floor at gr.
  if (y === ROOF) return ext ? ["smooth_stone"] : ["light_gray_concrete"];
  if (y === 5) return ["light_gray_concrete"];
  if (y === gr) return ext ? ["smooth_stone"] : ["light_gray_concrete"];

  if (!ext) return null;

  const t = face === "N" || face === "S" ? x : z;
  const pier = corner || t % 4 === 0;
  const isEntr = entr && entr.x === x && entr.z === z;
  const canopy = entr && face === entr.face && Math.abs(t - entr.t) <= 2;

  if (isEntr && (y === 1 || y === 2)) {
    return ["dark_oak_door", {
      facing: FACING[face],
      half: y === 1 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    }];
  }
  if (isEntr && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if (y === 1) return ["smooth_stone"];                       // base course
  if (y === 4) return canopy ? ["dark_oak_planks"] : ["white_concrete"]; // fascia / canopy band
  if (y === PARAPET) return ["white_concrete"];               // parapet
  if (y === 6 || y === 9) return pier ? ["light_gray_concrete"] : ["white_concrete"];

  // Piers run through the window rows.
  if (pier) return ["light_gray_concrete"];

  if (y === 7 || y === 8) {
    if (t % 4 === 3) return ["white_concrete"];               // upper-storey solid bay
    return ["glass_pane", pane(face)];
  }
  // y 2, 3: shopfront glazing.
  return ["glass_pane", pane(face)];
}

// Pass 1: foundation and body.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = faceOf(x, z);
  for (let y = gr; y <= PARAPET; y++) {
    const b = bodyAt(x, z, y, gr, faces);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// Pass 2: warm lights behind selected windows (one block inside the glass).
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const faces = faceOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const t = face === "N" || face === "S" ? x : z;
  if (entr && entr.x === x && entr.z === z) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  const ik = k(ix, iz);
  if (!ground.has(ik) || faceOf(ix, iz).length) continue;
  const igr = ground.get(ik);
  if (t % 8 === 1 && igr <= 7) g.set(ix, 7, iz, "glowstone");
  if (t % 8 === 5 && igr <= 3) g.set(ix, 3, iz, "glowstone");
}

// Pass 3: roof equipment on the interior roof. Tank in the centre, AC units at the edges.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z).length) continue;
  if (ground.get(key) > ROOF) continue;
  if (x >= 13 && x <= 15 && z >= 9 && z <= 11) {
    g.set(x, 11, z, "white_concrete");
    g.set(x, 12, z, "white_concrete");
    g.set(x, 13, z, "dark_oak_planks");
  } else if ((x + z) % 9 === 0 && x > 2 && x < 28 && z > 2 && z < 18) {
    g.set(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
