// The White House Entertainment Centre: a 1930s stripped-classical commercial block in white rendered concrete on a dark
// stone plinth. Its massing follows the lidar roof, smoothed and snapped to three tiers (20, 24 and 28 blocks above the
// lowest ground), with each tier stepping in one cell from the footprint edge. Gridded windows (3-wide bays, pier + two
// glass), smooth storey bands, a cornice and parapet, a shopfront ground floor with a door, and warm lights behind some
// windows. Interiors are air; each storey has a floor slab that rests on the walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020931.cells.json`, "utf8"));
const [W, H, D] = [37, 40, 24];

const key = (x, z) => `${x},${z}`;
const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(key(x, z), { x, z, g, r });
const at = (x, z) => plan.get(key(x, z));
// [face, dx, dz]: north is -z, as in Minecraft
const NEIGH = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const VEC = Object.fromEntries(NEIGH.map(([f, dx, dz]) => [f, [dx, dz]]));
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

// 1. smooth the lidar roof: two passes of a mean over each cell and its footprint neighbours
function smooth(get) {
  const out = new Map();
  for (const c of plan.values()) {
    let s = get(c), n = 1;
    for (const [, dx, dz] of NEIGH) { const o = at(c.x + dx, c.z + dz); if (o) { s += get(o); n++; } }
    out.set(key(c.x, c.z), s / n);
  }
  return out;
}
const s1 = smooth((c) => c.r);
const s2 = smooth((c) => s1.get(key(c.x, c.z)));

// 2. tiers: the smoothed roof snapped to 20 / 24 / 28; cells on the footprint edge stay at 24 or below (setback)
const dist = new Map();
{
  let frontier = [];
  for (const c of plan.values()) if (NEIGH.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
  for (let d = 2; frontier.length; d++) {
    const next = [];
    for (const c of frontier) for (const [, dx, dz] of NEIGH) {
      const o = at(c.x + dx, c.z + dz);
      if (o && !dist.has(key(o.x, o.z))) { dist.set(key(o.x, o.z), d); next.push(o); }
    }
    frontier = next;
  }
}
const snap = (s) => (s >= 24.5 ? 28 : s >= 22.5 ? 24 : 20);
for (const c of plan.values()) {
  const edge1 = dist.get(key(c.x, c.z)) === 1;
  c.t = Math.min(snap(s2.get(key(c.x, c.z))), edge1 ? 24 : 28);
  c.outer = NEIGH.some(([, dx, dz]) => !at(c.x + dx, c.z + dz));
  // the face a wall looks out of: the open side first, else the side that drops to a lower tier
  const open = NEIGH.find(([, dx, dz]) => !at(c.x + dx, c.z + dz));
  const lower = NEIGH.find(([, dx, dz]) => { const o = at(c.x + dx, c.z + dz); return o && o.t < c.t; });
  c.face = (open ?? lower ?? [null])[0];
  c.edge = c.outer || !!lower;
}
const tierCount = {};
for (const c of plan.values()) tierCount[c.t] = (tierCount[c.t] ?? 0) + 1;
console.log("tiers (cells per top):", tierCount, "cells:", plan.size);

// storey floors: the ground itself, then every 4 blocks above it, up to the tier top
const floorsOf = (c) => {
  const f = [c.g];
  for (let k = (Math.floor(c.g / 4) + 1) * 4; k < c.t; k += 4) f.push(k);
  return f;
};

const V = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);

// 3. columns: foundation, floors, walls with the facade grammar, cornice, parapet
const doorCandidates = [];
for (const c of plan.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  const fl = floorsOf(c);
  for (let y = c.g; y < c.t; y++) {
    const isFloor = fl.includes(y), top = y === c.t - 1;
    if (!c.edge) {
      if (isFloor) put(c.x, y, c.z, "smooth_stone");
      else if (top) put(c.x, y, c.z, "stone");
      continue;
    }
    if (y === c.g) { put(c.x, y, c.z, "polished_andesite"); continue; }
    if (isFloor || top) { put(c.x, y, c.z, "smooth_quartz"); continue; }   // storey band, cornice
    const fb = Math.max(...fl.filter((f) => f <= y));
    const next = fl.find((f) => f > y) ?? c.t;
    const lev = y - fb, len = next - fb;
    if (lev === len - 1) { put(c.x, y, c.z, "smooth_quartz"); continue; }  // lintel band above the glass
    const along = c.face === "north" || c.face === "south";
    const u = along ? c.x : c.z;
    if (((u % 3) + 3) % 3 === 0) { put(c.x, y, c.z, fb === c.g ? "polished_andesite" : "white_concrete"); continue; }  // pier
    put(c.x, y, c.z, "gray_stained_glass");
    // warm light in the room behind some panes: the cell one step inside, air until now
    const [dx, dz] = VEC[c.face];
    const inner = at(c.x - dx, c.z - dz);
    if (inner && !inner.edge && y >= inner.g && y < inner.t && !floorsOf(inner).includes(y) &&
        (c.x * 31 + c.z * 17 + y * 7) % 9 === 0) {
      put(inner.x, y, inner.z, (c.x + c.z + y) % 2 ? "glowstone" : "shroomlight");
    }
  }
  if (c.outer) put(c.x, c.t, c.z, "white_concrete");   // parapet on the open edge
  // entrance candidates: a glass bay in the ground storey on the south-facing edge
  if (c.outer && c.face === "south" && ((c.x % 3) + 3) % 3 !== 0 && (fl[1] ?? c.t) - c.g >= 4) doorCandidates.push(c);
}

// 4. entrance: double door in the glass bay nearest the middle of the south face, lintel canopy over the bay
if (doorCandidates.length) {
  const door = doorCandidates.reduce((a, b) => (Math.abs(b.x - 18) < Math.abs(a.x - 18) ? b : a));
  const facing = OPPOSITE[door.face];
  put(door.x, door.g + 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const c = at(door.x + dx, door.z);
    if (c && c.edge) put(c.x, door.g + 3, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 5. roof plant: a 2x2 box on the tower and one on a lower wing, each on its roof deck
function roofBox(tier, height, mat) {
  const pool = [...plan.values()].filter((c) => c.t === tier && dist.get(key(c.x, c.z)) >= 2);
  const inPool = new Set(pool.map((c) => key(c.x, c.z)));
  const sites = pool.filter((c) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => inPool.has(key(c.x + a, c.z + b))));
  if (!sites.length) return;
  const mx = pool.reduce((s, c) => s + c.x, 0) / pool.length, mz = pool.reduce((s, c) => s + c.z, 0) / pool.length;
  const pick = sites.reduce((a, b) => (Math.hypot(b.x - mx, b.z - mz) < Math.hypot(a.x - mx, a.z - mz) ? b : a));
  for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let h = 0; h < height; h++) put(pick.x + a, tier + h, pick.z + b, mat);
}
roofBox(28, 2, "light_gray_concrete");
roofBox(20, 2, "white_concrete");

// 6. check: every block above ground rests on something below or beside it (no floating courses)
let loose = 0;
for (let z = 0; z < D; z++) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
  if (!V.val(x, y, z)) continue;
  const below = V.val(x, y - 1, z);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => V.val(x + dx, y, z + dz));
  if (!below && !beside) loose++;
}
const top = Math.max(...cells.map(([, , , r]) => r));
console.log("loose blocks:", loose, "| tallest roof block:", top, "| top of build:", Math.max(...[...plan.values()].map((c) => c.t + 2)));
const info = V.save(`${DIR}/way_293020931.nbt`);
console.log("saved", info);
