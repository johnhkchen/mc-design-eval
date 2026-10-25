import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499462";
const W = 51, H = 29, D = 68;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : (raw.cells ?? []);

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// ---- footprint and per-cell data -------------------------------------------
const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  info.set(key(x, z), {
    x, z,
    gr: Math.min(20, Math.max(0, Math.round(gr ?? 0))),
    rf: Number.isFinite(rf) ? rf : 17,
  });
}
const has = (x, z) => info.has(key(x, z));

// Roof: wide 5x5 mean, then snap to 2-block tiers so the skyline is flat-topped
for (const c of info.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = info.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.rf; n++; }
  }
  const avg = n ? sum / n : c.rf;
  const tier = Math.round(avg / 2) * 2;
  c.top = Math.min(25, Math.max(c.gr + 4, tier));
}

// ---- depth from outside: 1 = facade, 2 = air gap, >=3 = core --------------
const DIRS = [
  { dx: 0, dz: -1, name: "N", facing: "north" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: 1, dz: 0, name: "E", facing: "east" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
];
const outwardOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const depth = new Map();
const queue = [];
for (const c of info.values()) {
  if (outwardOf(c.x, c.z).length) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const dd of DIRS) {
    const k = key(c.x + dd.dx, c.z + dd.dz);
    if (info.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(info.get(k));
    }
  }
}

// ---- entrance: largest facade face, centred on its run ---------------------
const faceCount = { N: [], S: [], E: [], W: [] };
for (const c of info.values()) {
  if (depth.get(key(c.x, c.z)) !== 1) continue;
  for (const o of outwardOf(c.x, c.z)) {
    faceCount[o.name].push(o.name === "N" || o.name === "S" ? c.x : c.z);
  }
}
let entFace = null, bestN = -1;
for (const f of ["S", "N", "E", "W"]) {
  if (faceCount[f].length > bestN) { bestN = faceCount[f].length; entFace = f; }
}
let entAlong = -999;
if (entFace) {
  const al = faceCount[entFace].slice().sort((a, b) => a - b);
  entAlong = al[Math.floor(al.length / 2)];
}
const entDir = DIRS.find((d) => d.name === entFace);

// ---- build ------------------------------------------------------------------
const mod = (a, m) => ((a % m) + m) % m;

for (const c of info.values()) {
  const { x, z, gr, top } = c;
  const d = depth.get(key(x, z)) ?? 3;

  // foundation below ground
  for (let y = 0; y < gr; y++) S(x, y, z, d === 1 ? "stone_bricks" : "stone");

  if (d === 1) {
    const outs = outwardOf(x, z);
    const onNS = outs.some((o) => o.name === "N" || o.name === "S");
    const along = onNS ? x : z;
    const facing = outs[0]?.facing ?? "north";
    // entrance: two cells wide, centred on the facade run, flanked by pilasters
    const isEnt = !!entDir && outs.some((o) => o.name === entFace) &&
      (along === entAlong || along === entAlong - 1);
    const pilaster = outs.length > 0 && mod(along, 6) === 0;
    const paneProps = onNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr; y <= top; y++) {
      const rel = y - gr;
      const k = Math.floor(rel / 5);
      const r = rel % 5;

      if (isEnt && (y === gr || y === gr + 1)) {
        S(x, y, z, "dark_oak_door", {
          facing, half: y === gr ? "lower" : "upper", hinge: "left",
          open: "false", powered: "false",
        });
        continue;
      }
      if (isEnt && y === gr + 2) { S(x, y, z, "stone_bricks"); continue; }
      if (isEnt && y === gr + 3) { S(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
      if (y === top) { S(x, y, z, "stone_bricks"); continue; }          // parapet cap
      if (y === top - 1) { S(x, y, z, "stone_brick_slab", { type: "top" }); continue; }
      if (y === gr) { S(x, y, z, "stone_bricks"); continue; }          // plinth
      if (rel % 5 === 0) { S(x, y, z, "stone_bricks"); continue; }    // string course
      const inBand = r >= 1 && r <= 3 && y <= top - 2;
      if (inBand) {
        const pillarStep = k === 0 ? 4 : 3;
        if (mod(along, pillarStep) === 0) {
          S(x, y, z, "stone_bricks");
        } else {
          S(x, y, z, "glass_pane", paneProps);
        }
      } else {
        // wall: render with pilasters every 6 cells for relief
        S(x, y, z, pilaster ? "stone_bricks" : "smooth_sandstone");
      }
    }
  } else if (d === 2) {
    // air gap behind the facade, floor and ceiling slabs per storey
    let glowAlong = null;
    for (const dd of DIRS) {
      const nb = depth.get(key(x + dd.dx, z + dd.dz));
      if (nb === 1) { glowAlong = (dd.dz !== 0) ? x : z; break; }
    }
    for (let y = gr; y <= top - 1; y++) {
      const rel = y - gr;
      const k = Math.floor(rel / 5);
      const r = rel % 5;
      if (y === top - 1) { S(x, y, z, "smooth_stone"); continue; }
      if (r === 0 || r === 4) { S(x, y, z, "smooth_stone"); continue; }
      if (r === 2 && k % 2 === 1 && glowAlong !== null && mod(glowAlong, 6) === 2) {
        S(x, y, z, "glowstone");
      }
    }
  } else {
    // core mass with a light roof membrane
    for (let y = 0; y < top; y++) {
      S(x, y, z, y === top - 1 ? "smooth_stone" : "stone");
    }
    // roof plant: light boxes on the core, standing on the membrane
    if (mod(x, 8) >= 2 && mod(x, 8) <= 4 && mod(z, 9) >= 2 && mod(z, 9) <= 4 && top + 2 <= 27) {
      for (let y = top; y <= top + 1; y++) {
        for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
          S(x + dx, y, z + dz, "light_gray_concrete");
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
