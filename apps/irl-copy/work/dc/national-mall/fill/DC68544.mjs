import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC68544";
const W = 16, H = 32, D = 26;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { x, z, gr, rf });

const B = Math.min(...cells.map(c => c[2]));
const isLine = (y) => y >= B && (y - B) % STOREY === 0;
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Distance from exterior: 0 = shell, 1 = air gap, >=2 = solid core.
const dist = new Map();
const queue = [];
for (const c of map.values()) {
  const edge = nbrs(c.x, c.z).some(([nx, nz]) => !map.has(key(nx, nz)));
  if (edge) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [nx, nz] of nbrs(c.x, c.z)) {
    const k = key(nx, nz);
    if (map.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push(map.get(k)); }
  }
}
const D_of = (x, z) => dist.get(key(x, z));

// Lidar roof snapped to storey lines, then median-smoothed over each cell and its
// four neighbours so the tiers form clean flat planes instead of noisy steps.
const T0 = new Map();
for (const c of map.values()) {
  const q = Math.round(c.rf / STOREY) * STOREY;
  T0.set(key(c.x, c.z), Math.max(c.gr + STOREY, q));
}
const top = (c) => {
  const vals = [T0.get(key(c.x, c.z))];
  for (const [nx, nz] of nbrs(c.x, c.z)) {
    const k = key(nx, nz);
    if (T0.has(k)) vals.push(T0.get(k));
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  return Math.min(H - 5, Math.max(c.gr + STOREY, med));
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const doorX = Math.floor(W / 2);
const isLobby = (x, z) => z === 0 && x >= doorX - 3 && x <= doorX + 3;

// Pass 1: foundations, core, air gap, shell with depth detailing.
for (const c of map.values()) {
  const { x, z, gr } = c;
  const d = D_of(x, z);
  const T = top(c);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d >= 2) {
    for (let y = gr; y < T - 1; y++) put(x, y, z, "gray_concrete");
    put(x, T - 1, z, "smooth_stone");
  } else if (d === 1) {
    for (let y = gr; y < T; y++) {
      if (y === T - 1) put(x, y, z, "smooth_stone");
      else if (y === gr || isLine(y)) put(x, y, z, "smooth_quartz");
    }
  } else {
    // Shell: granite base course, spandrels, piers, glass, cornice.
    for (let y = gr; y < T - 1; y++) {
      if (isLine(y) && y === B) {
        put(x, y, z, "polished_granite");           // base course
      } else if (y === gr || isLine(y)) {
        put(x, y, z, "smooth_quartz");               // spandrel
      } else if ((x + z) % 3 === 0) {
        put(x, y, z, "quartz_pillar", { axis: "y" }); // pier
      } else if (isLobby(x, z) && y <= B + 2) {
        put(x, y, z, "tinted_glass");                // lobby glazing
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    }
    // Cornice: slab course one below the parapet, then parapet cap.
    if (T - 2 >= gr) put(x, T - 2, z, "quartz_slab", { type: "top", waterlogged: "false" });
    put(x, T - 1, z, "smooth_quartz");
  }
}

// Pass 2: warm lights behind some shell glass, in the air gap.
for (const c of map.values()) {
  const { x, z, gr } = c;
  if (D_of(x, z) !== 0) continue;
  const T = top(c);
  for (let y = gr; y < T - 2; y++) {
    if (y === gr || isLine(y)) continue;
    if ((x + z) % 3 === 0) continue;
    if (isLobby(x, z)) continue;
    if ((x * 7 + z * 3 + y) % 5 !== 0) continue;
    const inward = nbrs(x, z).find(([nx, nz]) => D_of(nx, nz) === 1);
    if (inward) put(inward[0], y, inward[1], "glowstone");
  }
}

// Pass 3: entrance, centred on the street face (z=0) with a framed door and canopy.
const doorCell = map.get(key(doorX, 0));
if (doorCell && D_of(doorX, 0) === 0) {
  const gr = doorCell.gr;
  // Clear the lobby glazing at the door and frame it in quartz.
  put(doorX, gr, 0, "polished_granite");
  put(doorX, gr + 1, 0, "dark_oak_door",
    { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 2, 0, "dark_oak_door",
    { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    put(doorX + dx, gr + 1, 0, "quartz_pillar", { axis: "y" });
    put(doorX + dx, gr + 2, 0, "quartz_pillar", { axis: "y" });
  }
  // Canopy over the door, on the first floor line, inside the footprint.
  for (let dx = -2; dx <= 2; dx++) {
    const cx = doorX + dx;
    if (map.has(key(cx, 0)) && D_of(cx, 0) === 0) {
      put(cx, gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
  // Warm lobby light just inside the door.
  put(doorX, gr + 2, 1, "glowstone");
}

// Pass 4: single set-back penthouse on the tallest tier, centred on the core.
let maxT = -Infinity;
for (const c of map.values()) maxT = Math.max(maxT, top(c));
const pcx = W / 2, pcz = D / 2;
for (const c of map.values()) {
  if (D_of(c.x, c.z) < 4) continue;
  const T = top(c);
  if (T !== maxT) continue;
  if (Math.abs(c.x - pcx) > 3.5 || Math.abs(c.z - pcz) > 4.5) continue;
  if (T + 3 >= H) continue;
  put(c.x, T, c.z, "light_gray_concrete");
  put(c.x, T + 1, c.z, "light_gray_concrete");
  put(c.x, T + 2, c.z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
