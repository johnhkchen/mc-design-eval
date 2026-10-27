// Way 269468259, Mt Eden / Newton edge: a 1930s brick commercial block with cream render bands (shops on the ground
// floor, offices above), a flat parapet roof, a single-storey wing on the low cells, and a plant housing on the top.
// Storey lines are absolute: sill/floor at y4, cornice at y7, parapet at y8, so the facade reads level around the block.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const raw = JSON.parse(readFileSync(`${DIR}/way_269468259.cells.json`, "utf8"));

const X = 57, Z = 48, Y = 22;
const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const C = raw.map(([x, z, ground, roof]) => ({ x, z, ground, roof }));
const at = new Map(C.map((c) => [`${c.x},${c.z}`, c]));
const get = (x, z) => at.get(`${x},${z}`);

// Massing tiers snapped from the lidar roof: 2 storeys (surface 8, parapet to 9) for the bulk, a single storey (surface 4)
// where the lidar roof is under 6 (the notches and the lean-to on the east side).
const tierOf = (c) => (c.roof <= 5 ? 1 : 2);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Outward faces: a neighbour outside the footprint, or a lower tier beside a taller one (the step wall above the lower roof)
const faces = (c) => Object.keys(DIRS).filter((f) => {
  const n = get(c.x + DIRS[f][0], c.z + DIRS[f][1]);
  return !n || tierOf(n) < tierOf(c);
});
const isEdge = (c) => faces(c).length > 0;
const inward = (c, f) => get(c.x - DIRS[f][0], c.z - DIRS[f][1]);
const onNS = (f) => f === "N" || f === "S";

// Doors: one on the north/south street face near the middle, one on the east/west face near the middle. A door sits on a
// single-face tier-2 cell at ground 0-1 with a window position (u % 3 === 1) and an interior cell behind it.
function pickDoor(axisNS, target) {
  let best = null;
  for (const c of C) {
    const fs = faces(c);
    if (fs.length !== 1 || tierOf(c) !== 2 || c.ground > 1) continue;
    const f = fs[0];
    if (onNS(f) !== axisNS) continue;
    const u = axisNS ? c.x : c.z;
    if (u % 3 !== 1) continue;
    const inw = inward(c, f);
    if (!inw || isEdge(inw) || tierOf(inw) !== 2) continue;
    const score = Math.abs(u - target);
    if (!best || score < best.score) best = { c, f, score };
  }
  return best;
}
const doors = [pickDoor(true, 28), pickDoor(false, 24)].filter(Boolean);
const doorAt = new Map();
const canopy = new Set();
for (const d of doors) {
  doorAt.set(`${d.c.x},${d.c.z}`, d.f);
  for (let k = -1; k <= 1; k++) {
    const cx = onNS(d.f) ? d.c.x + k : d.c.x, cz = onNS(d.f) ? d.c.z : d.c.z + k;
    const e = get(cx, cz);
    if (e && isEdge(e)) canopy.add(`${cx},${cz}`);
  }
}

const PANE_NS = { east: "true", west: "true", north: "false", south: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false" };

// Every footprint cell: foundation below the ground storey, then the storeys. Interior cells are air with a floor slab
// per storey and a roof; edge cells carry the facade (piers, windows, string courses, cornice, parapet).
for (const c of C) {
  const t = tierOf(c), base = Math.max(1, c.ground);
  const top = t === 2 ? 8 : 4;             // roof covering row (parapet sits on it at the edge)
  const ceil = top - 1;                     // ceiling / cornice row (7 or 3)
  for (let y = 0; y < base; y++) put(c.x, y, c.z, "stone_bricks");
  const fs = faces(c);

  if (!fs.length) {
    if (t === 2) put(c.x, 4, c.z, "smooth_stone");        // floor slab for the upper storey
    put(c.x, ceil, c.z, "smooth_stone");                  // ceiling / roof deck
    put(c.x, top, c.z, "light_gray_concrete");                  // roof covering
    continue;
  }

  const corner = fs.some(onNS) && fs.some((f) => !onNS(f));
  const f = fs[0], u = onNS(f) ? c.x : c.z, pier = u % 3 === 0;
  const pane = onNS(f) ? PANE_NS : PANE_EW;
  const door = doorAt.get(`${c.x},${c.z}`);
  const cornerTop = top;

  for (let y = base; y <= cornerTop; y++) {
    if (corner) { put(c.x, y, c.z, "smooth_quartz"); continue; }
    let block = null, state;
    if (t === 2) {
      if (y <= 2) block = pier ? "stone_bricks" : "glass";                 // shopfront
      else if (y === 3) block = canopy.has(`${c.x},${c.z}`) ? "dark_oak_planks" : "smooth_quartz";
      else if (y === 4) block = "smooth_quartz";                           // storey line
      else if (y === 5 || y === 6) { block = pier ? "bricks" : "glass_pane"; state = pier ? undefined : pane; }
      else if (y === 7) block = "smooth_quartz";                           // cornice
      else block = "bricks";                                               // parapet
    } else {
      if (y <= 2) block = pier ? "stone_bricks" : "glass";
      else if (y === 3) block = "smooth_quartz";                           // cornice of the wing
      else block = "bricks";
    }
    if (door && t === 2 && (y === 1 || y === 2)) {
      put(c.x, y, c.z, "dark_oak_door", {
        facing: { N: "north", S: "south", W: "west", E: "east" }[door], half: y === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    put(c.x, y, c.z, block, state);
  }

  // Warm light: a hanging lantern just inside some upper windows, and in some shopfront bays
  const inw = inward(c, f);
  if (t === 2 && inw && tierOf(inw) === 2 && !isEdge(inw) && !pier) {
    if (u % 6 === 2) {
      put(inw.x, 3, inw.z, "lantern", { hanging: "true", waterlogged: "false" });   // under the floor slab, inside the shop bay
    }
    if (((c.x * 7 + c.z * 3) % 9) === 0) {
      put(inw.x, 6, inw.z, "lantern", { hanging: "true", waterlogged: "false" });   // upper office, hung from the ceiling
    }
  }
}

// Structure in the open plan: a column grid (every 6 blocks, interior cells only) from the foundation up to each slab,
// so the floor slab and the roof deck stand on something and the rooms stay open
for (const c of C) {
  if (isEdge(c) || c.x % 6 !== 0 || c.z % 6 !== 0) continue;
  const top = tierOf(c) === 2 ? 7 : 3;
  for (let y = Math.max(1, c.ground); y < top; y++) if (!g.val(c.x, y, c.z)) put(c.x, y, c.z, "stone_bricks");
}

// Plant housing on the roof: a solid 4 x 4 bricks box on two rows with a cornice cap, on the tallest interior tier-2 cells
let best = null;
for (let z0 = 0; z0 + 4 <= Z; z0++) for (let x0 = 0; x0 + 4 <= X; x0++) {
  let sum = 0, ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) {
    const c = get(x0 + dx, z0 + dz);
    if (!c || tierOf(c) !== 2 || isEdge(c)) ok = false; else sum += c.roof;
  }
  if (ok && (!best || sum > best.sum)) best = { x0, z0, sum };
}
if (best) {
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = best.x0 + dx, z = best.z0 + dz;
    put(x, 9, z, "bricks"); put(x, 10, z, "bricks"); put(x, 11, z, "smooth_quartz");
  }
}

const stats = g.save(`${DIR}/way_269468259.nbt`);
console.log(JSON.stringify({ doors: doors.map((d) => [d.c.x, d.c.z, d.f]), housing: best, ...stats }));
