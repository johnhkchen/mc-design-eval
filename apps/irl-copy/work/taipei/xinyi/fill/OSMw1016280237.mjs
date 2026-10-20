import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280237";
const W = 22, H = 33, D = 17;
const ROOF = 20;          // roof deck row; storeys are 5 blocks, slabs at 5, 10, 15, 20
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint helpers ----
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, n: "north" }, { dx: 0, dz: 1, n: "south" },
  { dx: -1, dz: 0, n: "west" },  { dx: 1, dz: 0, n: "east" },
];
const nrmOf = (x, z) => DIRS.filter(e => !inF(x + e.dx, z + e.dz));
const along = (x, z, e) => (e.dz ? x : z);          // coordinate running along a facade
const isPierAt = (x, z, nrm, e) => {
  const corner = nrm.some(q => q.dx) && nrm.some(q => q.dz);
  return corner || along(x, z, e) % 3 === 0;
};

// ---- output map (later puts overwrite earlier ones) ----
const out = new Map();
const put = (x, y, z, id, p) => out.set(`${x},${y},${z}`, [x, y, z, id, p]);

// ---- 1. foundation, walls, slabs ----
for (const [x, z, gr] of cells) {
  const nrm = nrmOf(x, z);
  const perim = nrm.length > 0;
  const e = nrm[0];

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y > 0 && y % 5 === 0) { put(x, y, z, "smooth_stone"); continue; } // floor slabs / roof deck
    if (!perim) continue;                                                  // interior stays air
    const s = Math.floor(y / 5), rel = y % 5;
    const pier = isPierAt(x, z, nrm, e);
    if (s === 0) {
      if (y === 0) put(x, y, z, "polished_andesite");                      // plinth
      else if (y === 4) put(x, y, z, "white_concrete");                     // shopfront fascia
      else if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");                        // shopfront glazing
    } else {
      if (rel === 4) put(x, y, z, "light_gray_concrete");                   // spandrel
      else if (pier) put(x, y, z, "white_concrete");                        // mullion / pier
      else put(x, y, z, "light_blue_stained_glass");                        // window pane
    }
  }

  // parapet and cap
  if (perim) {
    put(x, 21, z, "white_concrete");
    put(x, 22, z, "smooth_stone");
  }
}

// ---- 2. entrance: pick a street-facing cell near the middle ----
let door = null, bestScore = Infinity;
const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length;
for (const [x, z, gr] of cells) {
  for (const e of nrmOf(x, z)) {
    const score = Math.abs(along(x, z, e) - (e.dz ? cx : cells.reduce((a, c) => a + c[1], 0) / cells.length))
      + gr * 4 + (e.dz ? 0 : 1.5);
    if (score < bestScore) { bestScore = score; door = { x, z, gr, e }; }
  }
}

if (door) {
  // red awning over the entrance bay, on the same facade, at row 3
  const dAlong = along(door.x, door.z, door.e);
  for (const [x, z, gr] of cells) {
    if (gr > 3) continue;
    const nrm = nrmOf(x, z);
    const m = nrm.find(q => q.dx === door.e.dx && q.dz === door.e.dz);
    if (m && Math.abs(along(x, z, m) - dAlong) <= 1) put(x, 3, z, "red_concrete");
  }
  // door: lower and upper halves, facing outward
  const yD = Math.max(door.gr, 1);
  const f = door.e.n;
  put(door.x, yD, door.z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, yD + 1, door.z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- 3. warm light behind some glazing (glowstone one bay in, in the air gap) ----
for (const [x, z, gr] of cells) {
  const nrm = nrmOf(x, z);
  if (!nrm.length) continue;
  const e = nrm[0];
  if (isPierAt(x, z, nrm, e)) continue;
  const s = 0; // placeholder for clarity below
  for (let st = 0; st <= 3; st++) {
    const y = st * 5 + 2;
    if (y < gr) continue;
    if (door && x === door.x && z === door.z && (y === Math.max(door.gr, 1) || y === Math.max(door.gr, 1) + 1)) continue;
    const h = (x * 7 + z * 13 + st * 5) % 4;
    if (h !== 0 && !((x + z + st) % 7 === 0)) continue;
    const ix = x - e.dx, iz = z - e.dz;
    if (inF(ix, iz) && nrmOf(ix, iz).length === 0 && iz !== undefined) {
      put(ix, y, iz, (x + z + st) % 3 === 0 ? "shroomlight" : "glowstone");
    }
  }
}

// ---- 4. roof plant: stepped box, crown and lightning rod ----
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (nrmOf(x, z).length) continue;
  if (x >= 6 && x <= 14 && z >= 5 && z <= 11) put(x, 21, z, "gray_concrete");
  if (x >= 8 && x <= 12 && z >= 6 && z <= 10) put(x, 22, z, "light_gray_concrete");
  if (x >= 9 && x <= 11 && z >= 7 && z <= 9) put(x, 23, z, "white_concrete");
}
if (inF(10, 8) && nrmOf(10, 8).length === 0) {
  put(10, 24, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// ---- write ----
const g = new Voxels([W, H, D]);
for (const [x, y, z, id, p] of out.values()) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) continue;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}
g.save(`${DIR}/${ID}.nbt`);
