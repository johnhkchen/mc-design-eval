// A 1920s-30s brick commercial block on the Eden Terrace side of the CBD: two storeys of brick over a shopfront
// ground floor, white-render bands and a stone corbel course, a 3-storey wing and a 4-storey corner tower on the
// lidar's raised reads. Walls are shells (glass behind air, a floor slab per storey), the plinth fills down to each
// cell's ground, and every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269385747.cells.json", "utf8"));
const W = 45, D = 50, H = 32;
const k = (x, z) => z * W + x;
const inFoot = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Float64Array(W * D);
for (const [x, z, g, r] of cells) { inFoot[k(x, z)] = 1; G[k(x, z)] = g; R[k(x, z)] = r; }
const ok = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFoot[k(x, z)] === 1;

// The lidar roof reads speckle at the edges and thin strips read as chimneys: take the 5x5 median of the footprint's own reads, then snap to tiers
// that are whole storeys (4 blocks) with a 2-block parapet/cornice on top: 8 = two storeys, 10 = two and a parapet,
// 12 = three storeys, 16 = four storeys.
const tier = (r) => (r <= 8 ? 8 : r <= 11 ? 10 : r <= 14 ? 12 : 16);
const T = new Int32Array(W * D);
for (const [x, z] of cells) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (ok(x + dx, z + dz)) vals.push(R[k(x + dx, z + dz)]);
  vals.sort((a, b) => a - b);
  T[k(x, z)] = tier(vals[vals.length >> 1]);
}

const FACES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
// the faces a cell shows to the outside: off the footprint (street side) or onto a lower neighbour (a setback step)
const outward = (x, z) => Object.keys(FACES).filter(f => !ok(x + FACES[f][0], z + FACES[f][1]));
const stepFaces = (x, z) => Object.keys(FACES).filter(f => ok(x + FACES[f][0], z + FACES[f][1]) && T[k(x + FACES[f][0], z + FACES[f][1])] < T[k(x, z)]);

// the street front: the outward face with the lowest mean ground (its door is at the middle of that face)
const faceCells = { N: [], S: [], E: [], W: [] };
for (const [x, z] of cells) for (const f of outward(x, z)) faceCells[f].push([x, z]);
let entrance = null, best = Infinity;
for (const f of ["N", "S", "E", "W"]) {
  const list = faceCells[f]; if (list.length < 8) continue;
  const mean = list.reduce((s, [x, z]) => s + G[k(x, z)], 0) / list.length;
  if (mean < best) { best = mean; entrance = f; }
}
const along = (f, x, z) => (f === "N" || f === "S" ? x : z);
const doorCell = (() => {
  const list = faceCells[entrance].slice().sort((a, b) => along(entrance, a[0], a[1]) - along(entrance, b[0], b[1]));
  const mid = list.slice(Math.floor(list.length / 2) - 3, Math.floor(list.length / 2) + 4);
  return mid.reduce((m, c) => (G[k(c[0], c[1])] < G[k(m[0], m[1])] ? c : m));
})();

// which face each facade cell is dressed on: the entrance front, then other street faces, then setback steps
const isFac = new Uint8Array(W * D), face = new Array(W * D).fill(null);
for (const [x, z] of cells) {
  const out = outward(x, z), step = stepFaces(x, z);
  if (!out.length && !step.length) continue;
  isFac[k(x, z)] = 1;
  face[k(x, z)] = out.includes(entrance) ? entrance : (out[0] ?? step[0]);
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, b, st) => v.set(x, y, z, b, st);
const paneState = (f) => (f === "N" || f === "S" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the facade block at height y on a cell's dressed face: plinth, storey bands, cornice, and windows in 4-block storeys
function facadeAt(x, y, z, gy, t, f) {
  if (y === gy) return ["stone_bricks"];
  if (y === t - 1) return ["smooth_stone"];                  // parapet cap
  if (y === t - 2) return ["stone_bricks"];                  // corbel course under the cap
  const r = y % 4;
  if (r === 0 || r === 3) return ["white_concrete"];          // render bands at each floor line and lintel
  const i = along(f, x, z) % 4;
  if (i === 0) return ["bricks"];                            // brick piers
  if (i === 2) return ["white_concrete"];                    // window mullion
  return ["glass_pane", paneState(f)];
}

// the entrance bay: door at the middle, solid jambs either side, and a dark canopy over the three
const [ex, ez] = doorCell;
const eg = G[k(ex, ez)];
const entranceJamb = new Set();   // the cells either side of the door: solid brick up to the lintel, not glass
for (const [x, z] of cells) {
  const d = Math.abs(along(entrance, x, z) - along(entrance, ex, ez));
  if (face[k(x, z)] === entrance && d === 1) entranceJamb.add(k(x, z));
}

for (const [x, z] of cells) {
  const i = k(x, z), gy = G[i], t = T[i];
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");          // foundation down to the cell's ground
  if (isFac[i]) {
    const f = face[i];
    for (let y = gy; y < t; y++) {
      if (entranceJamb.has(i) && y > gy && y <= eg + 2) put(x, y, z, "bricks");
      else { const [b, st] = facadeAt(x, y, z, gy, t, f); put(x, y, z, b, st); }
    }
  } else {
    // interior: a floor slab at the ground and each storey line, the cap on top, air between (no interior)
    for (let y = gy; y < t; y++) {
      if (y === gy || y % 4 === 0 || y === t - 2 || y === t - 1) put(x, y, z, "smooth_stone");
    }
  }
}

// the door and canopy on the entrance front
for (const half of ["lower", "upper"]) {
  put(ex, eg + (half === "lower" ? 1 : 2), ez, "oak_door", { facing: FACING[entrance], half, hinge: "left", open: "false", powered: "false" });
}
for (const d of [-1, 0, 1]) {
  const cx = entrance === "N" || entrance === "S" ? ex + d : ex;
  const cz = entrance === "E" || entrance === "W" ? ez + d : ez;
  if (!ok(cx, cz)) continue;
  put(cx, eg + 3, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // canopy over the door bay
}

// warm light behind some glass: a glowstone on the floor slab just inside the window (first row of each storey)
for (const [x, z] of cells) {
  const i = k(x, z); if (!isFac[i]) continue;
  const f = face[i], gy = G[i], t = T[i];
  for (let y = gy + 1; y < t - 2; y++) {
    if (y % 4 !== 1 || (along(f, x, z) % 4) % 2 === 0 || (x + z + y) % 3 !== 0) continue;
    const [dx, dz] = FACES[f]; const ix = x - dx, iz = z - dz;
    if (!ok(ix, iz) || isFac[k(ix, iz)] || T[k(ix, iz)] <= y) continue;
    put(ix, y, iz, "glowstone");
  }
}

// rooftop plant: 2x2 units on the 12- and 16-block tiers, set in from the parapet
for (const [x, z] of cells) {
  const i = k(x, z), t = T[i];
  if (t < 12 || isFac[i] || x % 8 !== 3 || z % 8 !== 3) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([qx, qz]) => ok(qx, qz) && !isFac[k(qx, qz)] && T[k(qx, qz)] === t))
    for (const [qx, qz] of quad) put(qx, t, qz, "iron_block");
}

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269385747.nbt");
console.log(JSON.stringify({ entrance, door: doorCell, ...stats }));
