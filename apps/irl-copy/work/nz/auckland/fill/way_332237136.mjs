// Way 332237136: a stepped 1960s office-and-shop block on Mt Eden's flank (Eden Terrace side), 29 x 34 blocks.
// Massing from the lidar roof column: heights snapped to 8 / 12 / 16 / 20 (2 to 5 storeys of 4 blocks), a lone
// one-cell spike smoothed down to its neighbours. Low wings are red brick with stone bands; the stepped tower is
// white concrete with light-grey bands. Facades are a 1-block wall ring with glass in bays; the interior is air
// with a floor slab per storey and a roof deck, so the glass has an air gap behind it. Some windows are lit (glowstone
// set in the room behind the pane). Ground floor: a shopfront with wide glass and one entrance door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237136.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..28, z 0..33

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // N, S, W, E
const key = (x, z) => `${x},${z}`;

// --- massing: snap the lidar roof to storey lines, smooth lone spikes ------------------------------------------------
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(key(x, z), r);
const snap = (r) => (r <= 8 ? 8 : r <= 12 ? 12 : r <= 16 ? 16 : 20);
const tierRaw = new Map([...roof].map(([k, r]) => [k, snap(r)]));
const tier = new Map();
for (const [k, T] of tierRaw) {
  const [x, z] = k.split(",").map(Number);
  const nb = DIRS.map(([dx, dz]) => tierRaw.get(key(x + dx, z + dz))).filter((v) => v !== undefined);
  const same = nb.filter((v) => v === T).length, max = Math.max(0, ...nb);
  tier.set(k, same <= 1 && max > 0 && max < T ? max : T);
}

// --- per-cell shell: ring (exposed wall) or interior, and which way it faces ----------------------------------------
const info = new Map();
for (const k of tier.keys()) {
  const [x, z] = k.split(",").map(Number), T = tier.get(k);
  let facing = null;
  for (const d of DIRS) if (!tier.has(key(x + d[0], z + d[1])) && !facing) facing = d;          // outside the footprint first
  for (const d of DIRS) {
    const nT = tier.get(key(x + d[0], z + d[1]));
    if (!facing && nT !== undefined && nT < T) facing = d;                                      // then a lower tier (setback face)
  }
  info.set(k, { x, z, T, ring: facing !== null, facing });
}

// --- materials ------------------------------------------------------------------------------------------------------
const GLASS = "light_blue_stained_glass_pane";
const mat = (T) => (T >= 16
  ? { wall: "white_concrete", band: "light_gray_concrete" }      // tower
  : { wall: "bricks", band: "smooth_stone" });                    // low wings

// --- the block plan: key "x,y,z" -> { block, state } ----------------------------------------------------------------
const vox = new Map();
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const glassCells = [];
const lit = [];

for (const c of info.values()) {
  const { x, z, T, ring, facing } = c, m = mat(T);
  for (let y = 0; y < T; y++) {
    if (!ring) {                                                  // interior: air, with slabs and a roof deck
      if (y === 0) put(x, y, z, "stone_bricks");
      else if (y === T - 1) put(x, y, z, "gray_concrete");
      else if (y % 4 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }     // base course / foundation
    if (y === T - 1) { put(x, y, z, "smooth_stone"); continue; } // coping
    if (y % 4 === 0) { put(x, y, z, m.band); continue; }         // storey line
    const s = y - (y % 4), r = y % 4;
    if (r === 3) { put(x, y, z, s === 0 ? "polished_andesite" : m.wall); continue; }   // spandrel / shopfront fascia
    // windows: a pier every third bay upstairs, every fourth on the shopfront
    const ground = s === 0, P = ground ? 4 : 3;
    const onX = facing[0] !== 0;                                   // a face with its normal along x
    const b = onX ? z : x;
    if (b % P === 0) { put(x, y, z, m.wall); continue; }
    glassCells.push({ x, y, z, axisX: !onX });
    put(x, y, z, GLASS);
    // a warm room behind some panes: the inward cell must be interior air
    const ix = x - facing[0], iz = z - facing[1], ik = key(ix, iz);
    if (!ground && info.has(ik) && !info.get(ik).ring && (x * 5 + z * 7 + y) % 9 === 0) lit.push({ x: ix, y, z: iz });
  }
  // roof: a few plant boxes on the low decks and mechanical boxes on the tower, one row above the deck, sparse
  if (!ring && T >= 16 && (x * 3 + z * 5) % 17 === 0) put(x, T, z, "light_gray_concrete");
  else if (!ring && T < 16 && (x * 3 + z * 5) % 23 === 0) put(x, T, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

// the lit rooms are interior air, so their glowstone goes there
for (const l of lit) put(l.x, l.y, l.z, "glowstone");

// the entrance: a door on the north face of the low wing at x 9 (ground floor, z 0)
put(9, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(9, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// --- glass panes connect to the wall along the facade, not out into the air -----------------------------------------
for (const p of glassCells) {
  if (vox.get(`${p.x},${p.y},${p.z}`).block !== GLASS) continue;   // the door cells were windows once
  const at = (dx, dz) => vox.get(`${p.x + dx},${p.y},${p.z + dz}`);
  const a = p.axisX ? [1, 0] : [0, 1];
  const linkA = at(a[0], a[1]), linkB = at(-a[0], -a[1]);
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (p.axisX) { state.east = linkA ? "true" : "false"; state.west = linkB ? "true" : "false"; }
  else { state.south = linkA ? "true" : "false"; state.north = linkB ? "true" : "false"; }
  vox.get(`${p.x},${p.y},${p.z}`).state = state;
}

// --- write -----------------------------------------------------------------------------------------------------------
const g = new Voxels([29, 32, 34]);
for (const [k, { block, state }] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237136.nbt");
console.log("way_332237136:", out, "tiers", [8, 12, 16, 20].map((T) => [...tier.values()].filter((v) => v === T).length));
