import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499465";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 25, D = 18;
const g = new Voxels([W, H, D]);

// ---- footprint, shifted so the lowest ground is y 0 ----
const rawList = cells.map(([x, z, gr, roof]) => ({ x, z, g: gr, r: roof }));
const gmin = Math.min(...rawList.map(c => c.g));
const fp = new Map();
for (const c of rawList) {
  fp.set(`${c.x},${c.z}`, {
    x: c.x, z: c.z,
    g: Math.round(c.g - gmin),
    r: Math.round(c.r - gmin),
  });
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
function inset(x, z) {
  let best = Infinity;
  for (const [dx, dz] of DIRS) {
    let n = 0, cx = x, cz = z;
    while (inFp(cx, cz)) { n++; cx += dx; cz += dz; }
    best = Math.min(best, n - 1);
  }
  return best;
}

// ---- building-wide roof level (smooths lidar noise) ----
const rs = [...fp.values()].map(c => c.r).sort((a, b) => a - b);
const Hmed = Math.min(22, rs[Math.floor(rs.length / 2)]);

// ---- per-cell massing: main block in storeys, lower wings, attic ----
const info = new Map();
for (const c of fp.values()) {
  const { x, z, g: gr, r } = c;
  const outs = outward(x, z);
  const perim = outs.length > 0;
  let body, top;
  if (r < Hmed - 3) {
    // lower wing: one storey or less, flat roof
    body = r - gr >= 5 ? gr + 5 : Math.max(gr + 3, r);
    top = body;
  } else {
    const nStor = Math.max(1, Math.min(3, Math.floor((Hmed - gr - 3) / 5)));
    body = gr + 5 * nStor;
    top = body;
    if (inset(x, z) >= 3 && Hmed - body >= 2) top = Math.min(Hmed, 23);
  }
  body = Math.min(body, 23);
  top = Math.max(Math.min(top, 23), gr + 3);
  info.set(`${x},${z}`, { x, z, g: gr, body, top, perim, outs });
}

// ---- solid massing ----
for (const c of info.values()) {
  const { x, z, g: gr, top, perim } = c;
  for (let y = 0; y < top; y++) {
    g.set(x, y, z, y < gr ? "cobblestone" : "stone_bricks");
  }
  if (!perim) {
    g.set(x, top - 1, z, "deepslate_tiles");
  } else {
    g.set(x, top, z, "stone_brick_wall");          // parapet
    g.set(x, gr, z, "polished_granite");           // plinth
    for (let y = gr + 5; y < c.body; y += 5) {     // storey lines
      g.set(x, y, z, "smooth_stone");
    }
  }
}

// ---- face rhythm: window bays, pilasters, sills and lintels ----
const faceMin = {};
for (const c of info.values()) {
  if (c.outs.length !== 1) continue;
  const [dx, dz] = c.outs[0];
  const key = `${dx},${dz}`;
  const along = dz !== 0 ? c.x : c.z;
  faceMin[key] = Math.min(faceMin[key] ?? Infinity, along);
}

for (const c of info.values()) {
  if (c.outs.length !== 1) continue;
  const [dx, dz] = c.outs[0];
  const key = `${dx},${dz}`;
  const along = dz !== 0 ? c.x : c.z;
  const rel = along - faceMin[key];
  const nStor = Math.floor((c.body - c.g) / 5);
  const ix = c.x - dx, iz = c.z - dz;           // one step inside
  const isWindow = rel % 3 === 1;
  for (let k = 0; k < nStor; k++) {
    const y1 = c.g + 5 * k + 1;                  // window rows y1..y1+2
    if (isWindow) {
      const props = dz !== 0
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      for (let y = y1; y <= y1 + 2; y++) {
        g.set(c.x, y, c.z, "glass_pane", props);
        if (inFp(ix, iz)) g.set(ix, y, iz, "air");
      }
      // sill and lintel in finer stone
      g.set(c.x, y1 + 3, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      if (inFp(ix, iz) && (c.x * 7 + c.z * 3 + k) % 4 === 0) {
        g.set(ix, y1 + 1, iz, "glowstone");
      }
    } else {
      // pilaster cells between windows get a darker, dressed stone
      for (let y = y1; y <= y1 + 3; y++) g.set(c.x, y, c.z, "polished_andesite");
    }
  }
}

// ---- entrance: south face, nearest the centre ----
let door = null;
for (const c of info.values()) {
  if (c.outs.length !== 1) continue;
  if (!(c.outs[0][0] === 0 && c.outs[0][1] === 1)) continue;
  const d = Math.abs(c.x - 12.5);
  if (!door || d < door.d) door = { ...c, d };
}
if (door) {
  const { x, z, g: gr } = door;
  // recessed opening with dressed jambs and a lintel
  for (const dx of [-1, 0, 1]) {
    const nx = x + dx;
    if (!inFp(nx, z)) continue;
    g.set(nx, gr + 3, z, "smooth_stone");
    if (dx !== 0) {
      g.set(nx, gr + 1, z, "polished_andesite");
      g.set(nx, gr + 2, z, "polished_andesite");
    }
  }
  g.set(x, gr + 1, z, "air");
  g.set(x, gr + 2, z, "air");
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
