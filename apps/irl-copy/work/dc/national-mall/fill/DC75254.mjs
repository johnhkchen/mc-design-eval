import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC75254";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 39, H = 31, D = 19;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => cellMap.has(`${x},${z}`);

// ---- roof: wide mean over 5x5 to kill lidar noise ---------------------------
function smoothRoof(x, z) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const c = cellMap.get(`${x + dx},${z + dz}`);
      if (c && Number.isFinite(c[3])) { sum += c[3]; n++; }
    }
  return n ? sum / n : null;
}

// first pass: raw target top per cell, snapped to 2-block tiers above its own ground
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  const G = Math.max(0, Math.min(H - 8, Math.round(gr)));
  const R = smoothRoof(x, z);
  let T = R == null ? G + 4 : G + 2 * Math.round((R - G) / 2);
  T = Math.max(G + 4, Math.min(29, T));
  raw.set(`${x},${z}`, T);
}

// second pass: 3x3 mode of tiers so no lone single-cell steps survive
const T_final = new Map();
for (const [x, z] of [...cellMap.keys()].map(k => k.split(",").map(Number))) {
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const t = raw.get(`${x + dx},${z + dz}`);
      if (t != null) counts.set(t, (counts.get(t) || 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
    }
  let best = raw.get(`${x},${z}`), bestN = -1;
  for (const [t, c] of counts) if (c > bestN) { best = t; bestN = c; }
  T_final.set(`${x},${z}`, best);
}

const info = new Map();
let maxT = 0;
for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.min(H - 8, Math.round(gr)));
  const T = Math.max(G + 4, T_final.get(`${x},${z}`));
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const edge = n || s || w || e;
  const corner = (n || s) && (w || e);
  info.set(`${x},${z}`, { x, z, G, T, n, s, w, e, edge, corner });
  if (T > maxT) maxT = T;
}

// ---- materials --------------------------------------------------------------
const WINDOW = "gray_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "stone_bricks";
const CORNICE = "smooth_stone";
const FLOOR = "smooth_stone";
const ROOF = "stone";

// entrance bays on the z=0 face
const DOOR_X = 19;
const ENTRANCE_XS = [18, 19, 20];

// ---- massing and facade -----------------------------------------------------
for (const c of info.values()) {
  const { x, z, G, T, n, s, w, e, edge, corner } = c;

  for (let y = 0; y < G; y++) g.set(x, y, z, BASE);

  for (let y = G; y < T; y++) {
    const rel = y - G;
    const top = y === T - 1;

    if (!edge) {
      if (top) g.set(x, y, z, ROOF);
      else if (rel % 2 === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    const idx = (n || s) ? x : z;
    const pier = corner || idx % 3 === 0 || idx === 0;

    // entrance bay: stone surround, lobby glass, lintel over the door
    if (n && ENTRANCE_XS.includes(x) && z === 0) {
      if (rel === 0) { g.set(x, y, z, BASE); continue; }
      if (rel === 1) { g.set(x, y, z, x === DOOR_X ? "dark_oak_door" : WINDOW,
        x === DOOR_X ? { facing: "north", hinge: "left", open: "false", powered: "false", half: "lower" } : undefined);
        continue; }
      if (rel === 2) { g.set(x, y, z, CORNICE); continue; }
      if (rel === 3 && x === DOOR_X) { g.set(x, y, z, CORNICE); continue; }
    }

    let id;
    if (top) id = CORNICE;
    else if (rel === 0) id = BASE;
    else if (rel % 2 === 0) id = SPANDREL;
    else id = pier ? PIER : WINDOW;

    g.set(x, y, z, id);
  }

  if (edge) g.set(x, T, z, "stone_brick_wall");

  // roof equipment on the top tier only, interior cells
  if (!edge && T === maxT && x % 10 === 5 && z % 6 === 3 && T + 1 <= 30) {
    g.set(x, T, z, SPANDREL);
    g.set(x, T + 1, z, CORNICE);
  }
}

// door upper half and lobby glass above the lower door
for (const x of ENTRANCE_XS) {
  const c = info.get(`${x},0`);
  if (!c || !c.n) continue;
  if (x === DOOR_X) {
    g.set(x, c.G + 1, 0, "dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half: "upper" });
  }
}

// warm lights behind some panes, in the interior air gap
for (const c of info.values()) {
  const { x, z, G, T, n, s, w, e, edge, corner } = c;
  if (!edge || corner) continue;
  const idx = (n || s) ? x : z;
  if (idx % 6 !== 4) continue;
  let ix = x, iz = z;
  if (n) iz = z + 1;
  else if (s) iz = z - 1;
  else if (w) ix = x + 1;
  else if (e) ix = x - 1;
  const inner = info.get(`${ix},${iz}`);
  if (!inner || inner.edge) continue;
  for (let y = G + 3; y < T - 1; y += 2) {
    if ((y - G) % 2 === 1) g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
