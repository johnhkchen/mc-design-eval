// Symonds Street Medical Centre (way 243875779): a 1970s precast-concrete medical block, a podium of eleven storeys with a
// two-step tower set back over its middle, tinted blue glazing between white piers, and a glazed entrance on the lowest
// street edge. Storey lines sit on one absolute grid (every 4 blocks from y 0), so the floors line up across the whole
// footprint; the ground under each cell (smoothed) is solid below and the storeys step down the slope to meet it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875779.cells.json", "utf8"));
const g = new Voxels([26, 64, 26]);
const N = 26, H = 64;
const PODIUM_TOP = 44;         // roof slab of the wings (the lidar's 46 with a one-block parapet on top)
const TIER1_TOP = 48;          // roof slab of the first setback
const TOWER_CAP = 51;          // top spandrel row of the tower (roof surface at 52, the lidar's 52 blocks)
const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);

const roofAt = new Map(), groundAt = new Map();
for (const [x, z, gr, r] of cells) { roofAt.set(key(x, z), r); groundAt.set(key(x, z), gr); }
const inF = (x, z) => groundAt.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed ground: the mean of the 3x3 neighbourhood, so neighbouring columns differ by at most a block or so.
const bs = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) { s += groundAt.get(key(x + dx, z + dz)); n++; }
  return Math.round(s / n);
};

// The tower is where the lidar roof is at its top (>= 49); its setbacks are the same footprint eroded by 1 and by 3 cells.
const erode = (set) => new Set([...set].filter((k) => { const [x, z] = parse(k); return [[0, 0], ...NB].every(([dx, dz]) => set.has(key(x + dx, z + dz))); }));
const tower = new Set(cells.filter(([, , , r]) => r >= 49).map(([x, z]) => key(x, z)));
const TR1 = erode(tower);
const TR3 = erode(TR1);

// The parapet ring: podium cells that are not under the first setback, on the edge of that podium roof.
const parapet = (x, z) => inF(x, z) && !TR1.has(key(x, z)) && NB.some(([dx, dz]) => !inF(x + dx, z + dz) || TR1.has(key(x + dx, z + dz)));

// The massing: wings to 44, first setback 44 to 48, tower 48 to 52 (the solid volume, before interiors are hollowed out).
const inM = (x, y, z) => {
  if (!inF(x, z) || y < 0 || y >= H) return false;
  const k = key(x, z);
  if (y <= PODIUM_TOP) return true;
  if (y === PODIUM_TOP + 1) return TR1.has(k) || parapet(x, z);
  if (y <= TIER1_TOP) return TR1.has(k);
  if (y <= TOWER_CAP) return TR3.has(k);
  return false;
};
const isEdge = (x, y, z) => NB.some(([dx, dz]) => !inM(x + dx, y, z + dz));

// The window grid: piers on every third bay and at the corners, storey lines, a plinth and a parapet.
const facadeBlock = (x, y, z) => {
  if (y < bs(x, z) || y === 0) return "stone_bricks";
  if (y === PODIUM_TOP + 1 || y === TOWER_CAP) return "smooth_stone";
  if (y % 4 === 0) return "smooth_stone";
  if (y % 4 === 3) return "light_gray_concrete";
  const ex = !inM(x - 1, y, z) || !inM(x + 1, y, z), ez = !inM(x, y, z - 1) || !inM(x, y, z + 1);
  const along = ez ? x : z;
  if ((ex && ez) || along % 3 === 0) return "white_concrete";
  return along % 6 === 4 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
};

const B = new Map();   // "x,y,z" -> block name for everything placed; panes get their connections after
const put = (x, y, z, name) => B.set(key3(x, y, z), name);
const key3 = (x, y, z) => `${x},${y},${z}`;
const at = (x, y, z) => B.get(key3(x, y, z));

for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) for (let y = 0; y < H; y++) {
  if (!inM(x, y, z)) continue;
  if (isEdge(x, y, z)) { put(x, y, z, facadeBlock(x, y, z)); continue; }
  if (y < bs(x, z)) { put(x, y, z, "stone"); continue; }                 // foundation below grade
  if (y % 4 === 0 || y === TOWER_CAP || (y === PODIUM_TOP + 1 && parapet(x, z))) put(x, y, z, "light_gray_concrete");   // floor slabs, roof, parapet
  // otherwise an interior air gap behind the glass
}

// Entrance: the north edge cell with the lowest ground, nearest the middle of the front, so the door sits on grade.
let front = null;
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inF(x, z) || inF(x, z - 1)) continue;
  const score = bs(x, z) * 100 + Math.abs(x - 12);
  if (!front || score < front.score) front = { x, z, score };
}
const ex = front.x, ez = front.z;
put(ex, 1, ez, "iron_door"); put(ex, 2, ez, "iron_door");
for (let dx = -1; dx <= 1; dx++) if (dx) for (let y = 1; y <= 3; y++) put(ex + dx, y, ez, "light_blue_stained_glass_pane");
put(ex, 3, ez, "light_blue_stained_glass_pane");
put(ex, 4, ez, "light_gray_concrete");

// Warm light: an interior air cell behind some window gets a glowstone (the glass shows it at dusk).
const PANE = /_stained_glass_pane$/;
for (const [k, name] of B) {
  if (!PANE.test(name)) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 === 3 || y === 0) continue;
  if (((x * 7 + y * 13 + z * 5) % 4) !== 0) continue;
  for (const [dx, dz] of NB) {
    const ix = x + dx, iz = z + dz;
    if (inM(ix, y, iz) && !at(ix, y, iz) && !isEdge(ix, y, iz)) { put(ix, y, iz, "glowstone"); break; }
  }
}

// Roof plant: a solid box on the tower's top, inside the cap.
for (let x = 9; x <= 16; x++) for (let z = 9; z <= 16; z++) {
  if (!TR3.has(key(x, z))) continue;
  for (let y = TOWER_CAP + 1; y <= TOWER_CAP + 2; y++) put(x, y, z, "light_gray_concrete");
}

// Panes connect to the neighbours that a pane joins: other panes and any full block (not a door or a lantern).
const NOT_FULL = new Set(["iron_door", "lantern"]);
const joins = (x, y, z) => { const n = at(x, y, z); return n !== undefined && (PANE.test(n) || !NOT_FULL.has(n)); };
for (const [k, name] of B) {
  if (!PANE.test(name)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = (b) => (b ? "true" : "false");
  g.set(x, y, z, name, { north: s(joins(x, y, z - 1)), south: s(joins(x, y, z + 1)), east: s(joins(x + 1, y, z)), west: s(joins(x - 1, y, z)), waterlogged: "false" });
}
for (const [k, name] of B) {
  if (PANE.test(name)) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (name === "iron_door") {
    const half = y === 1 ? "lower" : "upper";
    g.set(x, y, z, name, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  } else if (name === "lantern") g.set(x, y, z, name, { hanging: "true", waterlogged: "false" });
  else g.set(x, y, z, name);
}
// Lanterns hung in the lobby, under the first slab, beside the door.
g.set(ex, 3, ez + 1, "lantern", { hanging: "true", waterlogged: "false" });
B.set(key3(ex, 3, ez + 1), "lantern");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875779.nbt";
const r = g.save(out);
console.log(`placed ${r.blocks} blocks, palette ${r.palette}; tower ${tower.size} cells, setback1 ${TR1.size}, setback2 ${TR3.size}; entrance (${ex},1,${ez}) ground ${bs(ex, ez)}`);
