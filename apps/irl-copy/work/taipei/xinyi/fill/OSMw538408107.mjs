import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538408107: no record. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey, 1970s-80s Taipei commercial block: concrete frame,
// tiled shopfront at street level, glazed upper storey, stone cornice, parapet.
// Front (door) on the north face (z = 0).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408107";
const W = 16, H = 23, D = 20;
const ROOF = 11;          // absolute roof/parapet top (lidar)
const DOOR_X = 7;         // entrance bay on the north face

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const outFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isPerim = (x, z) => outFaces(x, z).length > 0;

const glass = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for a perimeter cell at height y on its chosen outward face.
function facadeBlock(x, z, y, base, face, dropPanes) {
  const along = (face === "N" || face === "S") ? x : z;
  const last = (face === "N" || face === "S") ? W - 1 : D - 1;
  const corner = outFaces(x, z).length > 1;
  const pillar = corner || along % 3 === 0 || along === last;

  if (y === 10) return ["smooth_stone"];                 // cornice
  if (y === 11) return ["white_concrete"];               // parapet
  if (y === 9 || y === 6) return ["light_gray_concrete"]; // storey lines
  if (y === 5) return ["red_terracotta"];                // shopfront sign band

  if (y <= 4) {
    if (y === base && base <= 4) return ["stone_bricks"]; // plinth course
    if (face === "N" && along === DOOR_X && base <= 4 && y <= base + 1) {
      if (y === base) return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
  }
  if (pillar) return ["white_concrete"];
  return ["glass_pane", glass(face)];
}

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");

  const base = gr + 1;               // first body block
  if (base > ROOF) continue;
  const perim = isPerim(x, z);

  if (perim) {
    const faces = outFaces(x, z);
    const face = faces[0];           // priority N, S, W, E
    for (let y = base; y <= ROOF && y < H; y++) {
      const [id, props] = facadeBlock(x, z, y, base, face, false);
      g.set(x, y, z, id, props);
    }
  } else {
    // interior: a floor slab per storey and the roof deck, air between
    if (base <= 6) g.set(x, 6, z, "light_gray_concrete");
    if (base <= 10) g.set(x, 10, z, "light_gray_concrete");
  }
}

// Warm light behind some front upper-storey windows (interior cell at z = 1).
for (let x = 1; x < W - 1; x++) {
  const along = x;
  if (along % 3 !== 1) continue;
  if (!has(x, 0) || !has(x, 1)) continue;
  if (isPerim(x, 1)) continue;
  const b0 = gnd(x, 0) + 1;
  if (b0 > 8) continue;
  if (x === DOOR_X) continue;
  g.set(x, 8, 1, "glowstone");
}

// Lower shopfront light in one bay per side for street-level dusk glow
for (let x = 1; x < W - 1; x += 6) {
  if (!has(x, 0) || !has(x, 1) || isPerim(x, 1)) continue;
  const b0 = gnd(x, 0) + 1;
  if (b0 > 3) continue;
  g.set(x, 3, 1, "shroomlight");
}

// Roof plant: two small AC/equipment blocks on the roof deck
for (let x = 4; x <= 5; x++) {
  for (let z = 12; z <= 13; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    if (gnd(x, z) + 1 > 10) continue;
    g.set(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
