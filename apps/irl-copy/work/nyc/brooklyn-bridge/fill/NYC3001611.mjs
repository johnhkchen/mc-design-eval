import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001611";
const W = 6, H = 22, D = 11;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const cellMap = new Map();
for (const c of list) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// One shared flat roof tier (median lidar roof), clamped above every ground.
const grounds = [...cellMap.values()].map(v => v.g);
const roofs = [...cellMap.values()].map(v => v.r).sort((a, b) => a - b);
const maxG = Math.max(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const roofY = Math.min(H - 4, Math.max(maxG + 4, medRoof));

const FACES = [
  { dx: -1, dz: 0, face: "west", inDx: 1, inDz: 0 },
  { dx: 1, dz: 0, face: "east", inDx: -1, inDz: 0 },
  { dx: 0, dz: -1, face: "north", inDx: 0, inDz: 1 },
  { dx: 0, dz: 1, face: "south", inDx: 0, inDz: -1 },
];
const exposedFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));
const isWinCell = (x, z, faces) =>
  faces.some(f => (f.face === "north" || f.face === "south") ? x % 2 === 1 : z % 2 === 1);

// Entrance on the north (low z) face, nearest the middle of the width.
const northCells = [...cellMap.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z - 1));
let doorCell = null;
if (northCells.length) {
  northCells.sort((a, b) => Math.abs(a[0] - 2.5) - Math.abs(b[0] - 2.5) || a[1] - b[1]);
  doorCell = northCells[0];
}
const isDoor = (x, z) => !!doorCell && doorCell[0] === x && doorCell[1] === z;
// Door surround: the north-face cells beside the door become stone pilasters.
const isPilaster = (x, z) =>
  !!doorCell && z === doorCell[1] && Math.abs(x - doorCell[0]) === 1 && !has(x, z - 1);

// Pass 1: foundations, walls, storey bands, floors, roof.
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const n = Math.max(0, Math.floor((roofY - gr) / 2));

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks"); // foundation

  if (perimeter) {
    const win = isWinCell(x, z, faces) && !isPilaster(x, z) && !isDoor(x, z);
    for (let y = gr; y < roofY; y++) {
      let b = "bricks";
      let p;
      const rel = (y - gr) % 2;
      if (y < gr + 2 * n) {
        if (rel === 0) {
          b = "smooth_stone"; // storey string course
        } else if (win) {
          b = "glass_pane";
          p = { north: "true", south: "true", east: "true", west: "true" };
        }
      }
      if (corner && b === "bricks" && y % 2 === 0) b = "stone_bricks"; // quoins
      if (isPilaster(x, z) && y < gr + 2) b = "stone_bricks";
      if (isDoor(x, z) && y === gr + 2) b = "chiseled_stone_bricks"; // lintel
      put(x, y, z, b, p);
    }
    if (isDoor(x, z)) {
      const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gr, z, "oak_door", { ...dp, half: "lower" });
      put(x, gr + 1, z, "oak_door", { ...dp, half: "upper" });
    }
    put(x, roofY, z, "smooth_stone"); // cornice
  } else {
    for (let k = 0; k < n; k++) put(x, gr + 2 * k, z, "oak_planks"); // floor slabs
    put(x, roofY, z, "black_concrete"); // tar roof deck
  }
}

// Pass 2: warm lights behind some windows, and a lantern inside the door.
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  if (!faces.length) continue;
  const n = Math.max(0, Math.floor((roofY - gr) / 2));
  for (let k = 0; k < n; k++) {
    const y = gr + 2 * k + 1;
    if (!isWinCell(x, z, faces) || isDoor(x, z) || isPilaster(x, z)) continue;
    if ((x * 7 + z * 3 + k) % 3 !== 0) continue;
    for (const f of faces) {
      const ix = x + f.inDx, iz = z + f.inDz;
      if (!has(ix, iz) || exposedFaces(ix, iz).length) continue;
      if (cellMap.get(`${ix},${iz}`).g !== gr) continue;
      put(ix, y, iz, "glowstone");
      break;
    }
  }
}
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = cellMap.get(`${dx},${dz}`).g;
  const iz = dz + 1;
  if (has(dx, iz) && !exposedFaces(dx, iz).length) {
    put(dx, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: chimney stacks on interior roof cells.
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (exposedFaces(x, z).length) continue;
  if (roofY - gr < 4) continue;
  if ((x * 2 + z) % 5 !== 0) continue;
  if (roofY + 2 < H) {
    put(x, roofY + 1, z, "bricks");
    put(x, roofY + 2, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
