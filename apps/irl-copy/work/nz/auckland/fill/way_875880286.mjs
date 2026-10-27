// Queens Residences: a 25-storey waterfront apartment tower on a stone plinth, stepped down to a 6-storey wing and
// a 3-storey base. Built column by column from the lidar roof record (tiers on the 4-block storey grid), one block of
// shell per footprint cell, so every floor slab sits on the slab below and the interiors stay air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_875880286.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 57, Z = 40, Y = 117;
const FLOOR0 = 5;                  // the ground-floor slab; storeys every 4 blocks above it
const PLINTH = 5;                  // stone plinth from y 0 to the ground-floor slab, on every footprint cell

const key = (x, z) => `${x},${z}`;
// lidar roof height -> flat tier top, on the storey grid (5 + 4n): 17, 29, 65, 85, 101, 105
const tierTop = (r) => (r >= 100 ? 105 : r >= 90 ? 101 : r >= 75 ? 85 : r >= 50 ? 65 : r >= 25 ? 29 : 17);
const top = new Map();
for (const [x, z, , r] of cells) top.set(key(x, z), tierTop(r));

const storeys = (x, z) => { const T = top.get(key(x, z)); return T === undefined ? 0 : (T - FLOOR0) / 4; };
const inFp = (x, z) => top.has(key(x, z));
const DIRS = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
// the sides of cell (x, z) that face outside the building at storey k (no storey beside it there)
const exposed = (x, z, k) => DIRS.filter(([, dx, dz]) => !(storeys(x + dx, z + dz) > k));

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);

// --- plinth and shell -------------------------------------------------------
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const edge = DIRS.some(([, dx, dz]) => !inFp(x + dx, z + dz));   // a side with no footprint beside it
  for (let y = 0; y < PLINTH; y++) set(x, y, z, edge ? "stone_bricks" : "stone");
}

// --- storeys, facades, roofs --------------------------------------------------
let doorCand = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const S = storeys(x, z), T = FLOOR0 + 4 * S;
  for (let k = 0; k < S; k++) {
    const y0 = FLOOR0 + 4 * k;
    set(x, y0, z, "gray_concrete");                       // floor slab: every storey stands on the one below
    const F = exposed(x, z, k);
    if (!F.length) continue;                              // interior: air between the slabs
    const alongX = F.some(([d]) => d === "N" || d === "S"); // a north/south face varies along x, an east/west one along z
    const alongZ = F.some(([d]) => d === "E" || d === "W");
    const idx = alongX && alongZ ? 0 : alongX ? x : z;
    const pier = (alongX && alongZ) || idx % 3 === 0;
    const lit = !pier && (x * 7 + z * 13 + k * 5) % 9 === 0;
    set(x, y0 + 1, z, "light_gray_concrete");              // spandrel under the glass
    set(x, y0 + 2, z, pier ? "white_concrete" : lit ? "glowstone" : "light_blue_stained_glass");
    set(x, y0 + 3, z, pier ? "white_concrete" : "light_blue_stained_glass");
    if (k === 0 && (F.some(([d]) => d === "N") || F.some(([d]) => d === "S"))) {
      for (const [d] of F) if (d === "N" || d === "S") doorCand.push({ x, z, d, pier });
    }
  }
  set(x, T, z, "gray_concrete");                           // roof deck
  const lowerOrOut = DIRS.some(([, dx, dz]) => storeys(x + dx, z + dz) < S);
  if (lowerOrOut) set(x, T + 1, z, "white_concrete");     // parapet on the exposed roof edge
}

// --- entrance: a door on the ground storey, facing out, under a canopy --------
const pickDoor = doorCand.filter((c) => !c.pier);
if (pickDoor.length) {
  const mid = pickDoor.map((c) => c.x).sort((a, b) => a - b)[Math.floor(pickDoor.length / 2)];
  const c = pickDoor.reduce((a, b) => (Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a));
  const facing = c.d === "N" ? "north" : "south";
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  set(c.x, 6, c.z, "dark_oak_door", st("lower"));
  set(c.x, 7, c.z, "dark_oak_door", st("upper"));
  // canopy: a slab row over the door, cantilevered two blocks out from the storey-1 slab
  const oz = c.d === "N" ? -1 : 1;
  for (const dx of [-1, 0, 1]) for (let depth = 1; depth <= 2; depth++) {
    const cx = c.x + dx, cz = c.z + oz * depth;
    if (inFp(cx, cz)) continue;
    set(cx, 9, cz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

// --- roof equipment and crown -----------------------------------------------
const crown = cells.filter(([x, z]) => storeys(x, z) >= 25);
let cx = 0, cz = 0;
for (const [x, z] of crown) { cx += x; cz += z; }
if (crown.length) {
  cx = Math.round(cx / crown.length); cz = Math.round(cz / crown.length);
  let best = crown[0];
  for (const c of crown) if (Math.abs(c[0] - cx) + Math.abs(c[1] - cz) < Math.abs(best[0] - cx) + Math.abs(best[1] - cz)) best = c;
  set(best[0], FLOOR0 + 4 * 25 + 1, best[1], "lightning_rod", { facing: "up", powered: "false" });
  set(best[0], FLOOR0 + 4 * 25 + 2, best[1], "lightning_rod", { facing: "up", powered: "false" });
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const S = storeys(x, z), T = FLOOR0 + 4 * S;
  if (S < 20) continue;
  const interior = DIRS.every(([, dx, dz]) => storeys(x + dx, z + dz) >= S);
  if (interior && x % 6 === 3 && z % 5 === 2) {
    set(x, T + 1, z, "iron_block");                       // plant box on the tower roof
  }
}

const out = `${DIR}/way_875880286.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ file: out, ...res }));
