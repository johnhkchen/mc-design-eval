import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial low-rise block, two storeys over a ground-floor shopfront line,
// white-tiled concrete piers, grey window heads and sills, quartz cornice,
// stone base course, parapet with rooftop AC plinths. Read from the air as a
// pale rectangle with a stone plinth and roof plant; at dusk the upper windows
// glow from glowstone set just inside the glass.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365483";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 36, H = 23, D = 66;
const ROOF_Y = 11;     // roof deck level above lowest ground (lidar record)
const CORNICE_Y = 10;  // top of the second storey walls
const BAND_Y = 5;      // storey line between the two storeys
const GROUND_TOP = 4;  // top of the shopfront storey
const PARAPET_Y = 12;  // first parapet course
const CAP_Y = 13;      // parapet cap / plant top

const g = new Voxels([W, H, D]);
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(gr, H - 10)));

const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward neighbours: [dx, dz, facing name]
const NB = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// Classify every footprint cell
const info = [];
for (const [x, z] of cells) {
  const out = NB.filter(([dx, dz]) => !has(x + dx, z + dz));
  info.push({ x, z, gr: gr(x, z), out, edge: out.length > 0, corner: out.length >= 2 });
}

// Pick the front (entrance) face: the outward face with the most non-corner edge cells, preferring south
const faceCount = {};
for (const c of info) if (c.edge && !c.corner) {
  const f = c.out[0][2];
  faceCount[f] = (faceCount[f] || 0) + 1;
}
let front = "south";
if (!faceCount.south) front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Median position along the front face for the entrance
const frontCells = info.filter(c => c.edge && !c.corner && c.out[0][2] === front);
let doorCell = null;
if (frontCells.length) {
  const alongX = frontCells[0].out[0][1] !== 0; // face runs along x
  const sorted = [...frontCells].sort((a, b) => (alongX ? a.x - b.x : a.z - b.z));
  doorCell = sorted[Math.floor(sorted.length / 2)];
}

const isDoor = (c) => doorCell && c.x === doorCell.x && c.z === doorCell.z;

// ---- 1. Foundation, floor surfaces, roof deck, and parapet/plant ----
for (const c of info) {
  const { x, z } = c;
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < c.gr; y++) put(x, y, z, "stone_bricks");
  // floor surface at ground level
  put(x, c.gr, z, "smooth_stone");
  // storey floor slab at band level, interior only (edges handled below)
  if (BAND_Y > c.gr && !c.edge) put(x, BAND_Y, z, "smooth_stone");
  // roof deck at ROOF_Y
  put(x, ROOF_Y, z, c.edge ? "smooth_stone" : "light_gray_concrete");
}

// ---- 2. Walls, windows, cornice, parapet on edge cells ----
for (const c of info) {
  if (!c.edge) continue;
  const { x, z } = c;
  const [dx, dz] = c.out[0];
  const alongX = dz !== 0;
  const t = alongX ? x : z;
  const isWinCol = !c.corner && (t % 4 !== 0);

  for (let y = c.gr + 1; y <= CORNICE_Y; y++) {
    if (c.corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    // Entrance door occupies the lower two ground rows
    if (isDoor(c) && (y === c.gr + 1 || y === c.gr + 2)) {
      put(x, y, z, "iron_door", {
        facing: front,
        half: y === c.gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === c.gr + 1 && y <= GROUND_TOP) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (y <= GROUND_TOP) {
      // shopfront storey
      if (!isWinCol) put(x, y, z, "white_concrete");
      else if (y === GROUND_TOP) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", paneProps(alongX));
      continue;
    }
    if (y === BAND_Y) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (y <= 9) {
      // upper storey
      if (!isWinCol) put(x, y, z, "white_concrete");
      else if (y === 6 || y === 9) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", paneProps(alongX));
      continue;
    }
    // y === CORNICE_Y
    put(x, y, z, "quartz_block");
  }

  // roof deck edge and parapet
  if (c.corner) {
    put(x, PARAPET_Y, z, "quartz_pillar", { axis: "y" });
    put(x, CAP_Y, z, "quartz_slab", { type: "top", waterlogged: "false" });
  } else {
    put(x, PARAPET_Y, z, "white_concrete");
    put(x, CAP_Y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

function paneProps(alongX) {
  // a pane on a face running along x connects east-west, and vice versa
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// ---- 3. Warm light just inside selected windows and at the entrance ----
for (const c of info) {
  if (!c.edge || c.corner || isDoor(c)) continue;
  const [dx, dz] = c.out[0];
  const alongX = dz !== 0;
  const t = alongX ? c.x : c.z;
  const isWinCol = t % 4 !== 0;
  if (!isWinCol) continue;
  const ix = c.x - dx, iz = c.z - dz;
  if (!has(ix, iz)) continue;

  // upper storey: glowstone behind every other window
  if (((t >> 2) % 2) === 0 && t % 4 === 2) {
    put(ix, 8, iz, "glowstone");
  }
  // shopfront: shroomlight behind selected display windows
  if (t % 8 === 6 && c.gr + 3 <= GROUND_TOP) {
    put(ix, c.gr + 2, iz, "shroomlight");
  }
}

if (doorCell) {
  const [dx, dz] = doorCell.out[0];
  const ix = doorCell.x - dx, iz = doorCell.z - dz;
  // lintel over the door
  put(doorCell.x, doorCell.gr + 3, doorCell.z, "light_gray_concrete");
  // warm lantern just inside the entrance
  if (has(ix, iz)) put(ix, doorCell.gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- 4. Rooftop plant: 2x2 AC plinths with units on a sparse grid ----
for (const c of info) {
  if (c.edge) continue;
  const { x, z } = c;
  if ((x % 12 === 4 || x % 12 === 5) && (z % 12 === 4 || z % 12 === 5)) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "iron_block");
  }
}

g.save(`${BASE}/${ID}.nbt`);
