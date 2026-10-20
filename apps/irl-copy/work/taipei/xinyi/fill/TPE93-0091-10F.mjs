import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0091-10F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Box: 66 x 57 x 20. Storeys are 5 blocks tall on an absolute grid from y 0.
// Main roof deck y 44, cornice y 45-46, plant and crown above.
// End tiers (x <= 4 or x >= 61) step down to a roof at y 30.
const W = 66, H = 57, D = 20;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const TOP = 44;     // main roof deck
const TIER = 30;    // setback roof at the two ends
const CORNICE = 45;

const isTier = (x) => x <= 4 || x >= 61;
const topFor = (x) => (isTier(x) ? TIER : TOP);

function faceOf(x, z) {
  const faceZ = !has(x, z - 1) || !has(x, z + 1); // face runs along x
  const faceX = !has(x - 1, z) || !has(x + 1, z); // face runs along z
  return {
    faceZ, faceX,
    edge: faceZ || faceX,
    corner: faceZ && faceX,
    mullion: faceZ ? (x % 3 === 0) : (z % 3 === 0),
  };
}

// Entrance on the street-facing (z-face) cells, wider than before
const isDoor = (x, z, f) => f.faceZ && !f.faceX && x >= 29 && x <= 36;

function inward(x, z, f) {
  if (f.faceZ) return [x, !has(x, z - 1) ? z + 1 : z - 1];
  return [!has(x - 1, z) ? x + 1 : x - 1, z];
}

// 1. Foundation, base, storeys, roofs
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(gr, H - 1));
  const f = faceOf(x, z);
  const top = topFor(x);

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  if (!f.edge) {
    if (ground < H) g.set(x, ground, z, "smooth_stone");
    for (let k = 1; k <= 8; k++) {
      const y = 5 * k;
      if (y >= ground && y < top) g.set(x, y, z, "smooth_stone");
    }
    g.set(x, top, z, "gray_concrete");
    continue;
  }

  for (let y = ground; y <= top; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    let b = null;

    if (y === top && top === TIER) {
      b = "gray_concrete";                          // setback roof cap
    } else if (f.corner) {
      b = "smooth_quartz";                          // corner piers
    } else if (y === ground) {
      b = "polished_granite";                       // base course
    } else if (k === 0) {
      if (isDoor(x, z, f)) {
        if (y < ground + 3) b = null;               // open entrance
        else if (y === ground + 3) b = "smooth_stone"; // canopy
        else b = "white_concrete";
      } else if (y === ground + 3 || y === 4) {
        b = "white_concrete";
      } else {
        b = f.mullion ? "smooth_quartz" : "cyan_stained_glass";
      }
    } else if (r === 0 || r === 4) {
      b = "white_concrete";                         // spandrels / storey lines
    } else {
      b = f.mullion ? "smooth_quartz" : "cyan_stained_glass";
    }

    if (b) g.set(x, y, z, b);
  }

  // cornice: two-block parapet on the main roof, one block on setback tiers
  if (top === TOP) {
    g.set(x, CORNICE, z, "smooth_quartz");
    g.set(x, CORNICE + 1, z, "smooth_quartz");
  } else {
    g.set(x, TIER + 1, z, "smooth_quartz");
  }
}

// 2. Warm lights behind selected glass bays (air gap, one cell in)
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  if (!f.edge || f.corner) continue;
  const bay = f.faceZ ? (x % 6 === 4) : (z % 6 === 4);
  if (!bay) continue;
  const [ix, iz] = inward(x, z, f);
  if (!has(ix, iz)) continue;
  if (faceOf(ix, iz).edge) continue;
  const igr = G.get(`${ix},${iz}`);
  const top = topFor(x);
  for (let k = 1; k <= 8; k++) {
    const y = 5 * k + 2;
    if (y > gr && y >= igr && y < top) g.set(ix, y, iz, "shroomlight");
  }
}

// 3. Roof plant / penthouse on the central core, with crown mast
for (let x = 26; x <= 40; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!has(x, z)) continue;
    for (let y = CORNICE; y <= 47; y++) g.set(x, y, z, "gray_concrete");
  }
}
for (let x = 28; x <= 38; x++) {
  for (let z = 7; z <= 12; z++) {
    if (!has(x, z)) continue;
    g.set(x, 48, z, "smooth_quartz");
  }
}
if (has(33, 9)) {
  for (let y = 49; y <= 51; y++) g.set(33, y, 9, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
