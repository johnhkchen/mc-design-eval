// Campbell House: a 1980s concrete-frame office tower. The lidar's roof runs 4 to 124 blocks above the lowest ground
// (about 104 m), so it reads as a ~28-storey tower on a two-storey podium with tinted glass set in white concrete piers,
// a shopfront base, a lobby recess under a canopy, a parapet cornice, and a plant penthouse with a mast on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_335302055.cells.json", "utf8"));
const g = new Voxels([48, 137, 80]);

const key = (x, z) => x + "," + z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const LV = [12, 24, 48, 84, 124];                  // setback tier tops (multiples of 4, so they sit on every storey line)

// one record per footprint cell: ground g, base of the building Bc (the ground floor line, a multiple of 4), lidar roof
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(key(x, z), { x, z, g: ground, roof, Bc: Math.ceil(ground / 4) * 4 });
const near = (x, z, r) => { const out = []; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const c = C.get(key(x + dx, z + dz)); if (c) out.push(c); } return out; };

// smooth the lidar: median roof over a 7x7 window (no 1-2 cell slivers), tiered, then a majority pass so the tiers are flat
for (const c of C.values()) {
  const v = near(c.x, c.z, 3).map(n => n.roof).sort((a, b) => a - b);
  const s = v[v.length >> 1];
  c.lvl = LV.findIndex(t => s <= t); if (c.lvl < 0) c.lvl = LV.length - 1;
}
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of C.values()) {
    const n = near(c.x, c.z, 1), cnt = new Array(LV.length).fill(0);
    for (const m of n) cnt[m.lvl]++;
    const best = Math.max(...cnt);
    next.set(key(c.x, c.z), cnt[c.lvl] === best ? c.lvl : cnt.indexOf(best));
  }
  for (const c of C.values()) c.lvl = next.get(key(c.x, c.z));
}
// T: the tier's top (the roof deck sits on y = T); at least two storeys above the ground floor line
for (const c of C.values()) c.T = Math.max(LV[c.lvl], c.Bc + 8);

// the faces a column exposes at height y: a side with no footprint cell, or a neighbour whose column stops below y
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = C.get(key(c.x + dx, c.z + dz)); return !n || y >= n.T; });

// lobby: the longest run of ground-floor walls on one face, same ground line, 3 cells wide, middle one is the door
const runs = new Map();
for (const c of C.values()) {
  if (c.T < c.Bc + 8) continue;
  const ex = exposed(c, c.Bc + 1);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0];
  const gk = `${dx},${dz}|${dx !== 0 ? c.x : c.z}|${c.Bc}`;
  if (!runs.has(gk)) runs.set(gk, []);
  runs.get(gk).push(c);
}
let entrance = null;
for (const [gk, list] of runs) {
  list.sort((a, b) => (gk.split("|")[0].startsWith("0") ? a.x - b.x : a.z - b.z));
  const along = c => (gk.split("|")[0].startsWith("0") ? c.x : c.z);
  let run = [];
  for (const c of list) {
    if (run.length && along(c) !== along(run[run.length - 1]) + 1) run = [];
    run.push(c);
    if (run.length >= 3 && (!entrance || run.length > entrance.run.length)) entrance = { run: [...run], dir: ex0(list[0]), gk };
  }
}
function ex0(c) { return exposed(c, c.Bc + 1)[0]; }
let recess = new Set(), doorKey = null, doorDir = null;
if (entrance) {
  const mid = entrance.run[entrance.run.length >> 1];
  doorDir = entrance.dir;
  const alongDoor = entrance.run.indexOf(mid);
  const three = entrance.run.slice(alongDoor - 1, alongDoor + 2);
  for (const c of three) recess.add(key(c.x, c.z));
  doorKey = key(mid.x, mid.z);
}

// a 3-block bay on every wall: a white concrete pier, then two tinted panes (the lobby sides are glass too)
const pane = ex => {
  const along = ex[0][0] !== 0;                       // a wall running along z connects north and south
  return { block: "cyan_stained_glass_pane", state: { east: String(!along), west: String(!along), north: String(along), south: String(along), waterlogged: "false" } };
};
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const lights = [];

