// Way 261494225: a three-storey stripped-classical commercial block (c.1930s, Auckland's main-street type): cream plaster
// over brick on a basalt base, timber shopfronts and fascia, dark-oak doors under a slab canopy, recessed windows with
// quartz piers and mullions, parapet and cornice. Massing from the lidar roof heights: 12 = three storeys, 8 = two, 4 = one,
// majority-smoothed into flat tiers. Storey lines sit at absolute heights (floors at 0, 4, 8; cap at T-1, parapet at T).

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494225";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

const W = 102, D = 50, H = 25;
const BASE = "stone_bricks", SKIN = "smooth_quartz", PIER = "quartz_pillar", GLASS = "light_blue_stained_glass";
const FASCIA = "dark_oak_planks", FLOOR = "oak_planks", ROOF = "smooth_stone", LIGHT = "glowstone";
const PLANT = "light_gray_concrete";
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const k2 = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, g, r] of cells) C.set(k2(x, z), { x, z, g, r, T: 0, depth: 0, step: false, corner: false, niche: false, glass: false, door: null });
const at = (x, z) => C.get(k2(x, z));
const outs = (c) => NB.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));

// 1. tiers from the lidar roof, then a majority vote over the 3x3 so the massing is flat tiers, not noise
const tierOf = (r) => (r >= 10 ? 12 : r >= 6 ? 8 : 4);
for (const c of C.values()) c.T = tierOf(c.r);
const raw = new Map([...C].map(([k, c]) => [k, c.T]));
for (const c of C.values()) {
  const n = { 4: 0, 8: 0, 12: 0 };
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = at(c.x + dx, c.z + dz); if (o) n[raw.get(k2(o.x, o.z))]++;
  }
  let best = raw.get(k2(c.x, c.z));
  for (const t of [4, 8, 12]) if (n[t] > n[best]) best = t;
  c.T = best;
}

// 2. depth in from the outside wall (1 = facade, 2 = wall core, 3+ = interior)
const queue = [];
for (const c of C.values()) if (outs(c).length) { c.depth = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of NB) { const o = at(c.x + dx, c.z + dz); if (o && !o.depth) { o.depth = c.depth + 1; queue.push(o); } }
}
// a step between tiers, behind the facade: solid, so the higher tier's side reads as a wall
for (const c of C.values()) c.step = c.depth >= 2 && NB.some(([dx, dz]) => { const o = at(c.x + dx, c.z + dz); return o && o.T !== c.T; });

// 3. facade: the outward face sets the bay index (x on a north/south face, z on an east/west one); corners are piers
for (const c of C.values()) {
  if (c.depth !== 1) continue;
  const o = outs(c);
  const zN = o.find(([, dz]) => dz !== 0), xN = o.find(([dx]) => dx !== 0);
  // no quoin corners: on this diagonal footprint nearly every edge cell has two exposed faces, and marking them all
  // as piers left the long elevations blank; the z-face (else x-face) sets the bay and its windows
  c.corner = false;
  c.n = zN ?? xN;
  c.idx = zN ? c.x : c.z;
  c.k = ((c.idx % 4) + 4) % 4;   // 0 pier, 1 and 3 glass, 2 mullion
}
const winRow = (y, T) => (y % 4 === 1 || y % 4 === 2) && y <= T - 2;   // two glazed rows per storey, under a head at 4s+3

// recessed windows: the facade cell is an opening, the glass sits one block in, the room is air behind it
let niches = 0, lit = 0;
const litSet = new Set();
for (const c of C.values()) {
  if (c.depth !== 1 || c.corner || (c.k !== 1 && c.k !== 3)) continue;
  const inw = at(c.x - c.n[0], c.z - c.n[1]);
  if (!inw || inw.depth !== 2 || inw.step || inw.T !== c.T) continue;
  c.niche = true; inw.glass = true; niches++;
  // every third bay on each storey has a glowstone just inside the glass (warm lights)
  const bay = Math.floor(c.idx / 4);
  for (let s = 0; 4 * s + 1 <= c.T - 2; s++) {
    const room = at(c.x - 2 * c.n[0], c.z - 2 * c.n[1]);
    if (c.k === 1 && (bay + s) % 3 === 0 && room && room.depth === 3 && !room.step && room.T === c.T) {
      litSet.add(`${c.x},${c.z},${4 * s + 1}`); lit++;
    }
  }
}

