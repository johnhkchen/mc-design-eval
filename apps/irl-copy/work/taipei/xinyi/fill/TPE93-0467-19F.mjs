import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0467-19F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 54, H = 105, D = 51;
const ROOF = 93;            // roof level above lowest ground (lidar record)
const PODIUM = 3;           // commercial podium storeys
const g = new Voxels([W, H, D]);

// ---- footprint, depth from the outer edge -------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const fp = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

const depth = new Map();
const queue = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!fp(x - 1, z) || !fp(x + 1, z) || !fp(x, z - 1) || !fp(x, z + 1)) {
    depth.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (fp(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dep = (x, z) => depth.get(key(x, z)) || 0;

// set membership per level: podium uses the full footprint, tower is set back one cell
const inSet = (x, z, k) => fp(x, z) && (k < PODIUM || dep(x, z) >= 2);
const isSetEdge = (x, z, k) =>
  !inSet(x - 1, z, k) || !inSet(x + 1, z, k) || !inSet(x, z - 1, k) || !inSet(x, z + 1, k);
const isOuterEdge = (x, z) => !fp(x - 1, z) || !fp(x + 1, z) || !fp(x, z - 1) || !fp(x, z + 1);
const inTower = (x, z) => fp(x, z) && dep(x, z) >= 2;

// ---- storey levels: 5-block storeys from the cell's ground up to ROOF ----
function storeyLevels(gr) {
  const span = ROOF - gr;
  if (span < 4) return { N: 1, L: [gr, ROOF] };
  const N = Math.max(1, Math.floor(span / 5));
  const h = span / N;
  const L = [];
  for (let k = 0; k <= N; k++) L.push(k === N ? ROOF : gr + Math.floor(k * h));
  return { N, L };
}

let zMin = Infinity;
for (const [, z] of cells) zMin = Math.min(zMin, z);
const CX = Math.round(W / 2);

function place(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!fp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- main build: per footprint cell ------------------------------------
for (const k0 of ground.keys()) {
  const [x, z] = k0.split(",").map(Number);
  const gr = ground.get(k0);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) place(x, y, z, "stone_bricks");

  const { N, L } = storeyLevels(gr);

  for (let k = 0; k < N; k++) {
    const b = L[k], t = L[k + 1];
    const active = inSet(x, z, k);

    // floor slab at every storey bottom; the podium roof doubles as a terrace
    if (active || (k === PODIUM && fp(x, z))) place(x, b, z, "light_gray_concrete");

    if (!active) {
      // terrace on the podium roof: railing on the outer boundary only
      if (k === PODIUM && isOuterEdge(x, z)) place(x, b + 1, z, "iron_bars");
      continue;
    }

    if (!isSetEdge(x, z, k)) {
      // interior: warm light behind a window line, inside the air gap
      continue;
    }

    // ---- facade on the set's edge ----
    const xs = !inSet(x - 1, z, k) && !inSet(x + 1, z, k);
    const zs = !inSet(x, z - 1, k) && !inSet(x, z + 1, k);
    const corner = xs || zs;
    const entrance = k === 0 && z === zMin && Math.abs(x - CX) <= 2;
    const flank = k === 0 && z === zMin && (x === CX - 3 || x === CX + 3);
    const pier = corner || flank || (x + z) % 3 === 0;
    const fin = !corner && (x + z) % 9 === 4;

    for (let y = b + 1; y < t; y++) {
      if (y === t - 1) {
        // storey line: alternating banding
        place(x, y, z, k % 2 === 0 ? "white_concrete" : "light_gray_concrete");
      } else if (entrance && (y === b + 1 || y === b + 2)) {
        // recessed entrance opening (glass back wall is set inside)
        continue;
      } else if (entrance && y === b + 3) {
        // canopy lintel across the entrance
        place(x, y, z, "smooth_quartz");
      } else if (k === 0 && y === b + 1) {
        // base course
        place(x, y, z, "polished_granite");
      } else if (pier) {
        place(x, y, z, corner ? "smooth_quartz" : fin ? "smooth_quartz" : "white_concrete");
      } else {
        place(x, y, z, "light_blue_stained_glass");
      }
    }

    if (entrance) {
      // glass back wall of the recess (interior row) and a glowing lobby behind it
      const iz = z + 1;
      if (inSet(x, iz, k)) {
        place(x, b + 1, iz, "glass");
        place(x, b + 2, iz, "glass");
      }
      if (inSet(x, z + 2, k)) place(x, b + 1, z + 2, "glowstone");
      continue;
    }

    // warm lights behind some windows
    if (!pier && k > 0 && (x * 5 + z * 3 + k * 2) % 5 === 0) {
      const dx = !inSet(x - 1, z, k) ? 1 : (!inSet(x + 1, z, k) ? -1 : 0);
      const dz = !inSet(x, z - 1, k) ? 1 : (!inSet(x, z + 1, k) ? -1 : 0);
      const ix = x + dx, iz = z + dz;
      if ((dx || dz) && inSet(ix, iz, k) && !isSetEdge(ix, iz, k)) {
        place(ix, b + 2, iz, "glowstone");
      }
    }
  }

  // roof slab and parapet on the tower (or on podium-only cells)
  const topCell = inTower(x, z) || N <= PODIUM;
  if (topCell) {
    place(x, ROOF, z, "light_gray_concrete");
    if (isSetEdge(x, z, Math.max(0, N - 1))) place(x, ROOF + 1, z, "white_concrete");
  }
}

// ---- roof plant: mechanical penthouse, crown tier, mast -----------------
const PX0 = 16, PX1 = 37, PZ0 = 16, PZ1 = 34;
const CRX0 = 22, CRX1 = 31, CRZ0 = 22, CRZ1 = 28;
const MX = 26, MZ = 25;

for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!inTower(x, z)) continue;
    const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      if (wall) place(x, y, z, (y - ROOF) % 2 === 0 ? "smooth_quartz" : "light_blue_stained_glass");
      else place(x, y, z, "light_gray_concrete");
    }
    place(x, ROOF + 5, z, "white_concrete");
  }
}
for (let x = CRX0; x <= CRX1; x++) {
  for (let z = CRZ0; z <= CRZ1; z++) {
    if (!inTower(x, z)) continue;
    const wall = x === CRX0 || x === CRX1 || z === CRZ0 || z === CRZ1;
    for (let y = ROOF + 6; y <= ROOF + 9; y++) {
      if (wall) place(x, y, z, "light_blue_stained_glass");
      else place(x, y, z, "white_concrete");
    }
    place(x, ROOF + 10, z, "smooth_quartz");
  }
}
if (inTower(MX, MZ)) {
  place(MX, ROOF + 10, MZ, "iron_block");
  place(MX, ROOF + 11, MZ, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