for (const c of C.values()) {
  const { x, z } = c;
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone");                   // the foundation under the ground
  for (let y = c.g; y < c.Bc; y++) put(x, y, z, "polished_andesite");     // the base course up to the ground floor line
  const isRecess = recess.has(key(x, z));
  for (let y = c.Bc; y < c.T; y++) {
    const k = (y - c.Bc) >> 2, o = (y - c.Bc) & 3;
    const ex = exposed(c, y);
    if (o === 0) {                                     // a floor slab (interior) or the spandrel / base band (face)
      if (!ex.length) put(x, y, z, "white_concrete");
      else put(x, y, z, k === 0 ? "polished_andesite" : "light_gray_concrete");
    } else if (o === 3) {                              // the storey's top band: fascia / spandrel, or the lobby canopy
      if (!ex.length) continue;
      if (isRecess && k === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, k === 0 ? "gray_concrete" : "light_gray_concrete");
    } else if (ex.length) {                            // the glazed band: door, panes, or a corner pier
      if (ex.length > 1) { put(x, y, z, "white_concrete"); continue; }
      if (isRecess && k === 0 && key(x, z) === doorKey) {
        const state = { facing: FACING[doorDir.join(",")], hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "iron_door", { ...state, half: o === 1 ? "lower" : "upper" });
        continue;
      }
      const u = ex[0][0] !== 0 ? z : x;
      if (!isRecess && u % 3 === 0) put(x, y, z, "white_concrete");
      else { const p = pane(ex); put(x, y, z, p.block, p.state); }
      if (o <= 2 && !isRecess) lights.push([c, y, ex[0]]);
    }
  }
  // the roof deck at T: a cornice slab on the face, stone inside
  const capEx = exposed(c, c.T);
  if (capEx.length) put(x, c.T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  else put(x, c.T, z, "stone");
}

// warm light: about one window in eight has a glowstone just inside the glass (in the air gap)
for (const [c, y, [dx, dz]] of lights) {
  const h = (c.x * 374761 + y * 668265 + c.z * 2654435) >>> 0;
  if (h % 8) continue;
  const inner = C.get(key(c.x - dx, c.z - dz));
  if (!inner || exposed(inner, y).length) continue;
  put(inner.x, y, inner.z, "glowstone");
}

// the penthouse: the top-tier cells whose 3x3 neighbourhood is all top tier, three blocks high, a deck above
const top = Math.max(...[...C.values()].map(c => c.T));
let plant = [];
for (const c of C.values()) {
  if (c.T !== top) continue;
  if (near(c.x, c.z, 1).length === 9 && near(c.x, c.z, 1).every(n => n.T === top)) plant.push(c);
}
for (const c of plant) for (let y = top + 1; y <= top + 3; y++) put(c.x, y, c.z, "light_gray_concrete");
for (const c of plant) put(c.x, top + 4, c.z, "stone");
if (plant.length) {
  const cx = plant.reduce((s, c) => s + c.x, 0) / plant.length, cz = plant.reduce((s, c) => s + c.z, 0) / plant.length;
  const mast = plant.reduce((b, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(b.x - cx, b.z - cz) ? c : b));
  for (let y = top + 5; y <= top + 10; y++) put(mast.x, y, mast.z, "lightning_rod", { facing: "up", powered: "false" });
}

// roof plant on the lower tiers: a few air-handling units on the decks
for (const c of C.values()) {
  if (c.T >= top || c.T < 24) continue;
  if ((c.x * 7 + c.z * 3) % 13 !== 0 || exposed(c, c.T).length) continue;
  put(c.x, c.T + 1, c.z, "iron_block");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_335302055.nbt");
console.log(`way_335302055: ${info.blocks} blocks, ${info.palette} palette entries; top ${top}, plant cells ${plant.length}, lobby ${doorKey ?? "none"}`);
