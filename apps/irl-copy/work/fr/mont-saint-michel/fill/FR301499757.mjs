import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499757";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 15, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup
const map = new Map();
let maxX = 0, maxZ = 0, maxG = 0, roofSum = 0;
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { gr, roof });
  maxX = Math.max(maxX, x);
  maxZ = Math.max(maxZ, z);
  maxG = Math.max(maxG, gr);
  roofSum += roof;
}
const roofAvg = roofSum / cells.length;

// Low, single-storey stone house with slate roof, read from lidar roof height.
let eave = Math.max(5, maxG + 4, Math.round(roofAvg));
eave = Math.min(eave, 11);

const isEdge = (x, z) => x === 0 || z === 0 || x === maxX || z === maxZ;
const isCorner = (x, z) => (x === 0 || x === maxX) && (z === 0 || z === maxZ);
const doorX = Math.floor(maxX / 2);
const doorZ = maxZ;
const zMid = maxZ / 2;

// deterministic stone variation so walls are not flat
const stoneAt = (x, y, z) => {
  const h = (x * 73 + y * 151 + z * 37) % 11;
  if (h === 0) return "cracked_stone_bricks";
  if (h === 5) return "mossy_stone_bricks";
  return "stone_bricks";
};

// 1) Foundation, walls, base course, quoins, cornice, roof structure
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "cobblestone");
  for (let y = gr; y < eave; y++) {
    let id = stoneAt(x, y, z);
    if (edge && (y === gr || y === eave - 1)) id = "polished_andesite";
    if (corner) id = "polished_andesite"; // quoins
    put(x, y, z, id);
  }
  // roof: d = distance from nearest long edge (0 eave row, 1 slope, 2 ridge)
  const d = Math.min(z, maxZ - z);
  const dEff = Math.min(d, 2);
  for (let y = eave; y < eave + dEff; y++) put(x, y, z, "stone_bricks");
  if (dEff < 2) {
    const facing = z < zMid ? "north" : "south";
    put(x, eave + dEff, z, "deepslate_tile_stairs", {
      facing, half: "bottom", shape: "straight", waterlogged: "false",
    });
  } else {
    put(x, eave + 2, z, "deepslate_tiles");
  }
}

// 2) Windows: glass panes in frames with lintel course, carved interior gap, some warm lights
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  if (gr + 4 > eave - 1) continue;
  if (x === doorX && z === doorZ) continue;

  let dx = 0, dz = 0;
  if (z === 0) dz = 1;
  else if (z === maxZ) dz = -1;
  else if (x === 0) dx = 1;
  else if (x === maxX) dx = -1;
  const alongX = dz !== 0;

  const lit = (x + z) % 2 === 0;
  for (let y = gr + 1; y <= gr + 2; y++) {
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "glass_pane", paneProps);
    const ix = x + dx, iz = z + dz;
    if (map.has(`${ix},${iz}`)) {
      if (lit && y === gr + 1) put(ix, y, iz, "shroomlight");
      else put(ix, y, iz, "air");
    }
  }
  put(x, gr, z, "polished_andesite");   // sill course
  put(x, gr + 3, z, "polished_andesite"); // lintel course
}

// 3) Entrance on the south face: door, jambs, lintel
const dg = map.get(`${doorX},${doorZ}`);
if (dg) {
  const gr = dg.gr;
  put(doorX, gr, doorZ, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 1, doorZ, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // jambs and lintel in polished andesite
  for (const jx of [doorX - 1, doorX + 1]) {
    if (map.has(`${jx},${doorZ}`)) {
      put(jx, gr, doorZ, "polished_andesite");
      put(jx, gr + 1, doorZ, "polished_andesite");
      put(jx, gr + 2, doorZ, "polished_andesite");
    }
  }
  put(doorX, gr + 2, doorZ, "polished_andesite");
  // door opens into a small inner air gap
  put(doorX, gr, doorZ - 1, "air");
  put(doorX, gr + 1, doorZ - 1, "air");
}

// 4) Chimney rising from the ridge, on the west side of the roof
const chimneyX = 1, chimneyZ = 2;
if (map.has(`${chimneyX},${chimneyZ}`)) {
  put(chimneyX, eave + 3, chimneyZ, "bricks");
  put(chimneyX, eave + 4, chimneyZ, "bricks");
  put(chimneyX, eave + 5, chimneyZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
