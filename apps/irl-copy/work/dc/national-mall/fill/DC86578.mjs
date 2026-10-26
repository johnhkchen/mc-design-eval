import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 875 15th St NW, Washington DC. Commercial-Office-Large, c. 1960s-70s Modernist office:
// a stone base course, a stacked grid of glazing between pale concrete spandrels and
// piers, a cornice, and a recessed lobby with a canopy.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86578";
const W = 19, D = 20, H = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const row of cells) {
  const x = Number(row[0]), z = Number(row[1]);
  cellMap.set(key(x, z), { x, z, gr: Math.round(Number(row[2])), rf: Math.round(Number(row[3])) });
}
const has = (x, z) => cellMap.has(key(x, z));
const get = (x, z) => cellMap.get(key(x, z));

const all = [...cellMap.values()];
const G0 = Math.min(...all.map(c => c.gr));
const rfs = all.map(c => c.rf).sort((a, b) => a - b);
const p90 = rfs[Math.min(rfs.length - 1, Math.floor(rfs.length * 0.9))];
const T = Math.min(29, p90);

// Flat tiers: cells near the main roof take it; lower wings step in 2-block tiers.
for (const c of all) {
  let t = c.rf >= T - 2 ? T : G0 + 2 * Math.round((c.rf - G0) / 2);
  t = Math.min(t, T);
  t = Math.max(t, c.gr + 2);
  c.top = Math.min(t, 29);
}

const put = (x, y, z, id, opts) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (opts) g.set(x, y, z, id, opts);
  else g.set(x, y, z, id);
};

// Exposed faces: a side is a facade if it has no neighbour, or the neighbour stands lower.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
for (const c of all) {
  c.face = {};
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    const nb = get(c.x + dx, c.z + dz);
    c.face[k] = !nb || nb.top < c.top;
  }
  const nFaces = Object.values(c.face).filter(Boolean).length;
  c.perim = nFaces > 0;
  c.corner = (c.face.W || c.face.E) && (c.face.N || c.face.S);
}

// Pass 1: massing, foundations, floor slabs, glazing grid.
for (const c of all) {
  const { x, z } = c;
  for (let y = 0; y < c.top; y++) {
    if (y < c.gr) { put(x, y, z, "stone_bricks"); continue; }
    const rel = y - G0;
    if (y === c.top - 1) {
      put(x, y, z, c.perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (rel < 4) { put(x, y, z, "smooth_quartz"); continue; }
    if ((rel - 4) % 2 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    if (!c.perim) continue;
    const idx = (c.face.W || c.face.E) ? z : x;
    const pier = c.corner || idx % 3 === 0;
    put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
  }
}

// Pass 2: a few warm lights set just behind glazing (sparse, on one column in four).
for (const c of all) {
  if (!c.perim || c.corner) continue;
  const dx = c.face.W ? 1 : (c.face.E ? -1 : 0);
  const dz = c.face.N ? 1 : (c.face.S ? -1 : 0);
  const ix = c.x + dx, iz = c.z + dz;
  if (!has(ix, iz)) continue;
  const inner = get(ix, iz);
  const idx = (c.face.W || c.face.E) ? c.z : c.x;
  if (idx % 3 === 0) continue;
  if (idx % 4 !== 1) continue;
  for (let y = Math.max(c.gr, inner.gr); y < Math.min(c.top, inner.top) - 1; y++) {
    const rel = y - G0;
    if (rel < 5 || (rel - 4) % 2 === 0) continue;
    if (((c.x * 7 + c.z * 13 + y * 3) % 5) === 0) put(ix, y, iz, "glowstone");
  }
}

// Pass 3: recessed lobby entrance, centred on the street face, with canopy.
const mid = (W - 1) / 2;
const doorCands = all.filter(c => c.perim && !c.corner && c.gr <= G0 + 4 && c.top >= G0 + 9);
let best = null, bestScore = Infinity;
for (const c of doorCands) {
  const faceKey = Object.keys(c.face).find(k => c.face[k] && (k === "N" || k === "S" || k === "W" || k === "E"));
  if (!faceKey) continue;
  const idx = (faceKey === "W" || faceKey === "E") ? c.z : c.x;
  const along = (faceKey === "W" || faceKey === "E") ? D : W;
  const score = Math.abs(idx - (along - 1) / 2) + (faceKey === "N" || faceKey === "S" ? 0 : 2);
  if (score < bestScore) { bestScore = score; best = { c, faceKey }; }
}

if (best) {
  const { c, faceKey } = best;
  const facing = { N: "north", S: "south", W: "west", E: "east" }[faceKey];
  const yLow = G0 + 5, yUp = G0 + 6;
  put(c.x, yLow, c.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, yUp, c.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = (faceKey === "N" || faceKey === "S") ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
  for (const [ax, az] of along) {
    const cc = get(c.x + ax, c.z + az);
    if (!cc || !cc.perim || cc.top < G0 + 9) continue;
    put(cc.x, G0 + 7, cc.z, "smooth_quartz");
  }
  put(c.x, G0 + 7, c.z, "smooth_quartz");
  // step at the lobby threshold
  put(c.x, G0 + 4, c.z, "smooth_quartz_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

// Pass 4: rooftop plant: 2x2 mechanical cores with a parapet screen, on the main roof.
for (const c of all) {
  if (c.perim || c.top !== T) continue;
  if (c.x % 6 === 2 && c.z % 6 === 2 && T + 2 <= 30) {
    for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(c.x + ox, T, c.z + oz, "light_gray_concrete");
      put(c.x + ox, T + 1, c.z + oz, "light_gray_concrete");
    }
    put(c.x, T + 2, c.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