// 4. entrances: two dark-oak doors on pier bays of low, tall-enough facades, nearest to x 20 and x 70
const doorCand = [...C.values()].filter((c) => c.depth === 1 && !c.corner && c.n[1] !== 0 && c.k === 0 && c.g <= 1 && c.T >= 8 &&
  (() => { const i = at(c.x - c.n[0], c.z - c.n[1]); return i && i.depth === 2 && !i.step; })());
const doors = [];
for (const tx of [20, 70]) {
  const pick = doorCand.filter((c) => !doors.includes(c)).sort((a, b) => Math.abs(a.x - tx) - Math.abs(b.x - tx))[0];
  if (pick) doors.push(pick);
}
for (const d of doors) {
  const inw = at(d.x - d.n[0], d.z - d.n[1]); inw.door = true;
  d.facing = d.n[1] < 0 ? "south" : "north";   // the door faces into the building
}

// 5. the solid: foundation to ground, then each storey by depth
const out = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => out.set(x, y, z, b, s);
for (const c of C.values()) {
  const T = c.T, g0 = c.g;
  for (let y = 0; y < g0; y++) put(c.x, y, c.z, BASE);   // foundation under the ground
  if (c.step) { for (let y = g0; y < T; y++) put(c.x, y, c.z, SKIN); continue; }
  if (c.depth === 1) {
    for (let y = g0; y <= T; y++) {
      let b = SKIN;
      if (y === 0) b = BASE;
      else if (y === T) b = SKIN;                                     // parapet
      else if (y === T - 1) b = SKIN;                                 // cornice
      else if (y === 3 && T >= 8) b = FASCIA;                         // ground-floor fascia
      else if ((c.k === 1 || c.k === 3) && !c.corner && winRow(y, T)) b = c.niche ? null : GLASS;
      else if (c.corner || c.k === 0) b = PIER;
      if (b) put(c.x, y, c.z, b);
    }
  } else if (c.depth === 2) {
    for (let y = g0; y < T; y++) {
      let b = BASE, s = null;
      if (c.glass && winRow(y, T)) b = GLASS;
      put(c.x, y, c.z, b, s);
    }
  } else {
    for (let y = g0; y < T; y++) {
      if (y === 0) put(c.x, y, c.z, BASE);
      else if (y === T - 1) put(c.x, y, c.z, ROOF);
      else if ((y === 4 && T >= 8) || (y === 8 && T >= 12)) put(c.x, y, c.z, FLOOR);
      else if (litSet.has(`${c.x},${c.z},${y}`)) put(c.x, y, c.z, LIGHT);
    }
  }
}

// rooftop plant: 2 x 2 units on the top tier's interior, standing on its roof
let plant = 0;
for (const c of C.values()) {
  if (c.depth < 4 || c.T !== 12 || c.x % 12 !== 6 || c.z % 8 !== 4) continue;
  const four = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (four.every((o) => o && o.T === 12 && o.depth >= 3)) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(c.x + dx, 12, c.z + dz, PLANT);
    plant++;
  }
}

// doors, canopies, passages
const dsh = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
for (const d of doors) {
  put(d.x, 1, d.z, "dark_oak_door", dsh("lower", d.facing));
  put(d.x, 2, d.z, "dark_oak_door", dsh("upper", d.facing));
  for (const dx of [-1, 0, 1]) {
    const o = at(d.x + dx, d.z);
    if (o && o.depth === 1 && !o.corner && o.n[1] === d.n[1]) put(o.x, 3, o.z, "dark_oak_slab", { type: "top" });
  }
  const inw = at(d.x - d.n[0], d.z - d.n[1]);
  out.set(inw.x, 1, inw.z, "air"); out.set(inw.x, 2, inw.z, "air");
  put(inw.x, 3, inw.z, "lantern", { hanging: "true" });
}

// sanity: nothing floats (each block has solid below it, or a solid neighbour in its own layer)
let floating = 0, blocks = 0;
for (const c of C.values()) for (let y = 0; y <= 13; y++) {
  if (!out.get(c.x, y, c.z)) continue;
  blocks++;
  if (y === 0 || out.get(c.x, y - 1, c.z) || NB.some(([dx, dz]) => out.get(c.x + dx, y, c.z + dz))) continue;
  floating++;
}
const tiers = { 4: 0, 8: 0, 12: 0 };
for (const c of C.values()) tiers[c.T]++;
console.log({ cells: C.size, tiers, steps: [...C.values()].filter((c) => c.step).length, niches, lit, doors: doors.length, plant, blocks, floating, palette: out.palette.length });

out.save(`${SRC}.nbt`);
console.log("saved", `${SRC}.nbt`);
