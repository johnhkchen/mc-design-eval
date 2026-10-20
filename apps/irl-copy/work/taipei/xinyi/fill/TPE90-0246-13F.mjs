import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 新寶信義大樓 (Xinbao Xinyi Building), 2001: 13-storey glass-curtain office block.
// Pale spandrels, light-grey piers, blue-tinted glazing, a wide glazed lobby on the
// -z face with doors, a dark roof deck and a central plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0246-13F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 76, D = 70;
const g = new Voxels([W, H, D]);

const STOREY = 5;
const ROOF = 64;
const PENT_TOP = 67;

// ---- footprint lookup ----
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const v = Math.round(gr);
  ground.set(`${x},${z}`, v);
  if (v < minG) minG = v;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => (ground.get(`${x},${z}`) ?? 0) - minG;

function exposure(x, z) {
  return {
    xm: !has(x - 1, z),
    xp: !has(x + 1, z),
    zm: !has(x, z - 1),
    zp: !has(x, z + 1),
  };
}

const perimeterSet = new Set();
for (const [x, z] of cells) {
  const e = exposure(x, z);
  if (e.xm || e.xp || e.zm || e.zp) perimeterSet.add(`${x},${z}`);
}
const isPerim = (x, z) => perimeterSet.has(`${x},${z}`);

// Lobby: the -z face cells in the middle of the frontage, not corners.
const LOBBY_X0 = 9, LOBBY_X1 = 18;
const isLobby = (x, z) => {
  if (!isPerim(x, z)) return false;
  const e = exposure(x, z);
  return e.zm && !e.xm && !e.xp && !e.zp && x >= LOBBY_X0 && x <= LOBBY_X1;
};
const isDoor = (x) => x === 13 || x === 14;

// ---- pass 1: foundations, floors, facade, roof deck ----
for (const [x, z] of cells) {
  const base = baseOf(x, z);
  const e = exposure(x, z);
  const perim = isPerim(x, z);
  const exX = e.xm || e.xp;
  const exZ = e.zm || e.zp;
  const corner = exX && exZ;

  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  for (let y = base; y <= ROOF; y++) {
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (!perim) {
      if (r === 0 && y > 0) g.set(x, y, z, "white_concrete");   // floor slab
      if (y === ROOF) g.set(x, y, z, "gray_concrete");          // roof deck
      continue;
    }

    const i = exX && !exZ ? z : exZ && !exX ? x : x + z;

    if (y === ROOF) {
      g.set(x, y, z, "white_concrete");                          // cornice
      continue;
    }

    if (r === 0) {
      g.set(x, y, z, k === 0 ? "polished_granite" : "white_concrete");
      continue;
    }

    if (r === 4) {
      g.set(x, y, z, "light_gray_concrete");                     // head frame
      continue;
    }

    // window band rows 1..3
    if (corner) {
      g.set(x, y, z, "light_gray_concrete");                     // corner pier
      continue;
    }

    if (k === 0 && isLobby(x, z)) {
      // lobby glazing: doors in the centre, dark frame above
      if (isDoor(x)) {
        // handled below
        g.set(x, y, z, "light_blue_stained_glass");
      } else {
        g.set(x, y, z, i % 2 === 0 ? "light_blue_stained_glass" : "light_gray_concrete");
      }
      continue;
    }

    if (k === 0) {
      g.set(x, y, z, i % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    } else {
      g.set(x, y, z, i % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    }
  }
}

// ---- pass 2: entrance doors and lobby head ----
for (const [x, z] of cells) {
  if (!isLobby(x, z) || !isDoor(x)) continue;
  g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 3, z, "black_concrete");
  g.set(x, 4, z, "black_concrete");
}
// dark lintel band across the lobby head
for (const [x, z] of cells) {
  if (!isLobby(x, z)) continue;
  g.set(x, 4, z, "black_concrete");
}

// ---- pass 3: warm lights behind some windows (air gap, inward cell) ----
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const base = baseOf(x, z);
  const e = exposure(x, z);
  const exX = e.xm || e.xp;
  const exZ = e.zm || e.zp;
  if (exX && exZ) continue;
  if (isLobby(x, z)) continue;
  const dx = e.xm && !e.xp ? 1 : e.xp && !e.xm ? -1 : 0;
  const dz = e.zm && !e.zp ? 1 : e.zp && !e.zm ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const i = exX && !exZ ? z : x + z;
  for (let k = 1; k <= 12; k++) {
    const y = k * STOREY + 2;
    if (y < base || y > ROOF) continue;
    if ((i + k) % 5 === 0 && k % 2 === 1) {
      const ib = baseOf(ix, iz);
      if (y >= ib) g.set(ix, y, iz, "glowstone");
    }
  }
}

// ---- pass 4: roof plant penthouse centred on the roof ----
for (let x = 9; x <= 18; x++) {
  for (let z = 24; z <= 45; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const ring = x === 9 || x === 18 || z === 24 || z === 45;
    for (let y = ROOF + 1; y <= PENT_TOP; y++) {
      if (y === PENT_TOP) g.set(x, y, z, "gray_concrete");
      else if (ring) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
