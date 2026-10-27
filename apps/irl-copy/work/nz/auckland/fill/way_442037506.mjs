// Way 442037506: a 1930s brick-and-plaster commercial block on Mt Eden Road's flank (Auckland, stripped-classical,
// three storeys over a rendered plinth), built from the LINZ lidar footprint. Floors at y 3, 7, 11 on the common datum
// (the highest ground under it); each column is solid from 0 to its tier's top layer, so nothing floats on the slope.
// Tiers come from the lidar roof, 3x3-smoothed and quantised: a wing (one storey + parapet), a mid block (two storeys)
// and the tall bay (three storeys, attic windows, penthouse). Shell walls are one block thick; glass sits in the outer
// skin with an air gap behind it; interiors are air between the floor slabs. Warm lights sit behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_442037506.cells.json`, "utf8"));
const [W, D, H] = [37, 57, 27];

const key = (x, z) => `${x},${z}`;
const roof = new Map(), ground = new Map();
for (const [x, z, gr, r] of cells) { roof.set(key(x, z), r); ground.set(key(x, z), gr); }
const inF = (x, z) => roof.has(key(x, z));

// ---- massing: quantise the lidar roof to three flat tiers, then a 3x3 majority vote to drop the lidar's noise -------
// top layer T of a column: wing 8 (roof <= 10), mid 11 (roof 11-12, the setback ring), tall 13 (roof >= 13)
const tierOf = (r) => (r <= 10 ? 8 : r <= 12 ? 11 : 13);
const T = new Map();
for (const [k, r] of roof) {
  const [x, z] = k.split(",").map(Number);
  const votes = {};
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const q = key(x + dx, z + dz); if (roof.has(q)) { const t = tierOf(roof.get(q)); votes[t] = (votes[t] || 0) + (dx || dz ? 1 : 1.5); }
  }
  T.set(k, Number(Object.entries(votes).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]));
}
const top = (x, z) => T.get(key(x, z));

// perimeter = a footprint cell with a missing 4-neighbour; the outward normal is the first missing side (x sides first)
const outward = (x, z) => {
  if (!inF(x - 1, z)) return [-1, 0];
  if (!inF(x + 1, z)) return [1, 0];
  if (!inF(x, z - 1)) return [0, -1];
  if (!inF(x, z + 1)) return [0, 1];
  return null;
};
const isWall = (x, z) => outward(x, z) !== null;
const alongU = (x, z, n) => (n[0] !== 0 ? z : x);        // coordinate running along the face

// ---- the door: the middle of the longest run of north-facing wall cells, on the lowest row --------------------------
const north = cells.filter(([x, z]) => !inF(x, z - 1)).map(([x, z]) => [x, z]);
north.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const row0 = north.filter(([, z]) => z === north[0][1]).map(([x]) => x).sort((a, b) => a - b);
const DOOR = [row0[Math.floor(row0.length / 2)], north[0][1]];

// ---- the penthouse: a 3x3 of tall interior cells nearest the tall tier's centre --------------------------------------
const tall = cells.filter(([x, z]) => top(x, z) === 13 && !isWall(x, z) && !isWall(x - 1, z) && !isWall(x + 1, z) && !isWall(x, z - 1) && !isWall(x, z + 1) && !isWall(x - 2, z) && !isWall(x + 2, z) && !isWall(x, z - 2) && !isWall(x, z + 2));
const cx = tall.reduce((a, [x]) => a + x, 0) / tall.length, cz = tall.reduce((a, [, z]) => a + z, 0) / tall.length;
let PH = null, best = 1e9;
for (const [x, z] of tall) {
  // a 3x3 centred on (x, z) inside the tall interior
  const ok = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => top(x + dx, z + dz) === 13 && !isWall(x + dx, z + dz)));
  if (ok && Math.hypot(x - cx, z - cz) < best) { best = Math.hypot(x - cx, z - cz); PH = [x, z]; }
}

