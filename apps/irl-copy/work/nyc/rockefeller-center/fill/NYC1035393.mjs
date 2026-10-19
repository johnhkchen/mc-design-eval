// 45 East 45th Street, 1924, commercial & office. A limestone-and-brick setback tower on a granite plinth.
// Storey = 3 blocks: row 0 is a spandrel band (floor line), rows 1-2 are a window or a pier. Windows are recessed one
// block behind the facade (a reveal) with a one-block air gap behind the glass; everything else in the footprint is
// solid, so every floor and roof sits on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035393.cells.json`, "utf8"));

const W = 60, D = 56, Y = 83;
const BASE = 2;          // storeys start at y 2; the plinth fills y 0..1 under every cell (lidar ground is 0..2)
const STOREY = 3;
const MAX_N = 23;        // roof 71 -> 23 storeys

// Roof field from the lidar, smoothed by a 5x5 median, then rounded to whole storeys (surface = BASE + 3n + 1).
const roof = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) roof[z][x] = r;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[z][x] !== null;
const median = (x, z, R = 2) => {
  const v = [];
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (inside(x + dx, z + dz)) v.push(roof[z + dz][x + dx]);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const N = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inside(x, z)) N[z][x] = Math.min(MAX_N, Math.max(2, Math.round((median(x, z) - BASE - 1) / STOREY)));
const n = (x, z) => (inside(x, z) ? N[z][x] : 0);
const MAXN = Math.max(...N.flat());

// Classify each storey cell: interior, facade pier, facade window (flat or recessed), recess pieces, entrance.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, k) => DIRS.filter(([dx, dz]) => n(x + dx, z + dz) <= k);
const tag = new Map();
const key = (k, x, z) => `${k},${x},${z}`;
const at = (k, x, z) => tag.get(key(k, x, z));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (let k = 0; k < N[z][x]; k++) {
    const ex = exposed(x, z, k);
    if (!ex.length) tag.set(key(k, x, z), { kind: "int" });
    else if (ex.length > 1) tag.set(key(k, x, z), { kind: "wall" });                       // corner pier
    else {
      const [dx, dz] = ex[0];
      tag.set(key(k, x, z), { kind: (dx ? z : x) % 3 === 0 ? "wall" : "win", dir: [dx, dz] }); // bays: pier, window, window
    }
  }
}
// Recess: a window whose inward cell is interior becomes an air opening; the inward cell carries the glass,
// and the cell behind the glass is the air gap (lit in some bays).
for (let k = 0; k < MAXN; k++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = at(k, x, z);
  if (!t || t.kind !== "win") continue;
  const [dx, dz] = t.dir;
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || n(ix, iz) <= k || at(k, ix, iz).kind !== "int") continue;
  t.kind = "open";
  const pane = at(k, ix, iz); pane.kind = "pane"; pane.dir = t.dir;
  const gx = ix - dx, gz = iz - dz;
  if (inside(gx, gz) && n(gx, gz) > k && at(k, gx, gz).kind === "int")
    tag.set(key(k, gx, gz), { kind: "gap", lit: (x * 5 + z * 3 + k * 7) % 6 === 0 });
}
// Entrance: a recessed portico on the south front (z 54), with a one-cell vestibule behind it.
for (let x = 27; x <= 31; x++) tag.set(key(0, x, 54), { kind: "ent" });
for (let x = 28; x <= 30; x++) tag.set(key(0, x, 53), { kind: "vest" });

const V = new Voxels([W, Y, D]);

// Glass panes connect along the facade they sit in, to neighbouring windows and piers.
const paneState = (k, x, z, dir) => {
  const [dx, dz] = dir;
  const link = (ax, az) => ["win", "pane", "wall"].includes(at(k, x + ax, z + az)?.kind);
  return {
    north: String(dx !== 0 && link(0, -1)), south: String(dx !== 0 && link(0, 1)),
    east: String(dz !== 0 && link(1, 0)), west: String(dz !== 0 && link(-1, 0)), waterlogged: "false",
  };
};

