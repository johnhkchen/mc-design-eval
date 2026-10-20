import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253354";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 19, D = 12;
const g = new Voxels([W, H, D]);

// Helpers
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const ORDER = ["north", "south", "west", "east"];

// Outward facing direction for each exterior cell (first missing neighbour in order)
const outward = new Map();
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const d of ORDER) {
    const [dx, dz] = DIRS[d];
    if (!has(x + dx, z + dz)) {
      outward.set(key(x, z), d);
      faceCount[d]++;
      break;
    }
  }
}

// Main street frontage: south if it has enough cells, otherwise the largest face
let front = "south";
if (faceCount.south < 3) {
  front = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
}

// Entrance: median cell along the front face
const frontCells = cells
  .map(c => [c[0], c[1]])
  .filter(([x, z]) => outward.get(key(x, z)) === front);
const alongAxis = front === "north" || front === "south" ? 0 : 1;
const frontCoords = frontCells.map(c => c[alongAxis]).sort((a, b) => a - b);
const doorCoord = frontCoords.length ? frontCoords[Math.floor(frontCoords.length / 2)] : -1;
const minAlong = Math.min(...frontCoords);
const minAlongAll = {
  north: Math.min(...cells.filter(c => outward.get(key(c[0], c[1])) === "north").map(c => c[0]), 99),
  south: Math.min(...cells.filter(c => outward.get(key(c[0], c[1])) === "south").map(c => c[0]), 99),
  west: Math.min(...cells.filter(c => outward.get(key(c[0], c[1])) === "west").map(c => c[1]), 99),
  east: Math.min(...cells.filter(c => outward.get(key(c[0], c[1])) === "east").map(c => c[1]), 99),
};

// Glass pane connection props for the wall plane
function paneProps(d) {
  const ns = d === "north" || d === "south";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
}

// Pass 1: foundations, roof deck, facades, parapet
for (const [x, z, gr] of cells) {
  // Foundation fill from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Roof deck (storey ceiling / roof slab) on every footprint cell
  set(x, gr + 5, z, "light_gray_concrete");

  const d = outward.get(key(x, z));
  if (!d) {
    // Interior: air gap behind glass, roof equipment on a grid
    if (x % 4 === 2 && z % 4 === 2) set(x, gr + 6, z, "iron_block");
    continue;
  }

  const along = d === "north" || d === "south" ? x : z;
  const min = minAlongAll[d];
  const c = along - min;
  const isWin = c % 3 === 1;
  const isShop = d === front;
  const isDoor = isShop && d === front && along === doorCoord && cells.length && true;

  // Base course
  set(x, gr, z, "stone_bricks");

  // Storey line and parapet
  set(x, gr + 5, z, "red_terracotta");
  set(x, gr + 6, z, "red_terracotta");

  if (isShop) {
    if (isDoor) {
      // Entrance door, lantern hanging from the lintel
      const facing = OPP[d];
      set(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      set(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      set(x, gr + 4, z, "white_concrete");
    } else if (isWin) {
      // Shopfront glass with spandrel and lintel
      set(x, gr + 1, z, "glass");
      set(x, gr + 2, z, "glass");
      set(x, gr + 3, z, "light_gray_concrete");
      set(x, gr + 4, z, "white_concrete");
    } else {
      // Piers
      for (let h = 1; h <= 4; h++) set(x, gr + h, z, "white_concrete");
    }
  } else {
    if (isWin) {
      // Window: sill, framed glass pane run, lintel
      set(x, gr + 1, z, "smooth_stone");
      const p = paneProps(d);
      for (let h = 2; h <= 3; h++) set(x, gr + h, z, "glass_pane", p);
      set(x, gr + 4, z, "light_gray_concrete");
    } else {
      for (let h = 1; h <= 4; h++) set(x, gr + h, z, "white_concrete");
    }
  }
}

// Pass 2: warm lights just inside some upper-floor windows (behind the glass)
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const d = outward.get(key(x, z));
  if (!d || d === front) continue;
  const along = d === "north" || d === "south" ? x : z;
  const c = along - minAlongAll[d];
  if (c % 6 !== 1) continue;
  const [dx, dz] = DIRS[OPP[d]];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (outward.get(key(ix, iz))) continue; // only truly interior cells
  set(ix, gOf(ix, iz) + 2, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
