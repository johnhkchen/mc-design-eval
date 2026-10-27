// way 1031519577: a 1970s-80s Auckland office block, seven storeys on a plinth with a penthouse
// tier over the south-west wing and a plant core in the middle. Concrete frame, tinted glass in
// 3-cell bays with white mullions and belt courses, a dark shopfront at street level with two
// entrances under canopies. Tiers come from the lidar roof (body top 32, wing 37, core 34), smoothed.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1031519577.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1031519577.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const XZ = (key) => key.split(",").map(Number);
const roofAt = new Map();
for (const [x, z, , roof] of cells) roofAt.set(K(x, z), roof);
const inF = (x, z) => roofAt.has(K(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces into the building
const outsOf = (x, z, inSet) => Object.keys(DIRS).filter((d) => !inSet(x + DIRS[d][0], z + DIRS[d][1]));

// Tiers. Lidar roof above y 0: most of the footprint sits at 31-33 (body, top surface 32); interior
// cells at 35-37 are a penthouse wing (top 37); interior cells at 34 are a plant core (top 34).
// Footprint-boundary cells never rise above the body, so the wing steps in from the street: a setback.
const BODY_TOP = 32, CORE_TOP = 34, TALL_TOP = 37;
const isBoundary = (x, z) => outsOf(x, z, inF).length > 0;
const tall = new Set(), core = new Set();
for (const [key, roof] of roofAt) {
  const [x, z] = XZ(key);
  if (isBoundary(x, z)) continue;
  if (roof >= 35) tall.add(key);
  else if (roof === 34) core.add(key);
}
const tierOf = (key) => (tall.has(key) ? "tall" : core.has(key) ? "core" : "body");
const tierSet = (tier) => (tier === "tall" ? tall : core);

// Storeys: floors at y 1, 5, ... 29 (4 blocks each). Ground floor 1-4 is the shopfront; y 31 is the cap.
const BODY_BASES = [1, 5, 9, 13, 17, 21, 25, 29];
function bodyRole(y) {
  if (y === BODY_TOP - 1) return "cap";
  const b = BODY_BASES.filter((v) => v <= y).pop();
  const off = y - b;
  if (off === 0) return b === 1 ? "base" : "belt";
  if (b === 1) return off < 3 ? "shop" : "fascia";
  return off < 3 ? "win" : "span";
}
// Penthouse: belt, two window rows, spandrel, cap. Core: a floor row and a cap row.
function tierRole(tier, y) {
  if (tier === "tall") return ["belt", "win", "win", "span", "cap"][y - BODY_TOP];
  return y === BODY_TOP ? "core" : "cap";
}

// Entrances: the longest straight runs of street-facing wall cells (one face each). A door sits at
// the middle of a run; the bays either side carry a lantern on the wall under a canopy.
// The walls are stair-stepped at the edges, so a face is taken as its cells in order along the wall.
function pickEntrances() {
  const faces = { N: [], S: [], W: [], E: [] };
  for (const key of roofAt.keys()) {
    const [x, z] = XZ(key);
    if (tierOf(key) !== "body") continue;
    const outs = outsOf(x, z, inF);
    if (outs.length === 1) faces[outs[0]].push({ x, z });
  }
  const ranked = Object.entries(faces).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  return ranked.map(([d, cs]) => {
    const vertical = d === "N" || d === "S";
    cs.sort((a, b) => (vertical ? a.x - b.x : a.z - b.z));
    const mid = Math.floor(cs.length / 2);
    return { d, door: cs[mid], bays: [cs[mid - 1], cs[mid + 1]].filter(Boolean) };
  });
}

// Entrance cells: "door" in the middle of each street face, "bay" either side (canopy and lantern).
const entranceAt = new Map();
const entrances = pickEntrances();
for (const e of entrances) {
  entranceAt.set(K(e.door.x, e.door.z), "door");
  for (const b of e.bays) entranceAt.set(K(b.x, b.z), "bay");
}

// Pane connections follow the wall: a pane joins the solid or glass cells beside it on its own face.
function paneState(d, S, x, z) {
  const c = (dx, dz) => (S(x + dx, z + dz) ? "true" : "false");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (d === "N" || d === "S") { st.east = c(1, 0); st.west = c(-1, 0); }
  else { st.north = c(0, -1); st.south = c(0, 1); }
  return st;
}

const g = new Voxels([48, 50, 35]);
const glassCells = [];   // wall windows that may get a warm light set behind them
for (const [key] of roofAt) {
  const [x, z] = XZ(key);
  const tier = tierOf(key);
  const top = tier === "tall" ? TALL_TOP : tier === "core" ? CORE_TOP : BODY_TOP;
  const S = tier === "body" ? inF : (xx, zz) => tierSet(tier).has(K(xx, zz));
  for (let y = 0; y < top; y++) {
    if (y === 0) { g.set(x, 0, z, "stone_bricks"); continue; }   // plinth under every cell
    const role = y < BODY_TOP ? bodyRole(y) : tierRole(tier, y);
    const Sy = y < BODY_TOP ? inF : S;
    const outs = outsOf(x, z, Sy);
    if (outs.length === 0) {
      // interior: floor slabs and roof slabs, air between them
      if (role === "belt" || role === "base" || role === "core") g.set(x, y, z, "smooth_stone");
      else if (role === "cap") g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const d = outs[0];
    const along = d === "N" || d === "S" ? x : z;
    const mullion = outs.length > 1 || along % 3 === 0;   // corners and every third cell
    const entry = y < BODY_TOP ? entranceAt.get(K(x, z)) : undefined;
    let block = null, state = null;
    if (entry && y <= 3) {
      if (y === 3) block = "black_concrete";                              // canopy over the entrance bays
      else if (y === 1) block = entry === "door" ? "dark_oak_door" : "polished_andesite";
      else if (y === 2 && entry === "door") block = "dark_oak_door";
      else if (y === 2) { block = "lantern"; state = { hanging: "true", waterlogged: "false" }; }
      if (block === "dark_oak_door") state = { facing: FACING[d], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    if (!block) {
      switch (role) {
        case "base": block = "polished_andesite"; break;
        case "belt": case "cap": block = "white_concrete"; break;
        case "span": case "core": block = "light_gray_concrete"; break;
        case "fascia": block = "gray_concrete"; break;
        case "shop": block = mullion ? "white_concrete" : "light_blue_stained_glass"; break;
        case "win":
          if (mullion) block = "white_concrete";
          else { block = "light_blue_stained_glass_pane"; state = paneState(d, Sy, x, z); }
          break;
        default: block = "light_gray_concrete";
      }
      if (!mullion && (role === "win" || role === "shop")) glassCells.push({ x, y, z, d, along, tier });
    }
    g.set(x, y, z, block, state);
  }
  // roof plant on the body roof: a few 2-high boxes over the interior
  if (tier === "body" && outsOf(x, z, inF).length === 0 && (x * 5 + z * 3) % 13 === 0) {
    g.set(x, BODY_TOP, z, "light_gray_concrete");
    g.set(x, BODY_TOP + 1, z, "light_gray_concrete");
  }
}

// Warm light behind some glass: glowstone in the body and shopfront, shroomlight in the penthouse.
// The cell behind is interior air, so the glow shows through the pane without an opening.
for (const c of glassCells) {
  if ((c.along * 3 + c.y) % 7 !== 0) continue;
  const [dx, dz] = DIRS[c.d];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || outsOf(ix, iz, inF).length) continue;
  g.set(ix, c.y, iz, c.tier === "tall" ? "shroomlight" : "glowstone");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, tall: tall.size, core: core.size, entrances: entrances.map((e) => `${e.d}@${e.door.x},${e.door.z}`), ...stats }));
