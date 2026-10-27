// Oasis, Mt Eden / Newton: a 1970s concrete-frame block of about eleven storeys (lidar roof 47 blocks, 4 blocks a
// storey). A tall slab on the uphill and central cells, stepped wings down the north-west and south-west edges, and a
// plant room on the roof. Floors sit on 4-block lines everywhere so every storey lands on the one below. Each cell
// stands on its own foundation (stone below its lidar ground, basalt plinth up to the ground floor). The facade is
// the exposed outer ring: white concrete piers, recessed window bays with a pane one cell in, grey spandrels and floor
// bands; the ground storey is shopfront glass, with the entrance on the west (lowest, downhill) face. The inside is
// air with a floor slab per storey, and a few glowstone lamps behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_822448653.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_822448653.nbt`;

const W = 22, H = 59, D = 21;
// the lidar roofs snap to clean tiers: a single-storey wing, a two-storey wing, a three-storey low wing, a mid
// setback, and the twelve-storey slab (roof 47 is the parapet line, so the top is 48)
const TIERS = [8, 16, 24, 36, 48];
const snap = (r) => TIERS.reduce((a, t) => (Math.abs(t - r) < Math.abs(a - r) ? t : a));

// one column per footprint cell: g = lidar ground, L0 = ground-floor line (on a 4-block line, at least 4 so every
// cell has a plinth), top = roof surface (cells y < top are the building; the parapet cap sits at top)
const col = new Map();
for (const [x, z, g, r] of cells) {
  const L0 = Math.max(4, Math.ceil(g / 4) * 4);
  col.set(`${x},${z}`, { x, z, g, L0, top: Math.max(snap(r), L0 + 4) });
}
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };

// a neighbour is outdoors at height y when it is off the footprint or y is above its roof
const outdoor = (x, z, y) => { const n = at(x, z); return !n || y >= n.top; };
const exposure = (c, y) => Object.keys(DIRS).filter((d) => outdoor(c.x + DIRS[d][0], c.z + DIRS[d][1], y));

// the block map: "x,y,z" -> { block, state }; air is absence. Written out at the end.
const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });
const PANE = "light_blue_stained_glass_pane";
const panes = new Set();
const pane = (x, y, z) => { put(x, y, z, PANE); panes.add(key(x, y, z)); };
const M = {
  found: "stone", plinth: "polished_basalt", floor: "light_gray_concrete", spandrel: "stone",
  pier: "white_concrete", cornice: "smooth_quartz", deck: "stone", plant: "light_gray_concrete",
  lamp: "glowstone",
};

// 1. the solid parts: foundation, plinth, a floor slab and a spandrel band per storey, the roof deck and cornice
for (const c of col.values()) {
  const { x, z, g, L0, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < g) { put(x, y, z, M.found); continue; }
    if (y < L0) { put(x, y, z, M.plinth); continue; }
    if (y === top - 1) { put(x, y, z, exposure(c, y).length ? M.cornice : M.deck); continue; }
    const r = (y - L0) % 4;
    if (r === 0) put(x, y, z, M.floor);
    else if (r === 3) put(x, y, z, M.spandrel);
  }
  // the parapet cap on the rim: a half slab on the cornice where the roof ends or steps down
  if (exposure(c, top - 1).length) put(x, top, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 2. the facade: rows 1 and 2 of each storey (the window band, between a floor slab and a spandrel)
for (const c of col.values()) {
  const { x, z, L0, top } = c;
  for (let y = L0 + 1; y < top - 1; y++) {
    if ((y - L0) % 4 === 3) continue;                 // not a window row
    const E = exposure(c, y); if (!E.length) continue;
    const k = Math.floor((y - L0) / 4);
    if (k === 0) {                                    // shopfront: flush glass, piers only at corners
      if (E.length > 1) put(x, y, z, M.pier); else pane(x, y, z);
      continue;
    }
    if (E.length > 1) { put(x, y, z, M.pier); continue; }   // a corner pier
    const d = E[0], [dx, dz] = DIRS[d];
    const along = d === "W" || d === "E" ? z : x;
    const pier = along % 3 === 0;                     // pier, pane, pane, pier, ...
    const ix = x - dx, iz = z - dz;                   // one cell in from the face
    const inner = at(ix, iz);
    const innerIndoor = inner && exposure(inner, y).length === 0;
    if (pier) {
      put(x, y, z, M.pier);
      if (innerIndoor) put(ix, y, iz, M.pier);       // the mullion carries through the depth
    } else if (innerIndoor) {
      // a recessed bay: the outer cell is open, the glass sits one cell in
      B.delete(key(x, y, z));
      pane(ix, y, iz);
      // a warm lamp behind some panes, on the floor slab of the room
      const jx = ix - dx, jz = iz - dz, jn = at(jx, jz);
      if (jn && (along + k) % 4 === 1 && exposure(jn, y).length === 0 && (y - L0) % 4 === 1) put(jx, y, jz, M.lamp);
    } else {
      pane(x, y, z);                                  // a thin wall: the glass is flush
    }
  }
}

// 3. the entrance: the middle bay of the west face at the lowest ground, a recess with a door, lanterns under a
// quartz canopy on two posts
const ENT = { x: 2, z: 6 };
const e = at(ENT.x, ENT.z);
const ey = e.L0;                                       // ground-floor slab line
const door = (half) => ({ facing: FACING.W, half, hinge: "left", open: "false", powered: "false" });
put(ENT.x, ey + 1, ENT.z, "oak_door", door("lower"));
put(ENT.x, ey + 2, ENT.z, "oak_door", door("upper"));
panes.delete(key(ENT.x, ey + 1, ENT.z)); panes.delete(key(ENT.x, ey + 2, ENT.z));
// the flanking shop glass stays on the outer cell below each lantern
for (const zz of [ENT.z - 1, ENT.z + 1]) {
  put(ENT.x, ey + 2, zz, "lantern", { hanging: "true", waterlogged: "false" });   // hung from the canopy
  panes.delete(key(ENT.x, ey + 2, zz));
  put(ENT.x + 1, ey + 1, zz, M.pier); put(ENT.x + 1, ey + 2, zz, M.pier);         // the posts
}
for (let xx = ENT.x; xx <= ENT.x + 1; xx++) for (let zz = ENT.z - 1; zz <= ENT.z + 1; zz++) put(xx, ey + 3, zz, "smooth_quartz");

// 4. the roof: a plant room over the centre, two vent stacks
for (let x = 7; x <= 12; x++) for (let z = 8; z <= 12; z++) {
  for (let y = 48; y <= 50; y++) put(x, y, z, M.plant);
  put(x, 51, z, M.spandrel);
}
for (const [x, z] of [[18, 14], [16, 8]]) {
  for (let y = 48; y <= 50; y++) put(x, y, z, M.plant);
  put(x, 51, z, M.cornice);
}

// 5. panes connect to their neighbours, as the game draws a pane wall (to any solid block or another pane)
const DIRS4 = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const SOFT = /slab|door|lantern|air/;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const state = {};
  for (const [name, [dx, dz]] of Object.entries(DIRS4)) {
    const n = B.get(key(x + dx, y, z + dz));
    state[name] = n && !SOFT.test(n.block) ? "true" : "false";
  }
  state.waterlogged = "false";
  put(x, y, z, PANE, state);
}

// write the map into the volume
const g = new Voxels([W, H, D]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save(OUT);
console.log("saved", OUT, stats);
