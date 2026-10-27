// Way 451530298, Eden Terrace side of Maungawhau: a five-storey mid-century concrete office block on a falling site.
// The body is solid from y 0 to its roof tier, so every storey, setback and roof stands on what is below it. The facade
// is only the exposed skin: a concrete frame (plinth, storey bands, lintels, piers) with tinted glass between, one air
// cell behind each pane, and warm lamps in some bays. Roof tiers come from the lidar, smoothed to two heights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_451530298.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_451530298.nbt";

const W = 51, D = 36, H = 34;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const ground = Array.from({ length: W }, () => Array(D).fill(null));
const roof = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] !== null;

// Two roof tiers, not the lidar's speckle: the five-storey body (roof 20-21) and a four-storey wing (18-19, the west side).
// A cell takes the majority tier of its 3x3 neighbourhood, so one noisy DSM cell does not notch the roofline.
const isTall = (x, z) => roof[x][z] >= 20;
const tallMajority = (x, z) => {
  let n = 0, m = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inFP(x + dx, z + dz)) continue;
    m++; if (isTall(x + dx, z + dz)) n++;
  }
  return 2 * n > m;
};
// Roof slab height per cell: 20 (body) or 16 (wing), never less than 3 above its grade (the uphill NW corner)
const TOP = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => {
  if (!inFP(x, z)) return -1;
  return Math.max(tallMajority(x, z) ? 20 : 16, ground[x][z] + 3);
}));
const solid = (x, y, z) => inFP(x, z) && y >= 0 && y <= TOP[x][z];

// Outward face of a solid cell: a footprint edge first (W/E before N/S), else the first open side; null if interior
const DIRS = [{ n: "W", dx: -1, dz: 0 }, { n: "E", dx: 1, dz: 0 }, { n: "N", dx: 0, dz: -1 }, { n: "S", dx: 0, dz: 1 }];
function faceOf(x, y, z) {
  let first = null;
  for (const d of DIRS) {
    if (solid(x + d.dx, y, z + d.dz)) continue;
    if (!inFP(x + d.dx, z + d.dz)) return d;
    if (!first) first = d;
  }
  return first;
}

// The facade on one exposed cell. u runs along the face: z on the west and east faces, x on the north and south.
function skin(x, y, z, d) {
  const gr = ground[x][z], top = TOP[x][z];
  const u = d.dx ? z : x, last = d.dx ? D - 1 : W - 1;
  if (y < gr) return { block: "andesite" };                       // hillside foundation, buried on the uphill side
  if (y === gr) return { block: "polished_andesite" };            // plinth course at grade
  if (y === top) return { block: "smooth_stone" };                // cornice
  const row = y % 4;                                              // storeys are 4 blocks, on a lattice from y 0
  if (row === 0) return { block: "white_concrete" };              // storey band
  if (row === 3) return { block: y < 4 && gr <= 2 ? "polished_andesite" : "light_gray_concrete" }; // lintel, shop canopy
  if (u % 4 === 0 || u === last) return { block: "light_gray_concrete" };  // mullion and pier
  return { pane: true };                                          // glazing in rows 1 and 2 of each storey
}

// Pane arms run in the plane of the face: along z on east/west faces, along x on north/south faces
function paneState(x, y, z, d) {
  if (d.dx) return { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false" };
  return { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)) };
}

const vox = new Voxels([W, H, D]);
const footprint = cells.map(([x, z]) => [x, z]);

// The solid body and its roof membrane
for (const [x, z] of footprint) {
  const top = TOP[x][z];
  for (let y = 0; y < top; y++) vox.set(x, y, z, "white_concrete");
  vox.set(x, top, z, "gray_concrete");
}

// The facade skin: one exposed face per cell, with glazing carved back to an air cell
let panes = 0, lamps = 0;
for (const [x, z] of footprint) {
  for (let y = 0; y <= TOP[x][z]; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const s = skin(x, y, z, d);
    if (!s.pane) { vox.set(x, y, z, s.block); continue; }
    vox.set(x, y, z, "light_blue_stained_glass_pane", paneState(x, y, z, d));
    panes++;
    // One air cell behind the glass, unless it is another face's skin
    const ix = x - d.dx, iz = z - d.dz;
    if (!solid(ix, y, iz) || faceOf(ix, y, iz)) continue;
    vox.set(ix, y, iz, "air");
    const bay = Math.floor((d.dx ? z : x) / 4), storey = Math.floor(y / 4);
    if ((bay * 3 + storey * 5) % 9 === 0) { vox.set(ix, y, iz, "glowstone"); lamps++; }
    else if ((bay + storey) % 13 === 0) { vox.set(ix, y, iz, "shroomlight"); lamps++; }
  }
}

// Parapet on the footprint edge, one block over each tier's cornice
for (const [x, z] of footprint) {
  if (x === 0 || z === 0 || x === W - 1 || z === D - 1) vox.set(x, TOP[x][z] + 1, z, "white_concrete");
}

// Entrance: on the east edge at a window bay centre where the lot is lowest; a lobby cell behind the doors
let door = null;
for (let z = 0; z < D; z++) {
  if (!inFP(W - 1, z) || z % 4 !== 2) continue;
  if (!door || ground[W - 1][z] < door.gr) door = { z, gr: ground[W - 1][z] };
}
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
vox.set(W - 1, door.gr, door.z, "dark_oak_door", doorState("lower"));
vox.set(W - 1, door.gr + 1, door.z, "dark_oak_door", doorState("upper"));
vox.set(W - 2, door.gr, door.z, "air");
vox.set(W - 2, door.gr + 1, door.z, "air");

// Roof plant on the body: a stair-and-lift core and two plant boxes
const onBody = (x, z) => inFP(x, z) && TOP[x][z] === 20;
const block = (x0, x1, z0, z1, y0, y1, b) => {
  for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) if (onBody(x, z)) for (let y = y0; y <= y1; y++) vox.set(x, y, z, b);
};
block(33, 37, 10, 14, 21, 23, "light_gray_concrete");
block(33, 37, 10, 14, 24, 24, "smooth_stone");
block(10, 16, 24, 28, 21, 21, "light_gray_concrete");
block(10, 16, 24, 28, 22, 22, "iron_block");

const { blocks, palette } = vox.save(OUT);
console.log(JSON.stringify({ blocks, palette, panes, lamps, door, roofTiers: { body: 20, wing: 16 } }));
