// DC65465: 555 12th St NW, Commercial-Office-Large, 27 x 45 footprint.
// A 1960s-70s speculative office: a 21-block central bar (the lidar's tall tier) on 19-block flanks, with a
// 7-block low wing on each side of the bar. Light precast piers and spandrels, bronze-blue glass in a grid,
// a polished base course, a parapet, a plant penthouse on the bar, and a dark awning over the 12th St entrance.
//
// Scale: 0.42 blocks per metre, so a storey of about 7 m reads as 3 blocks. The lidar gives 19-21 blocks, which is
// five storeys on the flanks and six on the bar; that is the honest massing, not a sculpted one.
//
// Tiers (smoothed from the lidar roof values, which are 19, 20, 21 and 7): 21 -> tower (top block y 20),
// 19 or 20 out of the tall core -> wing (top block y 18), 7 -> low (top block y 6).
// Everything sits on a 2-block plinth (y 0-1) that runs under every cell, so no tier floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65465.cells.json`, "utf8"));

const X = 27, Z = 45, Y = 33;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// --- massing tiers -------------------------------------------------------------------------------------------
const TOP = { low: 6, wing: 18, tower: 20 };
function tierAt(x, z) {
  const r = fp.get(`${x},${z}`).roof;
  if (r <= 10) return "low";
  if (r >= 21) return "tower";
  if (r === 20) {
    // a 20 is lidar noise on the bar's edge: it joins the bar when most of its neighbours are bar
    let tall = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((fp.get(`${x + dx},${z + dz}`)?.roof ?? 0) >= 21) tall++;
    return tall >= 5 ? "tower" : "wing";
  }
  return "wing";
}
const tierMap = new Map();
for (const key of fp.keys()) { const [x, z] = key.split(",").map(Number); tierMap.set(key, tierAt(x, z)); }
const tier = (x, z) => tierMap.get(`${x},${z}`);
const top = (x, z) => TOP[tier(x, z)];

// the faces a cell shows to the outside, or to a lower tier beside it
function exposures(x, z) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || top(nx, nz) < top(x, z)) out.push(d);
  }
  return out;
}

// --- facade grammar ------------------------------------------------------------------------------------------
// storey floors every 3 blocks from y 2; spandrel bands on each floor line; glass in the two rows above it
const FLOORS = [2, 5, 8, 11, 14, 17];
const SPANDREL = new Set([5, 8, 11, 14, 17]);
// piers on a 3-block module centred on the building, so each bay has a centred window pair
const PIER_CENTRE = { N: 13, S: 13, E: 22, W: 22 };

const PANE = "light_blue_stained_glass_pane";
const PIER = "smooth_quartz";
const SPANDREL_BLOCK = "light_gray_concrete";
const BASE = "polished_andesite";
const DECK = "gray_concrete";
const FLOOR = "smooth_stone";

const g = new Voxels([X, Y, Z]);

// the 12th St entrance: a five-cell bay on the z = 0 face, doors on x 12 and 13
const ENTRANCE = new Set(["11,0", "12,0", "13,0", "14,0", "15,0"]);
const DOORS = new Set(["12,0", "13,0"]);

// glazing: the pane joins its neighbours along the face, never through the wall's depth
function paneState(d) {
  const along = d === "N" || d === "S" ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return { ...along, waterlogged: "false" };
}

function wallBlock(x, z, y, T, exp) {
  if (y === 2) return { block: BASE };
  if (y === T) return { block: PIER };                        // parapet
  if (y === 17 && T === 18) return { block: "smooth_quartz_slab", state: { type: "bottom", waterlogged: "false" } }; // cornice
  let face = null, pier = exp.length !== 1;                   // a corner (two faces) is always a pier
  if (exp.length === 1) {
    face = exp[0];
    const u = face === "N" || face === "S" ? x : z;
    pier = ((u - PIER_CENTRE[face]) % 3) === 0;
  }
  if (SPANDREL.has(y)) return { block: SPANDREL_BLOCK };
  if (pier) return { block: PIER };
  return { block: PANE, state: paneState(face) };
}

// --- the volume -----------------------------------------------------------------------------------------------
const walls = new Map();
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposures(x, z);
  if (exp.length) walls.set(key, exp);
}

for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  // plinth: solid from the ground up to the base course, under every cell
  g.set(x, 0, z, "polished_andesite"); g.set(x, 1, z, "polished_andesite");
  const T = top(x, z), exp = walls.get(key);
  const entrance = ENTRANCE.has(key);
  for (let y = 2; y <= T; y++) {
    if (exp) {
      if (entrance && z === 0) {
        if (y === 2) { g.set(x, y, z, BASE); continue; }
        if (y === 5) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }  // the awning band
        if (DOORS.has(key) && (y === 3 || y === 4)) {
          const hinge = x === 12 ? "left" : "right";
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 3 ? "lower" : "upper", hinge, open: "false", powered: "false" });
          continue;
        }
        if (y === 3 || y === 4) { g.set(x, y, z, PANE, paneState("N")); continue; }
      }
      const b = wallBlock(x, z, y, T, exp);
      g.set(x, y, z, b.block, b.state);
    } else {
      if (y === T) g.set(x, y, z, DECK);
      else if (FLOORS.includes(y)) g.set(x, y, z, FLOOR);
    }
  }
}

// lit windows: a deterministic few of the glazed bays show a warm glow just inside the glass
for (const [key, exp] of walls) {
  const [x, z] = key.split(",").map(Number);
  if (exp.length !== 1) continue;
  const T = top(x, z);
  const [dx, dz] = DIRS[exp[0]];
  for (let y = 3; y <= T; y++) {
    if (FLOORS.includes(y) || SPANDREL.has(y) || y === T || y === 2) continue;
    const pier = ((exp[0] === "N" || exp[0] === "S" ? x - PIER_CENTRE[exp[0]] : z - PIER_CENTRE[exp[0]]) % 3) === 0;
    if (pier) continue;
    if ((x * 5 + z * 3 + y) % 9 !== 0) continue;
    const ix = x - dx, iz = z - dz;                            // just inside the glass
    if (!inFp(ix, iz) || walls.has(`${ix},${iz}`)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// the vestibule's hanging lanterns, just inside the doors
g.set(12, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(13, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: a penthouse on the bar's deck (its walls rest on the deck at y 20), and two AC units on the flank
for (let z = 8; z <= 12; z++) for (let x = 11; x <= 17; x++) {
  const edge = x === 11 || x === 17 || z === 8 || z === 12;
  const corner = (x === 11 || x === 17) && (z === 8 || z === 12);
  g.set(x, 21, z, FLOOR);                                      // penthouse floor on the deck
  if (!edge) { g.set(x, 24, z, DECK); continue; }
  if (corner) { for (let y = 22; y <= 23; y++) g.set(x, y, z, PIER); g.set(x, 24, z, DECK); continue; }
  const alongX = z === 8 || z === 12;
  for (let y = 22; y <= 23; y++) {
    const pier = (alongX ? x : z) % 3 === 0;
    g.set(x, y, z, pier ? PIER : PANE, paneState(alongX ? "N" : "W"));
  }
  g.set(x, 24, z, DECK);
}
for (const [x, z] of [[2, 6], [3, 6], [2, 7], [3, 7]]) g.set(x, 19, z, "iron_block");

const out = `${DIR}/DC65465.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ out, ...res }));
