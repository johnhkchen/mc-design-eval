// Westminster Court: a mid-century concrete flats block. White concrete piers and spandrels with light-grey storey
// bands, blue-tinted glazing in steel-looking frames, a basalt plinth, a flat concrete roof. Nine storeys of 4 blocks
// on a datum at y 2; the outer 3 cells of the footprint stop at 34 as a terrace, the rest rises to a 38 roof with a 39
// parapet and a lift overrun. The mass is solid, with a 1-block air gap behind each window (glowstone in some) and a
// slab per storey, so nothing floats and there are no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23906633.cells.json`, "utf8"));   // [x, z, ground, roof]

const [W, H, D] = [30, 51, 45];
const F = 2, STOREY = 4, STOREYS = 9;   // storey k's floor slab sits at F + 4k
const RING = 34, TOWER = 38;            // terrace cap, tower roof cap (parapet to 39)
const SETBACK = 3;                      // footprint edge cells this deep stay at terrace height

const LG = "light_gray_concrete", WC = "white_concrete", STONE = "stone", BASALT = "polished_basalt";
const GLASS = "light_blue_stained_glass_pane", AC = "iron_block", GLOW = "glowstone", DOOR = "dark_oak_door";

const K = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(K(x, z), g); roof.set(K(x, z), r); }
const keys = [...ground.keys()];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = (key) => key.split(",").map(Number);
const step = (x, z, [dx, dz]) => K(x + dx, z + dz);
const inFp = (key) => ground.has(key);

// depth in from the footprint edge (0 = edge cell)
const inset = new Map(), queue = [];
for (const key of keys) {
  const [x, z] = at(key);
  if (DIRS.some((d) => !inFp(step(x, z, d)))) { inset.set(key, 0); queue.push(key); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = at(queue[i]);
  for (const d of DIRS) {
    const n = step(x, z, d);
    if (inFp(n) && !inset.has(n)) { inset.set(n, inset.get(queue[i]) + 1); queue.push(n); }
  }
}

// lidar roof says ~36-39 on the tower core; the edge and the lower wings smooth down to the terrace
const topOf = (key) => (inset.get(key) >= SETBACK && roof.get(key) >= 36 ? TOWER : RING);
// storey k stands in a cell while its top slab (F + 4(k+1)) is at or below the cell's cap
const hasStorey = (k, key) => inFp(key) && F + STOREY * (k + 1) <= topOf(key);
// the sides of a cell that open onto air, at storey k (outside the footprint or past the storey's mass)
const exposed = (k, key) => {
  const [x, z] = at(key);
  return DIRS.filter((d) => !hasStorey(k, step(x, z, d)));
};

// the grid: a Map of "x,y,z" -> [block, state] or null (air), written at the end
const grid = new Map();
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, [block, state]);
const carve = (x, y, z) => grid.set(`${x},${y},${z}`, null);

// 1. core: solid up to each cell's cap, a stone plinth under the ground line, caps on top
for (const key of keys) {
  const [x, z] = at(key), top = topOf(key), g = ground.get(key);
  for (let y = 0; y < top; y++) put(x, y, z, STONE);
  put(x, top, z, LG);
  if (inset.get(key) === 0) for (let y = g + 1; y < F; y++) put(x, y, z, BASALT);   // visible base course
}

// 2. the entrance: the lowest window-eligible edge cell on storey 0 that is not a pier
const windowEligible = (k, key, ex) => {
  if (ex.length !== 1) return false;
  const [x, z] = at(key), [dx, dz] = ex[0];
  const coord = dx !== 0 ? z : x;
  if (coord % 3 === 0) return false;
  return hasStorey(k, step(x, z, [-dx, -dz])) && exposed(k, step(x, z, [-dx, -dz])).length === 0;
};
const doorKey = keys
  .filter((key) => hasStorey(0, key) && windowEligible(0, key, exposed(0, key)))
  .sort((a, b) => ground.get(a) - ground.get(b) || a.localeCompare(b))[0];
const doorOut = doorKey ? exposed(0, doorKey)[0] : null;
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// 3. storeys: slab per storey, two glass rows per bay, a spandrel row, air behind the glass
const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { east: "true", west: "true", north: "false", south: "false" });
for (let k = 0; k < STOREYS; k++) {
  const L = F + STOREY * k;
  for (const key of keys) {
    if (!hasStorey(k, key)) continue;
    const [x, z] = at(key), g = ground.get(key);
    const ex = exposed(k, key), edge = ex.length > 0;
    if (L > g) put(x, L, z, edge ? LG : STONE);            // storey line / floor slab
    if (!edge) continue;
    if (ex.length > 1) {                                   // corner: a pier, full height
      for (const y of [L + 1, L + 2, L + 3]) if (y > g) put(x, y, z, WC);
      continue;
    }
    const [dx, dz] = ex[0];
    const pier = (dx !== 0 ? z : x) % 3 === 0;
    const inKey = step(x, z, [-dx, -dz]), [ix, iz] = at(inKey);
    const gap = !pier && windowEligible(k, key, ex);
    const isDoor = key === doorKey && k === 0;
    for (const y of [L + 1, L + 2]) {
      if (y <= g) continue;
      if (isDoor) put(x, y, z, DOOR, { facing: FACING[`${dx},${dz}`], half: y === L + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (pier || !gap) put(x, y, z, WC);
      else put(x, y, z, GLASS, paneState(dx));
    }
    if (isDoor) { if (L + 3 > g) put(x, L + 3, z, LG); }                    // the lintel over the door
    else if (L + 3 > g) put(x, L + 3, z, WC);
    if (gap || isDoor) for (const y of [L + 1, L + 2]) if (y > g) carve(ix, y, iz);   // the air gap behind the glass
    if (gap && !isDoor && (x * 5 + z * 3 + k) % 4 === 0 && L + 1 > g) put(ix, L + 1, iz, GLOW);
  }
}

// 4. roof: terrace railing and plant on the ring, parapet, plant and a lift overrun on the tower
const tower = keys.filter((key) => topOf(key) === TOWER);
const cx = Math.round(tower.reduce((s, key) => s + at(key)[0], 0) / tower.length);
const cz = Math.round(tower.reduce((s, key) => s + at(key)[1], 0) / tower.length);
for (const key of keys) {
  const [x, z] = at(key), i = inset.get(key);
  if (topOf(key) === RING) {
    if (i === 0) put(x, RING + 1, z, LG);                                   // terrace parapet
    else if (i === 2 && (x * 7 + z * 11) % 16 === 0) put(x, RING + 1, z, AC);   // a few plant units on the terrace
  } else {
    if (exposed(8, key).length > 0) put(x, TOWER + 1, z, WC);               // tower parapet
    else if (i >= 5 && (x * 3 + z * 13) % 7 === 0) put(x, TOWER + 1, z, AC);   // rooftop plant
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 && i >= 3) {         // lift overrun
      for (const y of [TOWER + 1, TOWER + 2, TOWER + 3]) put(x, y, z, WC);
      put(x, TOWER + 4, z, LG);
    }
  }
}

const g = new Voxels([W, H, D]);
for (const [pos, v] of grid) {
  const [x, y, z] = pos.split(",").map(Number);
  if (!v) g.set(x, y, z, "air");
  else g.set(x, y, z, v[0], v[1]);
}
const out = `${DIR}/way_23906633.nbt`;
const stats = g.save(out);
console.log(`way_23906633: ${stats.blocks} blocks, ${stats.palette} palette entries, door at ${doorKey} (${doorOut ? FACING[`${doorOut[0]},${doorOut[1]}`] : "none"}), ${tower.length} tower cells, saved ${out}`);
