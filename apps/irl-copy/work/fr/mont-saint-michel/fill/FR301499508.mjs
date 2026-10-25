import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499508";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 19, D = 8;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { g: gr, r: rf });
const inside = (x, z) => cellMap.has(key(x, z));

// ---- massing ----------------------------------------------------------------
const gs = cells.map(c => c[2]);
const rs = cells.map(c => c[3]);
const G0 = Math.min(...gs);
const sortedR = [...rs].sort((a, b) => a - b);
let R = sortedR[Math.floor(sortedR.length / 2)];
R = Math.max(R, Math.max(...gs) + 4);
R = Math.min(R, H - 2);

const lines = [];
for (let L = G0; L < R - 3; L += 5) lines.push(L);

// ---- materials ---------------------------------------------------------------
const FOUND = "stone_bricks";          // plinth
const BASE_COURSE = "stone_bricks";    // darker base course
const WALL = "smooth_stone";           // dressed render/stone infill
const QUOIN = "stone_bricks";          // corner piers
const STRING = { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } };
const PARAPET = "stone_bricks";
const SLATE = "deepslate_tiles";
const PANE = "glass_pane";

// ---- faces ----------------------------------------------------------------------
const dirs = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const faces = [];
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const [d, [dx, dz]] of Object.entries(dirs)) {
    if (!inside(x + dx, z + dz)) faces.push({ x, z, d, dx, dz, u: (d === "n" || d === "s") ? x : z });
  }
}
const groups = new Map();
for (const f of faces) {
  const gk = `${f.d}:${(f.d === "n" || f.d === "s") ? f.z : f.x}`;
  if (!groups.has(gk)) groups.set(gk, []);
  groups.get(gk).push(f);
}
for (const list of groups.values()) {
  list.sort((a, b) => a.u - b.u);
  list.forEach((f, i) => { f.idx = i; f.len = list.length; });
}

// Street (front) face = south face, entrance at its centre.
const sFaces = faces.filter(f => f.d === "s").sort((a, b) => a.u - b.u);
const doorU = sFaces.length ? sFaces[Math.floor(sFaces.length / 2)].u : -1;

const perimSet = new Set(faces.map(f => key(f.x, f.z)));
const cornerSet = new Set();
for (const k of perimSet) {
  const [x, z] = k.split(",").map(Number);
  const nExt = Object.values(dirs).filter(([dx, dz]) => !inside(x + dx, z + dz)).length;
  if (nExt >= 2) cornerSet.add(k);
}

// ---- 1. massing: plinth, base course, walls, string course, parapet, slate deck --
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const gc = c.g;
  const perim = perimSet.has(k);
  const corner = cornerSet.has(k);
  for (let y = 0; y < gc; y++) g.set(x, y, z, FOUND);
  for (let y = gc; y <= R - 3; y++) {
    let mat = WALL;
    if (perim && y === gc) mat = BASE_COURSE;
    if (perim && corner) mat = QUOIN;
    g.set(x, y, z, mat);
  }
  if (perim) {
    // string course above the ground-storey lintel band
    const sc = G0 + 5;
    if (sc <= R - 3 && sc > gc) g.set(x, sc - 1, z, STRING.id, STRING.props);
    g.set(x, R - 2, z, STRING.id, STRING.props);
    g.set(x, R - 1, z, PARAPET);
  } else {
    g.set(x, R - 2, z, WALL);
    g.set(x, R - 1, z, SLATE);
  }
}

// Chimney on an inner cell, standing on the slate deck.
const innerCells = [...cellMap.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => !perimSet.has(key(x, z)));
if (innerCells.length && R + 2 < H) {
  const [cx, cz] = innerCells[Math.floor(innerCells.length / 2)];
  g.set(cx, R, cz, "bricks");
  g.set(cx, R + 1, cz, "bricks");
}

// ---- 2. openings -------------------------------------------------------------------
const windowProps = (d) => (d === "n" || d === "s")
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const f of faces) {
  const c = cellMap.get(key(f.x, f.z));
  const gc = c.g;
  const ix = f.x - f.dx, iz = f.z - f.dz;
  const innerOk = inside(ix, iz);
  const isPier = f.idx === 0 || f.idx === f.len - 1 || cornerSet.has(key(f.x, f.z));

  // Entrance: door in the middle of the street face.
  if (f.d === "s" && f.u === doorU) {
    const yb = gc + 1;
    if (yb + 1 <= R - 3) {
      g.set(f.x, yb, f.z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(f.x, yb + 1, f.z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      if (innerOk) { g.set(ix, yb, iz, "air"); g.set(ix, yb + 1, iz, "air"); }
      // Door surround: a pale lintel row above it is the wall already; add stone-brick jambs.
    }
    continue;
  }

  for (const L of lines) {
    const rowLo = Math.max(L + 1, gc + 1);
    const rowHi = Math.min(L + 3, R - 3);
    if (rowHi < rowLo) continue;

    const ground = L === G0;
    const glaze = ground ? (!isPier) : (!isPier && f.idx % 2 === 1);
    if (glaze) {
      const lit = ((f.idx + L) % 3 === 0);
      for (let y = rowLo; y <= rowHi; y++) {
        g.set(f.x, y, f.z, PANE, windowProps(f.d));
        if (innerOk) g.set(ix, y, iz, lit ? "glowstone" : "air");
      }
    } else if (ground && f.d === "s" && !isPier && Math.abs(f.u - doorU) === 1) {
      // Hanging lanterns flanking the door, below the lintel.
      const ly = rowHi;
      if (ly >= rowLo) {
        g.set(f.x, ly, f.z, "lantern", { hanging: "true", waterlogged: "false" });
        if (innerOk) g.set(ix, ly, iz, "air");
      }
    }
  }
}

// ---- 3. save -----------------------------------------------------------------------
g.save(`${DIR}/${ID}.nbt`);