// ---- two AC plant boxes on the tall roof: 2x2 interior cells on the tall deck, clear of the penthouse
const roofFree = (x, z) => [0, 1].every((dx) => [0, 1].every((dz) => top(x + dx, z + dz) === 13 && !isWall(x + dx, z + dz)));
const nearPH = (x, z) => PH && Math.abs(x - PH[0]) < 4 && Math.abs(z - PH[1]) < 4;
const acs = [];
for (const [x, z] of cells) {
  if (acs.length >= 2 || !roofFree(x, z) || nearPH(x, z)) continue;
  if (acs.some(([ax, az]) => Math.abs(ax - x) < 5 && Math.abs(az - z) < 5)) continue;
  acs.push([x, z]);
}

// ---- the build -----------------------------------------------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const glass = (n) => (n[0] !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                                 : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const lights = [];                                                // [x, y, z, block]

for (const [k, t] of T) {
  const [x, z] = k.split(",").map(Number);
  const wall = isWall(x, z), n = wall ? outward(x, z) : null;
  // the plinth: solid from the bottom up to the floor datum (the lowest ground's storey shows its base course)
  for (let y = 0; y <= 2; y++) put(x, y, z, wall ? (y < 2 ? "polished_andesite" : "chiseled_stone_bricks") : "stone");
  // the floor slabs and the top: solid on every footprint cell, the perimeter with string courses
  for (const y of [3, 7, 11]) {
    if (y > t) continue;
    if (y === 3 || y === 7 || y === 11) {
      const b = wall ? "smooth_quartz" : "smooth_stone";
      if (y < t) put(x, y, z, b);
    }
  }
  put(x, t, z, wall ? "smooth_quartz" : "gray_concrete");          // cornice / parapet on the wall, membrane inside
  if (!wall) continue;

  const u = alongU(x, z, n);
  const pier = ((u % 3) + 3) % 3 === 0;
  for (let y = 3; y < t; y++) {
    if (y === 3 || y === 7 || y === 11) continue;                  // string courses, placed above
    if (y === 6 || y === 10) { put(x, y, z, "smooth_quartz"); continue; }   // spandrels under each floor slab
    const isDoor = DOOR[0] === x && DOOR[1] === z;
    if (isDoor && (y === 4 || y === 5)) { put(x, y, z, "iron_door", { facing: "north", half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (pier) { put(x, y, z, "bricks"); continue; }
    put(x, y, z, "glass_pane", glass(n));
  }
  // one window in nine lit from behind: glowstone on the ground-floor slab, shroomlight on the first-floor slab
  if (!pier && !(DOOR[0] === x && DOOR[1] === z) && ((u % 9) + 9) % 9 === 1) {
    const ix = x - n[0], iz = z - n[1];                              // the cell inside the wall, behind the glass
    if (inF(ix, iz) && !isWall(ix, iz)) {
      lights.push([ix, 4, iz, "glowstone"]);
      if (t >= 11) lights.push([ix, 8, iz, "shroomlight"]);
    }
  }
}

for (const [x, y, z, b] of lights) put(x, y, z, b);

// the penthouse on the tall roof: brick ring two high, a glass-slot on the south face, a quartz cap
if (PH) {
  const [px, pz] = PH;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = px + dx, z = pz + dz, ring = dx !== 0 || dz !== 0;
    for (const y of [14, 15]) {
      if (ring) put(x, y, z, y === 14 && dz === 1 && dx === 0 ? "glass_pane" : "bricks", y === 14 && dz === 1 && dx === 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } : undefined);
    }
    put(x, 16, z, "smooth_quartz");
  }
}

// two plant boxes on the tall roof (solid on the deck at 13, so they stand on it)
for (const [x, z] of acs) for (const dx of [0, 1]) for (const dz of [0, 1]) put(x + dx, 14, z + dz, "iron_block");

// a count for the report
let n = 0; g.forEachCell(() => n++);
const counts = {}; for (const [, t] of T) counts[t] = (counts[t] || 0) + 1;
const res = g.save(`${HERE}/way_442037506.nbt`);
console.log(JSON.stringify({ cells: cells.length, tiers: counts, door: DOOR, penthouse: PH, acs, lights: lights.length, saved: res }));
