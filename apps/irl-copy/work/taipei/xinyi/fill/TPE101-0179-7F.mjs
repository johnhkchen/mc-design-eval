import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE101-0179-7F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 17 x 23 footprint, 7 storeys of 5 blocks, roof deck at y 35, rooftop plant and mast to y 46.
const W = 17, H = 47, D = 23;
const ROOF = 35;
const DOOR_X = 8;
const SKIP = Symbol("skip");
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.min(ROOF - 1, Math.max(0, Math.round(gr))));
}

const has = (x, z) => ground.has(key(x, z));
const faces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Only ever writes on footprint cells, inside the volume.
function put(x, y, z, id, st) {
  if (!has(x, z) || y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const doorStates = (facing, half) => ({
  facing, half, hinge: "left", open: "false", powered: "false",
});

// Facade on one exterior wall cell at height y.
function wall(x, y, z, f, gd) {
  const k = Math.floor(y / 5);
  const r = y % 5;
  const zFace = f.n || f.s;
  const idx = zFace ? x : z;
  const last = zFace ? W - 1 : D - 1;
  const corner = (f.n || f.s) && (f.w || f.e);
  const mullion = corner || idx === 0 || idx === last || idx % 3 === 0;

  if (y === gd && k === 0) return put(x, y, z, "polished_granite");    // base course
  if (r === 0) return put(x, y, z, "smooth_quartz");                   // storey line
  if (r === 4) return put(x, y, z, "white_concrete");                  // sill band
  if (mullion) return put(x, y, z, "light_gray_concrete");             // frame
  if (k === 0 && (f.n || f.s)) return put(x, y, z, "light_blue_stained_glass"); // shopfront
  if (r === 2 && [1, 3, 5].includes(k) && (idx + k) % 6 === 2) {
    return put(x, y, z, "glowstone");                                   // warm light behind glass
  }
  const st = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "cyan_stained_glass_pane", st);
}

// Entrance portal on the z = 0 and z = D-1 faces: door, lintel, granite jambs.
function portal(x, y, z, f, gd) {
  const zPortal = (f.n && z === 0) || (f.s && z === D - 1);
  if (!zPortal) return null;
  if (x === DOOR_X && (y === gd || y === gd + 1)) return SKIP;
  if (Math.abs(x - DOOR_X) <= 1 && y === gd + 2) return "smooth_stone";  // lintel
  if ((x === DOOR_X - 2 || x === DOOR_X + 2) && y >= gd && y <= gd + 3) return "polished_granite"; // jambs
  return null;
}

// Main pass over the footprint.
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gd = ground.get(key(x, z));
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");

  // Doors on both street-facing (z) faces.
  const isDoor = x === DOOR_X && gd <= 4 &&
    ((f.n && z === 0) || (f.s && z === D - 1));
  if (isDoor) {
    const facing = z === 0 ? "south" : "north";
    put(x, gd, z, "dark_oak_door", doorStates(facing, "lower"));
    put(x, gd + 1, z, "dark_oak_door", doorStates(facing, "upper"));
  }

  if (edge) {
    if (gd < ROOF) {
      for (let y = gd; y < ROOF; y++) {
        const ov = portal(x, y, z, f, gd);
        if (ov === SKIP) continue;
        if (ov) { put(x, y, z, ov); continue; }
        wall(x, y, z, f, gd);
      }
    }
    // Parapet with cornice cap.
    put(x, ROOF, z, "white_concrete");
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "smooth_quartz_slab", SLAB_BOTTOM);
  } else {
    // Interior: floor slabs at each storey line and the roof deck. Air between (no interiors).
    for (let y = 0; y <= ROOF; y += 5) {
      if (y >= gd) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Rooftop mechanical penthouse, centred on the roof.
const PH = { x0: 5, x1: 11, z0: 7, z1: 15 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const perim = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF + 1; y <= 39; y++) {
      if (perim) put(x, y, z, "light_gray_concrete");
    }
    put(x, 40, z, "smooth_stone_slab", SLAB_BOTTOM);
  }
}

// Lightning rod / mast on the penthouse, up to y 46.
for (let y = 41; y <= 46; y++) {
  put(8, y, 11, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
