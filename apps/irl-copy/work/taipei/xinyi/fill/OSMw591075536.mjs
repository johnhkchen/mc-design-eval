import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075536";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 43, H = 25, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);
const exposedNS = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const exposedEW = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const perimeter = (x, z) => exposedNS(x, z) || exposedEW(x, z);

// ---- storey lines (absolute y; lowest ground = 0) ---------------------
const SLABS = [5, 9];       // floor lines
const ROOF = 13;            // roof deck / parapet level
const GROUND_TOP = 4;       // storefront lintel at y=4

// pier columns every 3 cells along each exposed face; corners always piers
function isPier(x, z) {
  const ns = exposedNS(x, z), ew = exposedEW(x, z);
  if (ns && ew) return true;
  if (ns) return x % 3 === 0;
  return z % 3 === 0;
}

// glass pane with connection flags matching the face it sits in
function pane(x, y, z) {
  const tint = (x + 2 * y + 3 * z) % 7 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
  if (exposedNS(x, z)) {
    g.set(x, y, z, tint, { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
  } else {
    g.set(x, y, z, tint, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// ---- pass 1: foundation, floors, roof deck, walls --------------------
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const per = perimeter(x, z);

  // interior floor at the cell's own ground level
  if (!per) g.set(x, gr, z, "smooth_stone");

  // storey slabs and roof deck (stand on what is below)
  for (const s of SLABS) {
    if (s >= gr) g.set(x, s, z, "smooth_stone");
  }
  if (ROOF >= gr) g.set(x, ROOF, z, per ? "smooth_stone" : "gray_concrete");

  if (!per) continue;

  const pier = isPier(x, z);

  for (let y = gr; y < ROOF; y++) {
    if (SLABS.includes(y)) continue;

    // base course on the plinth
    if (y === gr && gr < GROUND_TOP) { g.set(x, y, z, "polished_andesite"); continue; }

    // ground floor shopfront band
    if (y <= GROUND_TOP - 1) {
      if (pier) g.set(x, y, z, "white_concrete");
      else pane(x, y, z);
      continue;
    }
    if (y === GROUND_TOP) { g.set(x, y, z, "smooth_stone"); continue; }

    // upper storeys: window rows at 6-7 and 10-11, spandrels at 8 and 12
    if (y === 8 || y === 12) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (pier) g.set(x, y, z, "white_concrete");
    else pane(x, y, z);
  }

  // parapet capping the perimeter wall
  g.set(x, ROOF, z, "smooth_stone");
}

// ---- pass 2: warm lights standing behind some upper-floor windows ----
for (const [x, z, gr] of cells) {
  if (!perimeter(x, z)) continue;
  if (isPier(x, z)) continue;
  for (const floorY of [5, 9]) {
    const ly = floorY + 1;                // lantern stands on the floor slab
    if (((x + z + floorY) % 4) !== 0) continue;
    let ix = x, iz = z;
    if (exposedNS(x, z) && !exposedEW(x, z)) {
      iz = !has(x, z - 1) ? z + 1 : z - 1;
    } else if (exposedEW(x, z) && !exposedNS(x, z)) {
      ix = !has(x - 1, z) ? x + 1 : x - 1;
    } else continue;
    if (!has(ix, iz)) continue;
    if (floorY < groundAt(ix, iz)) continue; // floor slab not present here
    g.set(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- pass 3: entrance on the south face (z = 16) ---------------------
if (has(21, 16)) {
  const gr = groundAt(21, 16);
  // fascia / canopy band across the entrance bay, carried on the wall
  for (let x = 18; x <= 24; x++) {
    if (has(x, 16) && 4 >= groundAt(x, 16)) g.set(x, 4, 16, "red_terracotta");
  }
  // glazed bays either side of the door
  for (const x of [20, 22]) {
    if (!has(x, 16)) continue;
    for (let y = gr + 1; y <= 3; y++) pane(x, y, 16);
  }
  // doors: lower and upper half, open to the street
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  g.set(21, gr, 16, "dark_oak_door", doorProps("lower"));
  g.set(21, gr + 1, 16, "dark_oak_door", doorProps("upper"));
  // transom above the door
  if (gr + 2 <= 3) g.set(21, gr + 2, 16, "white_concrete");
}

// ---- pass 4: roof equipment and penthouse setback --------------------
// chillers on the roof deck
for (let x = 4; x <= 7; x++) {
  for (let z = 5; z <= 7; z++) {
    if (has(x, z) && ROOF >= groundAt(x, z)) g.set(x, ROOF + 1, z, "iron_block");
  }
}

// central penthouse, 14-16 high, on the roof deck
for (let x = 13; x <= 29; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || perimeter(x, z)) continue;
    const edge = x === 13 || x === 29 || z === 5 || z === 11;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (y === ROOF + 2 && edge && (x + z) % 2 === 0) {
        pane(x, y, z);
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// lanterns on the four parapet corners
for (const [x, z] of [[0, 0], [42, 0], [0, 16], [42, 16]]) {
  if (has(x, z)) g.set(x, ROOF + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
