import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 28, H = 32, D = 28;

// National Savings and Trust Company (1445 New York Ave NW): a 1920s Classical
// bank/office block in pale limestone. Rusticated plinth, pilaster bays, bands at
// every storey, a heavy cornice and parapet. Tall ground-floor windows and a
// framed central entrance on the New York Avenue (north) face.

const raw = JSON.parse(readFileSync(`${DIR}/DC87223.cells.json`, "utf8"));
const arr = raw.map(c => [c[0], c[1], Math.round(c[2]), Math.round(c[3])]);
const base = Math.min(...arr.map(c => c[2]));

// ---- roof: quantise to storey tiers (4 blocks) then mode-smooth over 3x3 ----
const tierOf = new Map();
for (const [x, z, g0, r0] of arr) {
  const r = r0 - base;
  tierOf.set(`${x},${z}`, Math.max(8, Math.round(r / 4) * 4));
}
const smoothed = new Map();
for (const [k, own] of tierOf) {
  const [x, z] = k.split(",").map(Number);
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = tierOf.get(`${x + dx},${z + dz}`);
    if (v !== undefined) counts.set(v, (counts.get(v) || 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
  }
  let best = own, bc = -1;
  for (const [v, cnt] of counts) if (cnt > bc) { bc = cnt; best = v; }
  smoothed.set(k, best);
}

const cells = new Map();
for (const [x, z, g0] of arr) {
  const g = g0 - base;
  const r = Math.min(H - 4, smoothed.get(`${x},${z}`));
  cells.set(`${x},${z}`, { x, z, g, r: Math.max(r, g + 4) });
}
const has = (x, z) => cells.has(`${x},${z}`);
const zmin = Math.min(...[...cells.values()].map(c => c.z));
const xs = [...cells.values()].map(c => c.x);
const xmin = Math.min(...xs), xmax = Math.max(...xs);

const M = new Map();
const put = (x, y, z, id, p) => M.set(`${x},${y},${z}`, [id, p]);

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const info = new Map();

for (const c of cells.values()) {
  const { x, z, g, r } = c;
  const Wm = !has(x - 1, z), Em = !has(x + 1, z), Nm = !has(x, z - 1), Sm = !has(x, z + 1);
  const perim = Wm || Em || Nm || Sm;
  const corner = (Wm || Em) && (Nm || Sm);
  let face, t, normal;
  if (Nm || Sm) { face = Nm ? "N" : "S"; t = x; normal = Nm ? [0, -1] : [0, 1]; }
  else { face = Wm ? "W" : "E"; t = z; normal = Wm ? [-1, 0] : [1, 0]; }
  // pilasters every 4 bays, plus corners; pilaster rhythm recessed visually by pale vs. calcite
  const pill = corner || t % 4 === 0;
  const win = perim && !pill;
  info.set(`${x},${z}`, { perim, face, t, normal, win, g, r, corner });

  // foundation / rusticated plinth
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  for (let y = g; y < r; y++) {
    if (!perim) {
      put(x, y, z, y === r - 1 ? "smooth_stone" : "smooth_quartz");
      continue;
    }
    const m = y % 4;
    let id, p;
    if (y >= r - 2) {
      id = pill ? "quartz_pillar" : "smooth_quartz";      // heavy cornice band
    } else if (y < 4) {
      if (pill) id = "quartz_pillar";
      else if (win && y >= 1) { id = "glass_pane"; p = (face === "N" || face === "S") ? GLASS_NS : GLASS_EW; }
      else id = "stone_bricks";
    } else if (m === 0) {
      id = "smooth_quartz";                               // storey band
    } else if (m === 3) {
      id = pill ? "quartz_pillar" : "calcite";            // spandrel
    } else {
      if (win) { id = "glass_pane"; p = (face === "N" || face === "S") ? GLASS_NS : GLASS_EW; }
      else id = pill ? "quartz_pillar" : "calcite";
    }
    put(x, y, z, id, p);
  }

  // parapet: alternating posts and low walls on perimeter
  if (perim) {
    if (pill) put(x, r, z, "quartz_pillar");
    else put(x, r, z, "stone_brick_wall");
  }
}

// Entrance on the north (New York Ave) face: framed doorway, lintel and canopy-like pilasters
for (const c of cells.values()) {
  const i = info.get(`${c.x},${c.z}`);
  if (!i.perim || i.face !== "N" || c.z !== zmin || c.x < 10 || c.x > 17) continue;
  const g = c.g;
  if (c.x >= 12 && c.x <= 15) {
    put(c.x, g, c.z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(c.x, g + 1, c.z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(c.x, g + 2, c.z, "smooth_quartz");
    put(c.x, g + 3, c.z, "quartz_slab", { type: "top", waterlogged: "false" });
  } else {
    // flanking pilaster pair with a lintel course
    put(c.x, g, c.z, "quartz_pillar");
    put(c.x, g + 1, c.z, "quartz_pillar");
    put(c.x, g + 2, c.z, "quartz_pillar");
    put(c.x, g + 3, c.z, "smooth_quartz");
  }
}

// Air gap behind each window, with warm light in some bays
for (const c of cells.values()) {
  const i = info.get(`${c.x},${c.z}`);
  if (!i.win) continue;
  const ix = c.x - i.normal[0], iz = c.z - i.normal[1];
  const inner = cells.get(`${ix},${iz}`);
  if (!inner) continue;
  const ii = info.get(`${ix},${iz}`);
  if (ii && ii.perim) continue;
  for (let y = Math.max(1, c.g); y < c.r - 2; y++) {
    const m = y % 4;
    if (m !== 1 && m !== 2) continue;
    if (y < inner.g) continue;
    put(ix, y, iz, "air");
  }
  if (i.t % 8 === 2) {
    for (let y = Math.max(1, c.g); y < c.r - 2; y += 4) {
      if (y + 1 >= inner.g && y + 1 < c.r - 2) put(ix, y + 1, iz, "shroomlight");
    }
  }
}

const g = new Voxels([W, H, D]);
for (const [k, [id, p]] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}
g.save(`${DIR}/DC87223.nbt`);
