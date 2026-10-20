import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690452";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 40, H = 23, D = 23;
const ROOF_TOP = 11;      // parapet top, ~11 blocks above lowest ground
const FLOOR_LINE = 6;     // second-floor slab
const ROOF_SLAB = 10;     // roof deck
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const KEY = (x, y, z) => `${x},${y},${z}`;

// footprint -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// facade depth: 0 = touches outside, grows inward (4-neighbour BFS)
const depth = new Map();
const queue = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !has(x + dx, z + dz))) {
    depth.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(`${x},${z}`);
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    const nk = `${nx},${nz}`;
    if (has(nx, nz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dep = (x, z) => depth.get(`${x},${z}`) ?? 99;

// outward normal of a facade cell
const normal = (x, z) => {
  for (const [dx, dz] of N4) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
};

// is this facade cell part of a continuous run (not a corner)?
const runOK = (x, z, n) => {
  const [nx, nz] = n;
  const a = nz !== 0 ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  return a.every(([ax, az]) => has(ax, az) && dep(ax, az) === 0);
};
const alongK = (x, z, n) => (n[1] !== 0 ? x : z);

// ---- choose the entrance: middle of the front (north-facing, -z) facade ----
let frontCells = [];
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (dep(x, z) !== 0) continue;
  const n = normal(x, z);
  if (n && n[0] === 0 && n[1] === -1) frontCells.push([x, z]);
}
if (frontCells.length === 0) {
  for (const [k] of G) {
    const [x, z] = k.split(",").map(Number);
    if (dep(x, z) === 0 && normal(x, z)) frontCells.push([x, z]);
  }
}
frontCells.sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = frontCells[Math.floor(frontCells.length / 2)];
const doorN = normal(doorX, doorZ);
const facingName = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" }[doorN.join(",")];
const doorGr = gnd(doorX, doorZ);
const doorSet = new Set([KEY(doorX, doorGr + 1, doorZ), KEY(doorX, doorGr + 2, doorZ)]);

// ---- window logic ----
const windowBand = (y, gr) =>
  (y >= gr + 1 && y <= Math.min(gr + 3, 5)) || (y >= 7 && y <= 9);

const isWindow = (x, z, y) => {
  if (dep(x, z) !== 0) return false;
  const n = normal(x, z);
  if (!n || !runOK(x, z, n)) return false;
  const gr = gnd(x, z);
  if (!windowBand(y, gr)) return false;
  if (doorX === x && doorZ === z) return false;
  if (alongK(x, z, n) % 4 === 0) return false;
  const ix = x - n[0], iz = z - n[1];
  if (!has(ix, iz) || dep(ix, iz) < 1) return false;
  return y > gnd(ix, iz);
};

// air pockets behind glass, plus warm lights
const air = new Set();
const light = new Map();
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  const n = normal(x, z);
  if (dep(x, z) !== 0 || !n) continue;
  const ix = x - n[0], iz = z - n[1];
  for (let y = 0; y <= ROOF_TOP; y++) {
    if (!isWindow(x, z, y)) continue;
    const ik = KEY(ix, y, iz);
    air.add(ik);
    const kk = alongK(x, z, n);
    if (kk % 8 === 2 && y === 8) light.set(ik, "shroomlight");
    if (kk % 8 === 6 && y === gnd(x, z) + 1) light.set(ik, "glowstone");
  }
}
// doorway: open air behind the door
{
  const ix = doorX - doorN[0], iz = doorZ - doorN[1];
  for (const y of [doorGr + 1, doorGr + 2]) {
    if (y > gnd(ix, iz)) {
      air.add(KEY(ix, y, iz));
      light.delete(KEY(ix, y, iz));
    }
  }
}

// rooftop plant: small AC/plant units on the deck, set back from the parapet
const equip = (x, z, gr) => dep(x, z) >= 2 && gr <= 9 && x % 8 === 4 && z % 6 === 3;

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const d = dep(x, z);
  const n = normal(x, z);

  // foundation / base course up to this cell's ground
  for (let y = 0; y <= gr; y++) S(x, y, z, "stone_bricks");

  for (let y = gr + 1; y <= ROOF_TOP; y++) {
    const key = KEY(x, y, z);
    if (air.has(key)) continue;
    if (light.has(key)) { S(x, y, z, light.get(key)); continue; }

    if (doorSet.has(key)) {
      const half = y === doorGr + 1 ? "lower" : "upper";
      S(x, y, z, "dark_oak_door", {
        facing: facingName, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (d === 0 && n) {
      if (y === ROOF_TOP) { S(x, y, z, "white_concrete"); continue; }   // parapet
      if (y === FLOOR_LINE || y === ROOF_SLAB) { S(x, y, z, "smooth_stone"); continue; }
      if (isWindow(x, z, y)) {
        const glass = n[1] !== 0
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        S(x, y, z, "light_blue_stained_glass_pane", glass);
        continue;
      }
      const pier = !runOK(x, z, n) || alongK(x, z, n) % 4 === 0;
      S(x, y, z, pier ? "smooth_quartz" : "white_concrete");
      continue;
    }

    // interior mass (no walk-in interiors)
    if (y === ROOF_TOP) continue;
    if (y === FLOOR_LINE || y === ROOF_SLAB) { S(x, y, z, "light_gray_concrete"); continue; }
    S(x, y, z, "light_gray_concrete");
  }

  // roof deck is continuous over the footprint (slab at ROOF_SLAB)
  if (gr < ROOF_SLAB) {
    if (!air.has(KEY(x, ROOF_SLAB, z))) S(x, ROOF_SLAB, z, d === 0 ? "smooth_stone" : "light_gray_concrete");
  }

  // rooftop equipment, standing on the deck
  if (equip(x, z, gr)) {
    S(x, ROOF_TOP, z, "light_gray_concrete");
    S(x, ROOF_TOP + 1, z, "iron_block");
  }
}

g.save(`${BASE}/${ID}.nbt`);
