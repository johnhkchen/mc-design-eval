import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi-district commercial block (c. 1990s):
// stone plinth, cream tile piers, glazed bays, brown fascia band,
// quartz cornice and parapet, rooftop plant room. Roof sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459503";
const W = 12, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), Math.round(gr));
const has = (x, z) => cellMap.has(key(x, z));

// direction vectors: outward normal of each face
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_ORDER = ["S", "N", "E", "W"];

function exteriorFaces(x, z) {
  return FACE_ORDER.filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
}
function facade(x, z) {
  const f = exteriorFaces(x, z);
  return f.length ? f[0] : null;
}

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// pick the entrance: a south-facing exterior cell nearest the middle of the front
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of [...cellMap.keys()].map(k => k.split(",").map(Number))) {
    const f = facade(x, z);
    if (!f) continue;
    const score = (f === "S" ? 0 : 1000) + Math.abs(x - 5.5) + Math.abs(z - 6.5) * 0.01;
    if (score < best) { best = score; doorCell = { x, z, f }; }
  }
}

const DOOR_FACING = { S: "north", N: "south", E: "west", W: "east" };

for (const [x, z, grRaw] of cells) {
  const b = Math.round(grRaw);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // ground-floor slab / base course
  put(x, b, z, "smooth_stone");
  // upper-floor slab
  put(x, b + 5, z, "smooth_stone");
  // roof slab (interior); exterior overridden by parapet below
  put(x, b + 10, z, "smooth_stone");

  const face = facade(x, z);
  if (!face) continue; // interior cell: slabs only, air between

  const [dx, dz] = DIRS[face];
  const alongNS = face === "N" || face === "S";
  const t = alongNS ? x : z;
  const maxT = alongNS ? W - 1 : D - 1;
  const isPier = t === 0 || t === maxT || t % 3 === 0;

  const paneProps = alongNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // ground storey: shopfront glazing on piers of cream tile
  for (let y = b + 1; y <= b + 3; y++) {
    if (isPier) put(x, y, z, "white_terracotta");
    else put(x, y, z, "glass_pane", paneProps);
  }

  // entrance: dark oak door, two blocks tall, in the glazed bay
  if (isDoor && !isPier) {
    put(x, b + 1, z, "dark_oak_door", {
      facing: DOOR_FACING[face], half: "lower", hinge: "left",
      open: "false", powered: "false",
    });
    put(x, b + 2, z, "dark_oak_door", {
      facing: DOOR_FACING[face], half: "upper", hinge: "left",
      open: "false", powered: "false",
    });
  }

  // fascia band over the shopfront, with a hanging lantern over the door
  if (isDoor) {
    put(x, b + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    put(x, b + 4, z, "brown_terracotta");
  }

  // upper storey: piers and glazed bays
  for (let y = b + 6; y <= b + 8; y++) {
    if (isPier) put(x, y, z, "white_terracotta");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }

  // warm light behind some upper windows (inside the air gap)
  if (!isPier && (t + 2 * (alongNS ? z : x)) % 4 === 0) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) put(ix, b + 7, iz, "glowstone");
  }

  // cornice and parapet
  put(x, b + 9, z, "smooth_quartz");
  put(x, b + 10, z, "smooth_quartz");
}

// rooftop plant room, placed on interior footprint cells
for (const [x, z, grRaw] of cells) {
  const b = Math.round(grRaw);
  if (x >= 3 && x <= 8 && z >= 4 && z <= 9 && !facade(x, z)) {
    put(x, b + 11, z, "light_gray_concrete");
    put(x, b + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
