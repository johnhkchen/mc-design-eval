import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298928";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ground lookup
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, y] of cells) ground.set(key(x, z), y);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...ground.values());

// levels: two storeys of 5 blocks, flat roof at minG+11, one-block parapet + cap
const TOP = minG + 11;   // roof deck layer
const F1 = minG + 5;     // second-floor deck layer
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const DIRS = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gy] of cells) {
  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const perim = faces.length > 0;

  // second-floor deck and roof deck
  if (F1 >= gy) put(x, F1, z, perim ? "smooth_quartz" : "smooth_stone");
  if (TOP >= gy) put(x, TOP, z, "smooth_stone");
  if (!perim) continue;

  // walls, base course, parapet and cap
  for (let y = gy; y < TOP; y++) put(x, y, z, "smooth_quartz");
  put(x, gy, z, "stone_bricks");
  put(x, TOP + 1, z, "smooth_quartz");
  put(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // corners stay as plain pillars
  if (faces.length > 1) continue;

  const f = faces[0];
  const nsWall = f === "N" || f === "S";
  const u = nsWall ? x : z;
  const [ix, iz] = DIRS[f];
  const pane = nsWall
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isFront = f === "N";
  const doorHere = isFront && x === Math.floor(W / 2);
  const pillarG = !isFront && u % 3 === 0;   // side ground floors keep mullions
  const pillarU = u % 3 === 0;

  // entrance door (front face, centre)
  if (doorHere) {
    put(x, gy, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // ground-floor shopfront glazing
  for (let y = gy + 1; y <= F1 - 2; y++) {
    if (doorHere && y === gy + 1) continue;
    if (!isFront && pillarG) continue;
    put(x, y, z, "glass_pane", pane);
  }
  // ground lintel / fascia
  if (F1 - 1 > gy) put(x, F1 - 1, z, isFront ? "red_terracotta" : "smooth_quartz");

  // upper-floor windows
  for (let y = F1 + 2; y <= TOP - 2; y++) {
    if (pillarU) continue;
    put(x, y, z, "glass_pane", pane);
  }

  // warm lights standing just inside some windows
  const inX = x + ix, inZ = z + iz;
  if (has(inX, inZ) && !isPerim(inX, inZ)) {
    if (!pillarG && !doorHere && u % 6 === 4 && gy <= gy) {
      put(inX, gy, inZ, "glowstone");
    }
    if (!pillarU && u % 6 === 1 && F1 + 1 < TOP) {
      put(inX, F1 + 1, inZ, "shroomlight");
    }
  }
}

// rooftop water tank: 3x3 block, find a fully-supported spot
let tank = null;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++)
      if (!has(x + dx, z + dz)) ok = false;
  if (ok) { tank = [x, z]; break; }
}
const inTank = (x, z) => tank && Math.abs(x - tank[0]) <= 1 && Math.abs(z - tank[1]) <= 1;

if (tank && TOP + 4 < H) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let y = TOP + 1; y <= TOP + 3; y++)
        put(tank[0] + dx, y, tank[1] + dz, "white_concrete");
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      put(tank[0] + dx, TOP + 4, tank[1] + dz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// two condenser units on interior roof cells away from the tank
const acSpots = cells
  .filter(([x, z]) => !isPerim(x, z) && !inTank(x, z))
  .map(([x, z]) => [x, z]);
const picks = [acSpots[1], acSpots[acSpots.length - 2]].filter(Boolean);
for (const [x, z] of picks) put(x, TOP + 1, z, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
