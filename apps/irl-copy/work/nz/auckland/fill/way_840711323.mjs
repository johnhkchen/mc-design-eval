// Vincent Tower (OSM way 840711323): a 1980s-style glazed office tower on a two-storey stone-and-glass podium.
// Lidar says the core roof sits at 61-67 blocks (about 57 m), so the tower is one flat top at y 64 with a parapet to 68;
// the lower wings top out at their own lidar heights. Setbacks step the tower in at y 40 and y 56, in plan only.
// Storeys are 4 blocks: a floor slab on the storey line, two rows of glass, and a spandrel band. Interiors are air
// behind the glass, with a floor slab per storey, and a few glowstone lamps sit in the air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840711323.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840711323.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const TOWER_MIN = 50;      // a cell whose lidar roof is at least this is part of the tower shaft
const TOWER_TOP = 64;      // flat roof of the shaft (lidar 61-67, median-smoothed)
const PARAPET_TOP = 68;    // parapet cap ends here: about 68 blocks above the lowest ground
const SETBACK_1 = 40, SETBACK_2 = 56;

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- plan: footprint, ground, and each cell's top ----
const ground = new Map(), F0 = new Set(), top = new Map(), tower = new Set();
for (const [x, z, g, roof] of cells) {
  const k = key(x, z);
  F0.add(k); ground.set(k, g);
  if (roof >= TOWER_MIN) { tower.add(k); top.set(k, TOWER_TOP); }
  else top.set(k, Math.max(8, Math.round(roof / 4) * 4));   // lower wings: their lidar heights on the storey grid (1 -> podium top)
}
const erode = (S) => new Set([...S].filter((k) => {
  const [x, z] = k.split(",").map(Number);
  return DIRS.every(([dx, dz]) => S.has(key(x + dx, z + dz)));
}));
const E1 = erode(tower), E2 = erode(E1);

// the cell's footprint at storey base b: the podium everywhere, the shaft within setbacks, wings up to their tops
function inF(k, b) {
  if (!F0.has(k)) return false;
  if (tower.has(k)) return b < SETBACK_1 ? true : b < SETBACK_2 ? E1.has(k) : E2.has(k);
  return top.get(k) > b;
}
// the side(s) of a cell that face outside its storey's footprint: [[dx, dz], ...]
const exposed = (k, b) => { const [x, z] = k.split(",").map(Number); return DIRS.filter(([dx, dz]) => !inF(key(x + dx, z + dz), b)); };
const facing = (dx, dz) => (dz === -1 ? "north" : dz === 1 ? "south" : dx === 1 ? "east" : "west");

// the street door: the lowest shell cell on the podium's ground storey with one exposed side (not a corner)
let door = null;
for (const k of [...F0].sort((a, b) => ground.get(a) - ground.get(b) || a.localeCompare(b))) {
  if (ground.get(k) > 1) continue;
  const e = exposed(k, 0);
  if (e.length !== 1) continue;
  const [dx, dz] = e[0];
  const [x, z] = k.split(",").map(Number);
  const along = dx !== 0 ? [0, 1] : [1, 0];
  const nb = [1, -1].map((s) => key(x + along[0] * s, z + along[1] * s));
  if (nb.every((n) => F0.has(n) && exposed(n, 0).length > 0)) { door = { k, dx, dz, nb }; break; }
}

// ---- the building ----
const g = new Voxels([27, 80, 20]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const counts = { foundation: 0, slab: 0, glass: 0, spandrel: 0, lamps: 0 };

// the foundation: solid from y 0 up to each cell's ground
for (const k of F0) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < ground.get(k); y++) { set(x, y, z, "stone"); counts.foundation++; }
}

const maxB = 64;
for (let b = 0; b <= maxB; b += 4) {
  // the storey's floor slab on the storey line, over the footprint of the storey below (so setback ledges are roofs)
  const prev = b === 0 ? 0 : b - 4;
  for (const k of F0) {
    if (!inF(k, prev)) continue;
    const [x, z] = k.split(",").map(Number);
    if (b * 1 < ground.get(k)) continue;
    // exposed top of a roof, a terrace or a setback ledge: gravel-grey; a covered floor: light grey
    const exposedTop = b === maxB || !inF(k, b);
    set(x, b, z, exposedTop ? "gray_concrete" : "light_gray_concrete"); counts.slab++;
  }

  for (let off = 1; off <= 3; off++) {
    const y = b + off;
    for (const k of F0) {
      if (!inF(k, b)) continue;
      const [x, z] = k.split(",").map(Number);
      if (y < ground.get(k)) continue;
      const e = exposed(k, b);
      if (!e.length) continue;                       // interior: air behind the glass
      const isDoorCell = door && k === door.k;

      if (isDoorCell && (y === 1 || y === 2)) {       // the street door: two halves, outward
        const st = { facing: facing(door.dx, door.dz), half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        set(x, y, z, "dark_oak_door", st); continue;
      }
      if (isDoorCell && y === 3) { set(x, y, z, "smooth_stone_slab", { type: "bottom" }); continue; }   // canopy over the door
      if (door && door.nb.includes(k) && y === 3 && b === 0) { set(x, y, z, "smooth_stone_slab", { type: "bottom" }); continue; }

      if (b === maxB) {                               // the parapet and its cap
        set(x, y, z, off === 3 ? "smooth_stone" : "light_gray_concrete"); continue;
      }
      if (off === 3) {                                // spandrel band
        set(x, y, z, b === 0 ? "polished_andesite" : "white_concrete"); counts.spandrel++; continue;
      }
      if (e.length > 1) { set(x, y, z, "light_gray_concrete"); continue; }   // corner piers
      const [dx] = e[0];
      const along = dx !== 0 ? z : x;
      if (along % 3 === 0) { set(x, y, z, "gray_concrete"); continue; }      // mullions
      set(x, y, z, "light_blue_stained_glass"); counts.glass++;
    }
  }
}

// roof plant: the middle of the top roof, two blocks high
for (const k of E2) {
  const [x, z] = k.split(",").map(Number);
  const inner = erode(E2);
  if (!inner.has(k)) continue;
  const deeper = erode(inner);
  if (!deeper.has(k)) continue;
  set(x, 65, z, "stone_bricks"); set(x, 66, z, "stone_bricks");
}

// warm lamps in the air gap behind a few panes (on the room side, never in the wall)
for (let b = 0; b <= maxB; b += 4) for (let off = 1; off <= 2; off++) {
  const y = b + off;
  for (const k of F0) {
    if (!inF(k, b)) continue;
    const [x, z] = k.split(",").map(Number);
    if (y < ground.get(k)) continue;
    const e = exposed(k, b);
    if (e.length !== 1 || b === maxB) continue;
    if ((x * 7 + z * 13 + y * 3) % 11 !== 0) continue;
    const [dx, dz] = e[0];
    const ix = x - dx, iz = z - dz;
    const ik = key(ix, iz);
    if (!inF(ik, b) || exposed(ik, b).length) continue;
    set(ix, y, iz, "glowstone"); counts.lamps++;
  }
}

const stats = g.save(OUT);
console.log(JSON.stringify({ footprint: F0.size, tower: tower.size, wings: F0.size - tower.size, door: door && door.k, counts, saved: stats }));
