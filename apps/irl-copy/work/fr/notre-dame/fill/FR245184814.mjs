// FR245184814: a commercial Haussmann-style block on the Ile de la Cite's quai (cream limestone, a zinc-slate mansard
// look in deepslate tiles). The lidar tops snap to clean tiers: a 30-block north pavilion (six storeys) on the street
// face, a 22-block setback across its south side, a 13-block body (ground floor, a piano nobile, an attic) and low
// wings at 8. Terrace cells under 6 blocks are plinth. Each storey is five blocks: a string course on every band line,
// a shopfront on the ground floor with a door on the north face, and glass panes in calcite frames with iron-bar rails
// on the first floor. Walls are found per height, so the setback's south face shows above the body roof and every tier
// stands on what is below it. The footprint is a one-cell ring of walls round air with a floor slab per storey; a few
// glowstone and lantern lights hang in the air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184814.cells.json", "utf8"));

const BODY = "calcite";              // Paris limestone, cream
const BAND = "smooth_sandstone";     // string courses and the cornice
const PLINTH = "stone_bricks";       // foundation and terrace
const FLOOR = "smooth_stone";        // storey slabs
const ROOF = "deepslate_tiles";      // zinc-look roof
const SHOP = "glass";                // shopfront glazing
const FASCIA = "dark_oak_planks";    // shop sign band
const PANE = "glass_pane";           // windows
const RAIL = "iron_bars";            // first-floor balcony rail
const CHIM = "bricks";               // chimney stacks

const H = 33;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const cellAt = (x, z) => byXZ.get(`${x},${z}`);

// Tiers from the lidar: a 30 pavilion at the north end, a 22 setback on its south side, 13 for the body, 8 for low
// wings, and anything under 6 is plinth (a terrace, no storeys)
function tierOf(x, z, r) {
  if (z <= 2) return 30;
  if (z === 3) return x >= 1 && x <= 6 ? 22 : 13;
  if (r < 6) return r;
  if (r < 9) return 8;
  return 13;
}

const info = new Map();
for (const [x, z, gr, r] of cells) {
  const R = tierOf(x, z, r);
  info.set(`${x},${z}`, { G: gr, R, top: Math.max(gr, R) });
}

// A cell's face is exposed at height y when the neighbour outside the footprint, or its solid top is below y
function exposed(x, z, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nb = info.get(`${x + dx},${z + dz}`);
    if (!nb || y >= nb.top) out.push(d);
  }
  return out;
}

const isBand = (y) => y > 0 && y % 5 === 0;           // storey lines every five blocks
const bandBelow = (y) => Math.floor(y / 5) * 5;

const g = new Voxels([8, H, 39]);

for (const [x, z] of Array.from(info.keys(), (k) => k.split(",").map(Number))) {
  const { G, R, top } = info.get(`${x},${z}`);

  for (let y = 0; y < top; y++) {
    if (y < G) { g.set(x, y, z, PLINTH); continue; }    // foundation up to the ground
    if (R < 6) { g.set(x, y, z, PLINTH); continue; }    // terrace or low plinth, no storeys
    if (y >= R) break;
    const ex = exposed(x, z, y);
    const onFace = ex.length > 0;
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const alongX = ex.includes("N") || ex.includes("S");   // the face runs along x, so its windows are placed by x
    const along = alongX ? x : z;
    const windowCol = onFace && !corner && along % 3 === 1;

    if (y === R - 1) { g.set(x, y, z, onFace ? BAND : ROOF); continue; }   // cornice on the walls, slate inside
    if (!onFace) { if (isBand(y)) g.set(x, y, z, FLOOR); continue; }      // interior: air, a slab per storey
    if (isBand(y)) { g.set(x, y, z, BAND); continue; }                    // string course

    if (y < 5) {                                                          // ground floor: shopfront
      const door = ex.includes("N") && x === 4 && z === 0 && G === 0;
      if (door && y <= 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (door || (ex.includes("N") && x >= 3 && x <= 5 && z === 0 && G === 0 && y === 2)) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // hood over the door
      if (y === 4) { g.set(x, y, z, onFace && !corner ? FASCIA : BODY); continue; }
      if (corner || along % 3 === 0) { g.set(x, y, z, BODY); continue; }    // stone pier
      g.set(x, y, z, SHOP); continue;
    }

    const rel = y - bandBelow(y);
    const attic = bandBelow(y) === 10 && R - 1 - 10 <= 2;   // the attic under the cornice
    if (!windowCol) { g.set(x, y, z, BODY); continue; }     // a pier between windows
    if (attic) { g.set(x, y, z, rel === 1 ? PANE : (rel === 2 ? PANE : BODY), PANE_X); continue; }
    if (rel === 1) { g.set(x, y, z, bandBelow(y) === 5 ? RAIL : BODY); continue; }   // sill; the piano nobile's rail
    if (rel === 4) { g.set(x, y, z, BODY); continue; }     // lintel
    g.set(x, y, z, PANE, alongX ? PANE_X : PANE_Z);
  }
}

// Warm lights in the air behind some windows: the cell inward of a lit pane, on the second row of each storey
for (const [x, z] of Array.from(info.keys(), (k) => k.split(",").map(Number))) {
  const { G, R } = info.get(`${x},${z}`);
  if (R < 6) continue;
  for (const y of [7, 12, 17, 22, 27]) {
    if (y >= R - 1 || y < G) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"))) continue;
    if ((x * 5 + z * 3 + y) % 4 !== 0) continue;   // one window in four
    const [dx, dz] = ex.includes("N") ? [0, 1] : ex.includes("S") ? [0, -1] : ex.includes("W") ? [1, 0] : [-1, 0];
    const ix = x + dx, iz = z + dz;
    if (!info.has(`${ix},${iz}`) || exposed(ix, iz, y).length) continue;   // the air behind it must be inside
    if ((x + z + y) % 8 === 0) g.set(ix, y, iz, "glowstone");
    else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof: chimney stacks on the body's roof, and lanterns on the pavilion's corners
for (const [x, z] of [[3, 6], [6, 9], [2, 10]]) { g.set(x, 13, z, CHIM); g.set(x, 14, z, CHIM); g.set(x, 15, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
for (const [x, z] of [[0, 0], [7, 0], [0, 2], [7, 2]]) g.set(x, 30, z, "lantern", { hanging: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184814.nbt");
