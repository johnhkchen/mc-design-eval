import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE100-0306-22F";
const W = 89, H = 142, D = 73;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const mod = (a, n) => ((a % n) + n) % n;
// [dx, dz, name]: north is -z, south +z, east +x, west -x
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const PANE = "light_blue_stained_glass_pane";
const MULLION = "smooth_quartz";
const SPANDREL = "white_concrete";

// ---- footprint and ground ----
const G = new Map();
for (const [x, z, g] of cells) G.set(key(x, z), g);

// distance (4-neighbour) from the outer edge of the footprint; edge = 1
const dist = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (DIRS.some(([dx, dz]) => !G.has(key(x + dx, z + dz)))) {
    dist.set(key(x, z), 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = dist.get(key(x, z));
    for (const [dx, dz] of DIRS) {
      const k = key(x + dx, z + dz);
      if (G.has(k) && !dist.has(k)) {
        dist.set(k, d + 1);
        next.push([x + dx, z + dz]);
      }
    }
  }
  frontier = next;
}

// ---- massing: podium, setback tier, tower with penthouse ----
const gmax = Math.max(...cells.map(c => c[2]));
const podTop = gmax + 15;
const N = Math.floor((130 - podTop) / 5);
const TALL = podTop + 5 * N;
const MID = podTop + 5 * Math.max(1, Math.round(N * 0.8));

const topOf = (d) => {
  if (d <= 5) return podTop;
  if (d <= 13) return MID;
  if (d >= 18) return TALL + 4;
  return TALL;
};
const T = new Map();
for (const [x, z] of cells) T.set(key(x, z), topOf(dist.get(key(x, z)) ?? 1));

// a wall face at height y is exposed if the neighbour is outside the footprint
// or its column does not reach y
const expo = (x, z, y) => DIRS.some(([dx, dz]) => {
  const k = key(x + dx, z + dz);
  if (!G.has(k)) return true;
  return y >= T.get(k);
});
// a parapet/rim at the top of a column: outside, or neighbour lower
const rimAt = (x, z, tc) => DIRS.some(([dx, dz]) => {
  const k = key(x + dx, z + dz);
  if (!G.has(k)) return true;
  return T.get(k) < tc;
});

// ---- plan ----
const plan = new Map();
const put = (x, y, z, id, props) => plan.set(`${x},${y},${z}`, { x, y, z, id, props });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

function facade(x, y, z, g) {
  const m = mod(x + z, 3) === 0; // mullion column
  if (y >= TALL) {
    // plant penthouse: louvred band
    if (y === TALL) put(x, y, z, SPANDREL);
    else put(x, y, z, mod(x + z, 2) === 0 ? "light_gray_concrete" : "gray_concrete");
    return;
  }
  if (y < g + 5 && y < podTop) {
    // ground storey: stone base, shopfront glass, quartz storey band
    if (y === g) return put(x, y, z, "stone_bricks");
    if (y === g + 4) return put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    return put(x, y, z, m ? MULLION : PANE);
  }
  const r = mod(y - podTop, 5);
  if (r === 0 || r === 4) return put(x, y, z, SPANDREL); // spandrel bands
  return put(x, y, z, m ? MULLION : PANE);
}

for (const [x, z, g] of cells) {
  const tc = T.get(key(x, z));
  for (let y = 0; y < g; y++) put(x, y, z, "stone"); // foundation to ground
  for (let y = g; y < tc; y++) {
    if (y === tc - 1) { put(x, y, z, "light_gray_concrete"); continue; } // roof slab
    if (expo(x, z, y)) { facade(x, y, z, g); continue; }
    if (mod(y - podTop, 5) === 0) put(x, y, z, SPANDREL); // floor slab
  }
  if (rimAt(x, z, tc)) put(x, tc, z, "smooth_stone"); // parapet / rim
}

// ---- entrance: three-bay doorway on the north (-z) street face ----
const cand = cells.filter(([x, z]) => !G.has(key(x, z - 1)));
if (cand.length) {
  const mean = cand.reduce((s, c) => s + c[0], 0) / cand.length;
  const [ex, ez, eg] = cand.reduce((best, c) =>
    Math.abs(c[0] - mean) < Math.abs(best[0] - mean) ? c : best);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  const onFace = (x) => cand.find(([cx, cz]) => cx === x && cz === ez);

  // centre: double-height door with lantern over it
  put(ex, eg + 1, ez, "dark_oak_door", doorProps("lower"));
  put(ex, eg + 2, ez, "dark_oak_door", doorProps("upper"));
  put(ex, eg + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });

  // flanking bays: stone jambs and lit glass vitrines
  for (const dx of [-1, 1]) {
    const side = onFace(ex + dx);
    if (!side) continue;
    const sx = side[0], sg = side[2];
    put(sx, sg + 1, ez, "stone_bricks");
    put(sx, sg + 2, ez, "stone_bricks");
    put(sx, sg + 3, ez, "light_blue_stained_glass");
  }
  // outer bays: lanterns under the quartz band
  for (const dx of [-2, 2]) {
    const side = onFace(ex + dx);
    if (side) put(side[0], side[2] + 3, side[1], "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- plant clutter on the podium terrace ----
for (const [x, z] of cells) {
  if (dist.get(key(x, z)) !== 3) continue;
  if (mod(x * 7 + z * 3, 23) !== 0) continue;
  if (at(x, podTop, z)) continue;
  put(x, podTop, z, "light_gray_concrete");
  put(x, podTop + 1, z, SPANDREL);
}

// ---- pane connections (grid look) ----
for (const p of plan.values()) {
  if (p.id !== PANE) continue;
  const props = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz, name] of DIRS) {
    const q = at(p.x + dx, p.y, p.z + dz);
    if (q && q.id === PANE) props[name] = "true";
  }
  p.props = props;
}

// ---- warm lights behind some glazed bays ----
const lights = [];
for (const p of plan.values()) {
  if (p.id !== PANE) continue;
  if (mod(p.x * 5 + p.z * 3 + p.y * 7, 11) !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const outside = !G.has(key(p.x + dx, p.z + dz)) || T.get(key(p.x + dx, p.z + dz)) <= p.y;
    if (!outside) continue;
    const ix = p.x - dx, iz = p.z - dz;
    const ik = key(ix, iz);
    if (!G.has(ik)) continue;
    const ig = G.get(ik), it = T.get(ik);
    if (p.y < ig || p.y >= it) continue;
    if (at(ix, p.y, iz)) continue;
    lights.push([ix, p.y, iz]);
  }
}
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// ---- write ----
const g = new Voxels([W, H, D]);
for (const p of plan.values()) {
  if (p.x < 0 || p.x >= W || p.y < 0 || p.y >= H || p.z < 0 || p.z >= D) continue;
  if (p.props) g.set(p.x, p.y, p.z, p.id, p.props);
  else g.set(p.x, p.y, p.z, p.id);
}
g.save(`${DIR}/${ID}.nbt`);