// Plinth: solid from y 0 up to the storeys, under every footprint cell.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) for (let y = 0; y < BASE; y++) V.set(x, y, z, "polished_granite");

// Storeys.
for (const [kk, t] of tag) {
  const [k, x, z] = kk.split(",").map(Number);
  const y0 = BASE + STOREY * k;
  const ground = k === 0;
  const sill = ground ? "polished_granite" : "calcite";
  const pier = ground ? "polished_granite" : "bricks";
  switch (t.kind) {
    case "int":
      for (let dy = 0; dy < 3; dy++) V.set(x, y0 + dy, z, "stone");
      break;
    case "wall":
      V.set(x, y0, z, sill); V.set(x, y0 + 1, z, pier); V.set(x, y0 + 2, z, pier);
      break;
    case "win":
      V.set(x, y0, z, sill);
      for (let dy = 1; dy <= 2; dy++) V.set(x, y0 + dy, z, "glass_pane", paneState(k, x, z, t.dir));
      break;
    case "pane":
      V.set(x, y0, z, "calcite");
      for (let dy = 1; dy <= 2; dy++) V.set(x, y0 + dy, z, "glass_pane", paneState(k, x, z, t.dir));
      break;
    case "open":
      V.set(x, y0, z, sill);
      break;
    case "gap":
      V.set(x, y0, z, "stone");
      if (t.lit) V.set(x, y0 + 1, z, "glowstone");
      break;
    case "vest":
      V.set(x, y0, z, "stone");
      break;
    case "ent":
      V.set(x, y0, z, "polished_granite");
      break;
  }
}

// Roof: a cap per column at the top storey's floor line; calcite cornice and a stone-brick parapet on the edges.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const cap = BASE + STOREY * N[z][x];
  const edge = DIRS.some(([dx, dz]) => n(x + dx, z + dz) < N[z][x]);
  V.set(x, cap, z, edge ? "calcite" : "stone_bricks");
  if (edge) V.set(x, cap + 1, z, "stone_bricks");
}

// Entrance: granite pillars and a dark-oak door in the portico, a lintel above (storey 1's spandrel) and a canopy.
for (let x = 27; x <= 31; x++) for (let y = 3; y <= 4; y++) {
  if (x === 27 || x === 31) V.set(x, y, 54, "polished_granite");
  else if (x === 29) continue;
  else V.set(x, y, 54, "air");
}
V.set(29, 3, 54, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
V.set(29, 4, 54, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 27; x <= 31; x++) V.set(x, 6, 54, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Roof plant: where the top tier is flat, 2x2 stacks of brick with a copper cap (stair-stepped crown).
for (let z0 = 4; z0 < D - 2; z0 += 8) for (let x0 = 4; x0 < W - 2; x0 += 8) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 2; z++) for (let x = x0 - 1; x <= x0 + 2; x++) if (!(inside(x, z) && N[z][x] >= MAXN - 1)) ok = false;
  if (!ok) continue;
  for (let z = z0; z <= z0 + 1; z++) for (let x = x0; x <= x0 + 1; x++) {
    const cap = BASE + STOREY * N[z][x];
    V.set(x, cap + 1, z, "bricks"); V.set(x, cap + 2, z, "bricks"); V.set(x, cap + 3, z, "copper_block");
  }
}

// Checks: storey histogram, and blocks with air directly below and nothing beside them at the same height.
const hist = {};
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) hist[N[z][x]] = (hist[N[z][x]] || 0) + 1;
let floating = 0, top = 0;
for (let y = 1; y < Y; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!V.get(x, y, z)) continue;
  top = Math.max(top, y);
  if (V.get(x, y - 1, z)) continue;
  if (DIRS.some(([dx, dz]) => V.get(x + dx, y, z + dz))) continue;
  floating++;
}
console.log("storeys", JSON.stringify(hist), "max storeys", MAXN, "top y", top, "blocks", V.count(), "floating", floating);
console.log(V.save(`${DIR}/NYC1035393.nbt`));
