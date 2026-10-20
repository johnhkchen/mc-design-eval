import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098845";
const W = 19, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const NORM = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Outward normal of an edge cell: the first side whose neighbour is outside the footprint.
function edgeNormal(x, z) {
  for (const d of ["north", "south", "east", "west"]) {
    const [dx, dz] = NORM[d];
    if (!has(x + dx, z + dz)) return d;
  }
  return null;
}

// Along-wall unit vector for a given outward normal.
function alongVec(d) {
  return d === "north" || d === "south" ? [1, 0] : [0, 1];
}
function alongIndex(x, z, d) {
  return d === "north" || d === "south" ? x : z;
}

// Count edge cells per facade to pick the front (entrance) face.
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
const edgeList = [];
for (const [x, z, gr] of cells) {
  const n = edgeNormal(x, z);
  if (n) {
    faceCount[n]++;
    edgeList.push({ x, z, gr, n });
  }
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Is a cell a regular wall run cell on the same facade (not a corner)?
function sameWall(x, z, d) {
  return has(x, z) && edgeNormal(x, z) === d;
}
function isPier(x, z, d) {
  const [ax, az] = alongVec(d);
  return !sameWall(x + ax, z + az, d) || !sameWall(x - ax, z - az, d);
}

// Pick a door cell: middle of the front face's non-pier cells.
const frontCells = edgeList
  .filter((c) => c.n === front && !isPier(c.x, c.z, front))
  .sort((a, b) => alongIndex(a.x, a.z, front) - alongIndex(b.x, b.z, front));
const doorCell = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : null;
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;

function paneProps(d) {
  if (d === "north" || d === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const WALL = "white_terracotta";
const BAND = "smooth_quartz";
const BASE = "stone_bricks";
const FRAME = "light_gray_concrete";

// ---- Pass 1: foundations, interior floors and roof; edge facades ----
for (const [x, z, gr] of cells) {
  const n = edgeNormal(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!n) {
    // Interior: floor slabs at gr and gr+5, roof slab at gr+10. Air between.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    continue;
  }

  // Edge (facade) cell.
  const pier = isPier(x, z, n);
  const along = alongIndex(x, z, n);
  const isDoor = doorKey === `${x},${z}`;
  const windowCol = !pier && along % 3 !== 0;

  // Base course.
  put(x, gr, z, BASE);

  // Storey 1 (gr+1..gr+3 openings, gr+4 band).
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y <= gr + 2) {
      const dprops = {
        facing: OPP[front],
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      put(x, y, z, "oak_door", dprops);
    } else if (windowCol) {
      put(x, y, z, "glass_pane", paneProps(n));
    } else {
      put(x, y, z, pier ? WALL : FRAME);
    }
  }
  put(x, gr + 4, z, BAND);

  // Storey 2 (gr+6..gr+8 openings, gr+5 and gr+9 bands).
  put(x, gr + 5, z, pier ? FRAME : WALL);
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (windowCol) put(x, y, z, "glass_pane", paneProps(n));
    else put(x, y, z, pier ? WALL : FRAME);
  }
  put(x, gr + 9, z, BAND);

  // Cornice / parapet cap at gr+10.
  put(x, gr + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// ---- Pass 2: warm lights behind selected windows ----
for (const c of edgeList) {
  const { x, z, gr, n } = c;
  if (isPier(x, z, n)) continue;
  const along = alongIndex(x, z, n);
  if (doorKey === `${x},${z}`) continue;
  const [nx, nz] = NORM[n];
  const ix = x - nx;
  const iz = z - nz;
  if (!has(ix, iz) || edgeNormal(ix, iz)) continue; // need an interior cell
  const igr = gAt(ix, iz);
  if (igr !== gr) continue;
  if (along % 6 === 1) put(ix, gr + 1, iz, "glowstone");
  if (along % 6 === 4) put(ix, gr + 6, iz, "shroomlight");
}

// ---- Pass 3: rooftop plant on interior roof cells ----
for (const [x, z, gr] of cells) {
  if (edgeNormal(x, z)) continue;
  if (x >= 6 && x <= 10 && z >= 7 && z <= 10) {
    put(x, gr + 11, z, FRAME);
    if (x >= 7 && x <= 9 && z >= 8 && z <= 9) {
      put(x, gr + 12, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
