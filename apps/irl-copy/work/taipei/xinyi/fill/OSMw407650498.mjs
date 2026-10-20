import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650498";
const W = 28, H = 33, D = 55;
const ROOF = 21;   // roof slab y (about 21 blocks above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF - 2, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const zFace = (x, z) => !has(x, z - 1) || !has(x, z + 1);   // face runs along x
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);   // face runs along z
const perim = (x, z) => zFace(x, z) || xFace(x, z);
const pier = (x, z) => (zFace(x, z) && xFace(x, z)) || (zFace(x, z) && x % 3 === 0) || (xFace(x, z) && z % 3 === 0);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const DOOR_X = [12, 13, 14, 15];
const CANOPY_X = [11, 12, 13, 14, 15, 16];

// Pass 1: foundations, walls, floors, roof
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const g0 = ground.get(key(x, z));
  const edge = perim(x, z);
  const pr = edge && pier(x, z);

  // foundation
  for (let y = 0; y < g0; y++) set(x, y, z, "gray_concrete");

  // interior floor slab at ground and each storey line
  if (!edge) {
    set(x, g0, z, "light_gray_concrete");
    for (let y = 5; y < ROOF; y += 5) if (y > g0) set(x, y, z, "light_gray_concrete");
  }

  // facade
  if (edge) {
    for (let y = g0; y < ROOF; y++) {
      if (y === g0) set(x, y, z, "stone_bricks");
      else if (y < 5) set(x, y, z, pr ? "gray_concrete" : "light_blue_stained_glass");
      else if (y % 5 === 0) set(x, y, z, "white_concrete");
      else if (pr) set(x, y, z, "white_concrete");
      else set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // roof and parapet
  set(x, ROOF, z, "light_gray_concrete");
  if (edge) set(x, ROOF + 1, z, "white_concrete");
}

// Warm lights behind window glass (glowstone on the interior floor)
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!perim(x, z) || pier(x, z)) continue;
  const g0 = ground.get(key(x, z));
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else dx = -1;
  const tx = x + dx, tz = z + dz;
  if (!has(tx, tz) || perim(tx, tz)) continue;
  for (let y = g0 + 1; y < ROOF; y++) {
    if (y % 5 !== 1) continue;
    if (y - 1 < g0) continue;
    if (((x * 7 + z * 3 + y) % 11) === 0) set(tx, y, tz, "glowstone");
  }
}

// Rooftop plant room (centred, interior of footprint)
for (let x = 8; x <= 19; x++) {
  for (let z = 18; z <= 36; z++) {
    if (!has(x, z)) continue;
    set(x, 22, z, "light_gray_concrete");
    const edge = x === 8 || x === 19 || z === 18 || z === 36;
    set(x, 23, z, edge ? "light_blue_stained_glass_pane" : "air");
    set(x, 24, z, "light_gray_concrete");
  }
}
if (has(13, 27)) set(13, 25, 27, "lightning_rod");

// Entrance on the south face: doors, lintel, canopy, lantern
for (const x of DOOR_X) {
  if (!has(x, 54)) continue;
  const g0 = ground.get(key(x, 54));
  set(x, g0, 54, "oak_door", { facing: "north", half: "lower", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
  set(x, g0 + 1, 54, "oak_door", { facing: "north", half: "upper", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
  set(x, g0 + 2, 54, "smooth_quartz");
}
for (const x of CANOPY_X) {
  for (const z of [53, 54]) {
    if (!has(x, z)) continue;
    const g0 = ground.get(key(x, z));
    set(x, g0 + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(13, 53)) {
  const g0 = ground.get(key(13, 53));
  set(13, g0 + 2, 53, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
