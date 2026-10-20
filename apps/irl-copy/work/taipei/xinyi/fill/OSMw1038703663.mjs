import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703663";
const W = 16, H = 23, D = 20;
const STOREY = 5;          // blocks per storey
const ROOF_H = 11;         // parapet top above the cell's own ground, in blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const key = (x, z) => `${x},${z}`;
const inS = (x, z) => ground.has(key(x, z));
const baseOf = (x, z) => ground.get(key(x, z)) - minG;   // y of the cell's ground surface

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !inS(x + d.dx, z + d.dz));

// ---- pick the main (street) face and the entrance -------------------------
let front = null;
for (const pref of ["south", "north", "east", "west"]) {
  const cand = [];
  for (const [x, z] of cells) {
    const f = exposed(x, z).find((d) => d.name === pref);
    if (f) cand.push({ x, z, f });
  }
  if (cand.length) { front = { name: pref, cand }; break; }
}
const frontDir = front ? DIRS.find((d) => d.name === front.name) : null;
const frontSpan = frontDir && frontDir.dx !== 0 ? D : W;
const idxOf = (x, z, f) => (f.dx !== 0 ? z : x);
let doorKey = null, doorI = -1;
if (front) {
  const mid = Math.floor(frontSpan / 2);
  let best = Infinity;
  for (const c of front.cand) {
    const i = idxOf(c.x, c.z, c.f);
    if (Math.abs(i - mid) < best) { best = Math.abs(i - mid); doorKey = key(c.x, c.z); doorI = i; }
  }
}

// ---- glow positions: inside the room behind some upper windows -----------
const glow = new Set();
for (const [x, z] of cells) {
  const fs = exposed(x, z);
  if (fs.length !== 1) continue;
  const f = fs[0];
  const i = idxOf(x, z, f);
  if (i % 3 === 0 || i % 6 !== 1) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (inS(ix, iz) && exposed(ix, iz).length === 0) glow.add(key(ix, iz));
}

// ---- wall block selection -------------------------------------------------
function wallBlock(x, z, f, h, corner) {
  const i = idxOf(x, z, f);
  const pier = corner || i % 3 === 0;
  if (h === 0) return ["polished_andesite"];
  if (h === 4 || h === 5 || h === 9) return ["smooth_quartz"];   // floor lines / sill band
  if (h === 10) return ["white_concrete"];                       // parapet
  if (h <= 3) {                                                  // ground-floor shopfront
    if (pier) return ["polished_andesite"];
    if (front && f.name === front.name && Math.abs(i - doorI) === 1) return ["polished_andesite"];
    if (h === 3) return ["dark_oak_planks"];                     // fascia band
    return ["glass"];
  }
  // upper storey windows h6..h8
  if (pier) return ["white_concrete"];
  return ["glass"];
}

// ---- build every footprint column -----------------------------------------
for (const [x, z] of cells) {
  const base = baseOf(x, z);
  const fs = exposed(x, z);
  const corner = fs.length > 1;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base && y < H; y++) g.set(x, y, z, "stone_bricks");

  for (let h = 0; h <= 10; h++) {
    const y = base + h;
    if (y >= H) break;

    if (fs.length === 0) {
      // interior: floor slabs and roof slab only, air in between
      if (h === 0 || h === 5) g.set(x, y, z, "smooth_stone");
      else if (h === 10) g.set(x, y, z, "smooth_quartz");
      else if (h === 7 && glow.has(key(x, z))) g.set(x, y, z, "glowstone");
      continue;
    }

    const f = fs[0];
    // entrance
    if (key(x, z) === doorKey && front && f.name === front.name && (h === 1 || h === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: f.name,
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const [id] = wallBlock(x, z, f, h, corner);
    g.set(x, y, z, id);
  }

  // corner lanterns on the parapet for dusk
  if (corner && base + ROOF_H < H) g.set(x, base + ROOF_H, z, "lantern", { hanging: "false" });
}

// ---- roof plant room in the middle of the roof ----------------------------
const x0 = Math.floor(W * 0.3), x1 = Math.ceil(W * 0.7) - 1;
const z0 = Math.floor(D * 0.3), z1 = Math.ceil(D * 0.7) - 1;
for (let x = x0; x <= x1; x++) {
  for (let z = z0; z <= z1; z++) {
    if (!inS(x, z) || exposed(x, z).length) continue;
    const base = baseOf(x, z);
    if (base + 13 >= H) continue;
    g.set(x, base + 11, z, "light_gray_concrete");
    g.set(x, base + 12, z, "light_gray_concrete");
    g.set(x, base + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
