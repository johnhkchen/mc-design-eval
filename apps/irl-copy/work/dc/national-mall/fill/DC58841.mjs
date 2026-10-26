import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A stripped-classical federal office block of 1930s limestone (the Federal Triangle manner): four storeys of
// 3-block bays on a base course, a flat cornice and parapet, pilasters between the windows, and a taller core
// (lidar 14-15) that rises one storey higher. The south end sits on lower ground as a one-storey hall (lidar 3).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58841.cells.json`, "utf8"));

const W = 17, H = 27, D = 48;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr: Math.max(0, Math.round(gr)), roof });
const has = (x, z) => raw.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const inset2 = (x, z) => {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!has(x + dx, z + dz)) return false;
  return true;
};

// ---- lidar roof: 3x3 mean, then three clean tiers: one-storey hall (3), main block (13), core (15) ----
const map = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(x + dx, z + dz));
    if (o) { sum += o.roof; n++; }
  }
  const avg = sum / n;
  const R = avg < 8 ? 3 : avg >= 14 ? 15 : 13;
  map.set(k, { gr: c.gr, R });
}

const STONE = "calcite";          // limestone field
const BASE = "stone_bricks";      // base course
const BAND = "smooth_quartz";     // storey lines and cornice
const PILASTER = "quartz_pillar";
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";

// ---- articulated walls: every edge cell is a full-height wall from y 0 to its roof tier ----
// Bays of 4: pilaster | glass | glass | stone. Storey lines (band) sit on y 1, 4, 7, 10, 13.
for (const [k, { R }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;

  let b;
  if (!has(x, z - 1) || !has(x, z + 1)) b = x;     // north and south faces run along x
  else b = z;                                      // west and east faces run along z
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

  // the base course at y 0 is the foundation (cells with ground above 0 fill up to it) and the plinth of the lower south cells
  g.set(x, 0, z, BASE);

  for (let y = 1; y < R; y++) {
    const r = (y - 1) % 3;
    let m;
    if (y === R - 1) m = BAND;                          // cornice course
    else if (r === 0) m = BAND;                         // storey line
    else if (corner || b % 4 === 0) m = PILASTER;
    else if (b % 4 === 3) m = y <= 3 ? BASE : STONE;    // mullion field between window pairs; darker rusticated base
    else m = GLASS;
    g.set(x, y, z, m);
  }
  g.set(x, R, z, "stone_brick_wall");                  // parapet
}

// ---- interiors: no rooms, just a floor slab per storey and a roof deck, with an air gap behind the glass ----
for (const [k, { R }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) continue;
  g.set(x, 0, z, FLOOR);
  for (const y of [4, 7, 10]) if (y < R - 1) g.set(x, y, z, FLOOR);
  if (R === 15) g.set(x, 13, z, FLOOR);
  g.set(x, R - 1, z, FLOOR);
  // roof plant on the main block: a few stone-clad units on the deck
  if (R === 13 && inset2(x, z) && x % 6 === 2 && z % 8 === 4) {
    g.set(x, 13, z, "light_gray_concrete");
    g.set(x, 14, z, "light_gray_concrete");
  }
}

// ---- warm light behind some glass: a lantern standing on the storey floor, one bay in eight ----
for (const [k, { R }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  // the cell just inside this wall, on the same face (north/south faces step in along z, west/east along x)
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const inx = alongX ? x : !has(x - 1, z) ? x + 1 : x - 1;
  const inz = alongX ? (!has(x, z - 1) ? z + 1 : z - 1) : z;
  const b = alongX ? x : z;
  if (!has(inx, inz) || isEdge(inx, inz) || b % 8 !== 5) continue;
  for (let s = 0; s < 4; s++) {
    const base = 1 + 3 * s;
    if (base >= R - 1) continue;                          // no glazed storey up here
    if (s === 0) g.set(inx, 1, inz, "lantern", { hanging: "false" });   // stands on the ground slab y 0
    else if (s === 2) g.set(inx, base + 1, inz, "glowstone");
    else g.set(inx, base + 1, inz, "lantern", { hanging: "false" });    // stands on the storey floor
  }
}

// ---- entrances: a centred door in a recessed bay with flanking pilasters, a lintel and a hanging lantern ----
function entrance(ex, ez, facing, inward, R) {
  if (!has(ex, ez) || !isEdge(ex, ez)) return;
  for (const dx of [-1, 1]) {
    if (!has(ex + dx, ez)) continue;
    for (let y = 1; y <= 2; y++) g.set(ex + dx, y, ez, PILASTER);
    if (R > 3) g.set(ex + dx, 3, ez, BAND);
  }
  if (R > 3) g.set(ex, 3, ez, BAND);
  g.set(ex, 1, ez, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 2, ez, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // the lantern hangs from the storey slab above (interior ceiling at y 4 exists only on the main block)
  if (R > 4 && has(ex, ez + inward) && !isEdge(ex, ez + inward)) g.set(ex, 3, ez + inward, "lantern", { hanging: "true" });
}
entrance(10, 0, "north", 1, map.get(key(10, 0)).R);
entrance(8, D - 1, "south", -1, map.get(key(8, D - 1)).R);

g.save(`${DIR}/DC58841.nbt`);
console.log("DC58841 built:", g.count(), "blocks");
