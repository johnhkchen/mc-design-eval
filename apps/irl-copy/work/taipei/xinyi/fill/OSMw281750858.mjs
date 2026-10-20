import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// School block (教室): two-storey reinforced-concrete classroom block, cream wall
// tile, light-grey spandrels, red cornice band, corner pilasters, a central
// entrance on the street-facing frontage, rooftop stair housing and flagpole.
// Flat roof at lowest ground + 11 (two storeys of 5 plus parapet).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw281750858";
const W = 125, H = 23, D = 137;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x * 1000 + z;
const ground = new Map();
let minG = Infinity;
let sumX = 0, sumZ = 0;
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(key(x, z), gg);
  minG = Math.min(minG, gg);
  sumX += x; sumZ += z;
}
const n = cells.length;
const cx = Math.round(sumX / n);
const cz = Math.round(sumZ / n);

const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const F0 = minG;                        // ground-floor slab level
const TOP = Math.min(minG + 11, H - 1); // roof surface top

function S(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward face of an edge cell, or null if the cell is interior.
function outward(x, z) {
  if (!has(x + 1, z)) return { dx: 1, dz: 0, face: "east" };
  if (!has(x - 1, z)) return { dx: -1, dz: 0, face: "west" };
  if (!has(x, z + 1)) return { dx: 0, dz: 1, face: "south" };
  if (!has(x, z - 1)) return { dx: 0, dz: -1, face: "north" };
  return null;
}
const isEdge = (x, z) => has(x, z) && outward(x, z) !== null;

function glassProps(face) {
  // A pane on an east/west wall runs along z; on a north/south wall it runs along x.
  if (face === "east" || face === "west") {
    return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  }
  return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

// Material for an exterior wall cell at height y.
function wallBlock(y, gr, winCol, pilaster) {
  const rel = y - F0;
  if (y === TOP) return "light_gray_concrete";           // coping
  if (y === gr + 1) return "smooth_stone";               // base course
  if (pilaster) return "light_gray_concrete";            // corner / pier fins
  if (rel === 10) return "red_terracotta";               // red cornice band
  if (rel < 0) return "white_concrete";
  if (rel === 0 || rel === 5) return "light_gray_concrete"; // floor spandrels
  if (rel === 4 || rel === 9) return "light_gray_concrete"; // lintels
  if (rel >= 1 && rel <= 3) return winCol ? "glass_pane" : "white_concrete";
  if (rel >= 6 && rel <= 8) return winCol ? "glass_pane" : "white_concrete";
  return "white_concrete";
}

const storeyFloors = [F0 + 5, F0 + 10];

// Corner test: an edge cell whose outward faces form a corner (two faces open).
function isCorner(x, z) {
  const open = [!has(x + 1, z), !has(x - 1, z), !has(x, z + 1), !has(x, z - 1)];
  const cnt = open.filter(Boolean).length;
  return cnt >= 2 || (open[0] || open[1]) && (open[2] || open[3]);
}

// ---- Main shell -----------------------------------------------------------
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr && y < H; y++) S(x, y, z, "stone");

  const out = outward(x, z);
  if (out) {
    // Window grid: 2-wide windows with 2-wide piers; corners become pilasters.
    const along = out.face === "east" || out.face === "west" ? z : x;
    const winCol = (along % 4) < 2;
    const pilaster = isCorner(x, z) || (!winCol && (along % 4) === 3 && false);
    for (let y = gr + 1; y <= TOP; y++) {
      const id = wallBlock(y, gr, winCol, pilaster);
      const rel = y - F0;
      if (id === "glass_pane") S(x, y, z, id, glassProps(out.face));
      else S(x, y, z, id);

      // Warm light behind some windows, on both storeys (glowstone in the air gap).
      const lit = (rel === 2 || rel === 7) && winCol && (along % 8) === 1;
      if (lit) {
        const ix = x - out.dx, iz = z - out.dz;
        if (has(ix, iz) && !isEdge(ix, iz) && gnd(ix, iz) < y) {
          S(ix, y, iz, "glowstone");
        }
      }
    }
  } else {
    // Interior: floor slabs per storey and the roof deck; air between.
    for (const y of [F0, ...storeyFloors]) {
      if (y > gr && y <= TOP) S(x, y, z, "smooth_stone");
    }
    if (TOP > gr) S(x, TOP, z, "smooth_stone");
  }
}

// ---- Entrance on the street-facing frontage -------------------------------
// Prefer south-facing edge cells (largest z), nearest the centroid's x; fall back
// to north-facing, then to any edge cell, so an L-shaped plan always gets a door.
function pickEntrance() {
  const edges = cells.map(([a, b]) => [a, b]).filter(([x, z]) => isEdge(x, z));
  const pick = (face, score) => {
    const c = edges.filter(([x, z]) => outward(x, z).face === face);
    if (!c.length) return null;
    c.sort((a, b) => score(a) - score(b));
    return c[0];
  };
  return (
    pick("south", ([x, z]) => Math.abs(x - cx) - z * 0.01) ||
    pick("north", ([x, z]) => Math.abs(x - cx) + z * 0.01) ||
    pick("east", ([x, z]) => Math.abs(z - cz)) ||
    pick("west", ([x, z]) => Math.abs(z - cz)) ||
    edges[0]
  );
}

const ent = pickEntrance();
if (ent) {
  const [ex, ez] = ent;
  const out = outward(ex, ez);
  const alongAxis = out.face === "east" || out.face === "west" ? "z" : "x";
  const gr0 = gnd(ex, ez);
  const doorProps = (half) => ({
    facing: out.face, half, hinge: "left", open: "false", powered: "false",
  });
  for (let k = -3; k <= 3; k++) {
    const x = alongAxis === "x" ? ex + k : ex;
    const z = alongAxis === "z" ? ez + k : ez;
    if (!has(x, z) || !isEdge(x, z)) continue;
    const gr = gnd(x, z);
    const o = outward(x, z);
    if (!o || o.face !== out.face) continue;
    if (k === 0) {
      S(x, gr + 1, z, "oak_door", doorProps("lower"));
      S(x, gr + 2, z, "oak_door", doorProps("upper"));
      S(x, gr + 3, z, "light_gray_concrete");   // canopy lintel over the door
    } else {
      S(x, gr + 2, z, "glass_pane", glassProps(o.face));
      S(x, gr + 3, z, "light_gray_concrete");
    }
  }
}

// ---- Rooftop: stair housing and flagpole ----------------------------------
let best = null, bestD = Infinity;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (isEdge(x, z)) continue;
  const d = Math.abs(x - cx) + Math.abs(z - cz);
  if (d < bestD) { bestD = d; best = [x, z]; }
}
if (best) {
  const [bx, bz] = best;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = bx + dx, z = bz + dz;
      if (!has(x, z)) continue;
      const ring = !(dx === 0 && dz === 0);
      if (ring) for (let y = TOP + 1; y <= TOP + 2; y++) S(x, y, z, "white_concrete");
      S(x, TOP + 3, z, "light_gray_concrete");
    }
  }
  // Flagpole standing on the housing roof, with a red flag.
  for (let y = TOP + 4; y <= TOP + 7; y++) S(bx, y, bz, "iron_bars");
  S(bx + 1, TOP + 7, bz, "red_wool");
}

g.save(`${DIR}/${ID}.nbt`);
