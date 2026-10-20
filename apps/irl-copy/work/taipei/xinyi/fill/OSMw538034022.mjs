import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034022";
const W = 9, H = 23, L = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, L]);

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => foot.has(key(x, z));
const B = Math.max(...cells.map((c) => c[2])); // storey datum: shared floor level

// Every placement is clipped to the footprint and the volume.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= L || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function faces(x, z) {
  return {
    W: !has(x - 1, z),
    E: !has(x + 1, z),
    N: !has(x, z - 1),
    S: !has(x, z + 1),
  };
}

// Mid-century Taipei shophouse-tower: stone plinth, white tiled piers,
// glazed bays, light-grey storey bands, stone parapet, rooftop plant.
const PIER = "white_terracotta";
const BAND = "light_gray_concrete";
const SILL = "white_concrete";
const PLINTH = "stone_bricks";
const SLAB = "smooth_stone";

// 1. Foundation/plinth: solid from y=0 up to the datum under every cell,
//    so downhill cells carry their extra storeys and nothing floats.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (let y = 0; y < B; y++) put(x, y, z, PLINTH);
}

// 2. Floor slabs at each storey line and the roof slab (air gap between).
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const y of [B, B + 5, B + 10]) put(x, y, z, SLAB);
}

// 3. Perimeter walls: two storeys of four air rows each, with pier/glass grids.
const DOOR_X = 8, DOOR_Z = 13;
const paneProps = (side) =>
  side
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const f = faces(x, z);
  if (!(f.W || f.E || f.N || f.S)) continue;

  const side = f.W || f.E;
  const corner = (f.W || f.E) && (f.N || f.S);
  const along = side ? z : x;
  const pier = corner || along % 3 === 0;
  const isDoor = x === DOOR_X && z === DOOR_Z && f.E;
  const pane = paneProps(side);

  // Ground storey (B+1..B+4)
  if (isDoor) {
    put(x, B + 1, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, B + 1, z, PLINTH);
    put(x, B + 2, z, pier ? PIER : "glass_pane", pier ? undefined : pane);
  }
  put(x, B + 3, z, pier ? PIER : "glass_pane", pier ? undefined : pane);
  put(x, B + 4, z, BAND);

  // Upper storey (B+6..B+9)
  put(x, B + 6, z, SILL);
  put(x, B + 7, z, pier ? PIER : "glass_pane", pier ? undefined : pane);
  put(x, B + 8, z, pier ? PIER : "glass_pane", pier ? undefined : pane);
  put(x, B + 9, z, BAND);

  // Parapet with connections to neighbouring footprint cells
  put(x, B + 11, z, "stone_brick_wall", {
    north: has(x, z - 1) ? "low" : "none",
    south: has(x, z + 1) ? "low" : "none",
    east: has(x + 1, z) ? "low" : "none",
    west: has(x - 1, z) ? "low" : "none",
    up: "true",
    waterlogged: "false",
  });
}

// 4. Warm light behind some glazed bays (in the air gap, inside the shell).
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const f = faces(x, z);
  if (!(f.W || f.E || f.N || f.S) || (f.W || f.E) && (f.N || f.S)) continue;
  const side = f.W || f.E;
  const along = side ? z : x;
  if (along % 3 === 0) continue;
  const [ix, iz] = f.W ? [x + 1, z] : f.E ? [x - 1, z] : f.N ? [x, z + 1] : [x, z - 1];
  if (along % 6 === 2) put(ix, B + 2, iz, "glowstone");
  if (along % 6 === 5) put(ix, B + 7, iz, "glowstone");
}

// 5. Entrance lantern just inside the door.
put(DOOR_X - 1, B + 2, DOOR_Z, "lantern", { hanging: "false", waterlogged: "false" });

// 6. Rooftop: lift-core/plant room and a steel water tank.
for (let x = 2; x <= 5; x++)
  for (let z = 9; z <= 14; z++)
    for (let y = B + 11; y <= B + 12; y++) put(x, y, z, BAND);
for (let x = 2; x <= 5; x++)
  for (let z = 9; z <= 14; z++) put(x, B + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

for (let x = 1; x <= 2; x++)
  for (let z = 3; z <= 4; z++)
    for (let y = B + 11; y <= B + 13; y++) put(x, y, z, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
