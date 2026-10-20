import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (c. 1970s) three-storey commercial block, reading as a two-storey
// pale-tiled shophouse with a shopfront ground floor, a window band with sills,
// a belt course, a cornice, a parapet, and rooftop water tank and AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617861";
const W = 15, H = 23, D = 29;
const ROOF_TOP = 11; // parapet top sits 11 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const cornerCell = (x, z) =>
  [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)].filter(Boolean).length >= 2;

// Outward face of an edge cell (north = min z, the street-facing side here).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
// One step inward from an outer face.
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: the north-facing edge cell nearest the middle of the frontage.
let door = null;
for (const [x, z] of cellList) {
  if (has(x, z - 1)) continue; // not a north-facing edge
  if (!door || Math.abs(x - 7) < Math.abs(door.x - 7)) door = { x, z };
}
const DOOR_FACE = "north";

// 1) Foundation, floor slabs, roof slab for every footprint cell.
for (const [x, z] of cellList) {
  const gr = ground.get(key(x, z));
  const edge = isEdge(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");        // foundation
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");       // ground floor slab / base course
  if (5 > gr) put(x, 5, z, "smooth_stone");                         // upper floor slab
  if (10 > gr) put(x, 10, z, "smooth_quartz");                      // roof slab
}

// 2) Facade walls on the edge cells.
for (const [x, z] of cellList) {
  if (!isEdge(x, z)) continue;
  const gr = ground.get(key(x, z));
  const face = faceOf(x, z);
  if (!face) continue;
  const alongX = face === "north" || face === "south";
  const t = alongX ? x : z;
  const corner = cornerCell(x, z);
  const isDoorCell = door && x === door.x && z === door.z && face === DOOR_FACE;
  const flankDoor = door && face === DOOR_FACE && Math.abs(t - (alongX ? door.x : door.z)) === 1;
  const pillar = corner || t % 3 === 0 || flankDoor;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const doorProps = (half, hinge) => ({
    facing: face, half, hinge, open: "false", powered: "false",
  });

  for (let y = gr + 1; y <= ROOF_TOP; y++) {
    if (y === ROOF_TOP) { put(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === 10) { put(x, y, z, "polished_andesite"); continue; }      // cornice
    if (y === 5) { put(x, y, z, "polished_andesite"); continue; }       // belt course

    if (y <= 4) {
      // Ground storey: shopfront glass, pillars, lintel at y 4.
      if (isDoorCell && gr + 2 <= 3 && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", doorProps(y === gr + 1 ? "lower" : "upper", "left"));
        continue;
      }
      if (y === 4) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, pillar ? "white_concrete" : "glass_pane", pillar ? undefined : paneProps);
      continue;
    }

    // Upper storey: window band 6..9.
    if (y === 6) {
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === 9) { put(x, y, z, "white_concrete"); continue; }
    if (pillar) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "glass_pane", paneProps);

    // Warm light behind some upper windows, in the first room cell inside.
    if (y === 7 && t % 6 === 1) {
      const [dx, dz] = INWARD[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// 3) Rooftop plant: a water tank and AC condensers on interior roof cells.
const interiorBlock = (x0, z0, w, d, maxGround) =>
  Array.from({ length: w * d }, (_, i) => [x0 + (i % w), z0 + Math.floor(i / w)])
    .every(([x, z]) => has(x, z) && !isEdge(x, z) && ground.get(key(x, z)) <= maxGround);

const tankOrigin = [[4, 20], [4, 8], [5, 14]].find(([x, z]) => interiorBlock(x, z, 2, 2, 9));
if (tankOrigin) {
  const [tx, tz] = tankOrigin;
  for (let dx = 0; dx < 2; dx++)
    for (let dz = 0; dz < 2; dz++) {
      put(tx + dx, 11, tz + dz, "iron_block");
      put(tx + dx, 12, tz + dz, "iron_block");
      put(tx + dx, 13, tz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
}

const acOrigin = [[9, 24], [9, 4], [10, 14]].find(([x, z]) => interiorBlock(x, z, 2, 1, 9));
if (acOrigin) {
  const [ax, az] = acOrigin;
  put(ax, 11, az, "light_gray_concrete");
  put(ax + 1, 11, az, "light_gray_concrete");
  put(ax, 12, az, "chain");
  put(ax + 1, 12, az, "chain");
}

g.save(`${DIR}/${ID}.nbt`);
