// Way 326736324: a two-storey brick commercial block with a shopfront on its street face, a single-storey wing
// and a plant room on the roof. Built from the footprint's lidar roof heights, smoothed into two tiers (8 = two
// storeys, 6 = one storey), solid massing with glass set in the face and an air gap behind each pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326736324.cells.json`, "utf8"));

const TALL = 8, LOW = 6, TIER_CUT = 6.6;          // storey tiers in blocks; the 3x3 mean of lidar roof that makes a tall cell
const fp = new Map();                              // "x,z" -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const inFp = (x, z) => fp.has(`${x},${z}`);

const H = new Map();                               // "x,z" -> tier height
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const q = fp.get(`${x + dx},${z + dz}`); if (q) { sum += q.r; n++; }
  }
  H.set(k, sum / n >= TIER_CUT ? TALL : LOW);
}
const h = (x, z) => H.get(`${x},${z}`) ?? 0;

// outward normals; a face is exposed to the street when the cell beyond it is outside the footprint
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // n, s, w, e
const edgeOf = (x, z) => NORMALS.some(([dx, dz]) => !inFp(x + dx, z + dz) || h(x + dx, z + dz) < h(x, z));

const g = new Voxels([15, 21, 29]);

// 1. massing: foundation to ground, bricks to the tier, plinth, storey line at y 4, coping, roof deck
for (const [k, { g: ground }] of fp) {
  const [x, z] = k.split(",").map(Number), Ht = h(x, z), edge = edgeOf(x, z);
  for (let y = 0; y < Ht; y++) {
    let b = "bricks";
    if (y < ground) b = "stone_bricks";                       // foundation
    else if (edge && y === 0) b = "stone_bricks";            // plinth
    else if (edge && y === 4) b = "smooth_stone";            // storey line / lintel / sill
    else if (edge && y === Ht - 1) b = "smooth_stone";       // coping
    else if (!edge && y === Ht - 1) b = "stone";             // roof deck
    g.set(x, y, z, b);
  }
}

// 2. faces: glass panes in 2-wide bays with 1-wide piers, an air gap behind each pane, a warm light behind some
const PANE = { ns: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
               ew: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };
const DOOR_X = 8;                                      // the street face's middle bay (z = 0)
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), Ht = h(x, z);
  NORMALS.forEach(([dx, dz], face) => {
    if (inFp(x + dx, z + dz)) return;                  // only street faces
    const t = dz !== 0 ? x : z, ns = dz !== 0;       // the bay index runs along the wall
    const bands = [[1, 3, true]];                      // ground band: rows 1..3, shopfront
    if (Ht === TALL) bands.push([5, 6, false]);         // upper band
    for (const [y0, y1, ground] of bands) for (let y = y0; y <= y1; y++) {
      if (t % 3 === 0) { if (ground) g.set(x, y, z, "dark_oak_planks"); continue; }   // pier / shopfront frame
      const onStreet = dx === 0 && dz === -1 && z === 0;
      if (onStreet && t === DOOR_X && y <= 2) {        // the entrance, recessed into an air pocket
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        g.set(x - dx, y, z - dz, "air");
        continue;
      }
      if (onStreet && t === DOOR_X && y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); continue; }
      g.set(x, y, z, "glass_pane", ns ? PANE.ns : PANE.ew);
      const px = x - dx, pz = z - dz;                  // the air gap behind the pane
      if (inFp(px, pz)) g.set(px, y, pz, "air");
      if (!ground && (t + face) % 4 === 1 && inFp(x - 2 * dx, z - 2 * dz)) {
        g.set(x - 2 * dx, y, z - 2 * dz, "glowstone");  // a warm light behind the glass
      }
    }
  });
}

// 3. roof plant room: a 3x2 block on the tall roof, set in from the edges
let best = null, cx = 0, cz = 0, nt = 0;
for (const [k] of fp) { const [x, z] = k.split(",").map(Number); if (h(x, z) === TALL) { cx += x; cz += z; nt++; } }
cx /= nt; cz /= nt;
for (let x = 0; x < 15; x++) for (let z = 0; z < 29; z++) {
  let ok = true;
  for (let dx = -1; dx <= 3 && ok; dx++) for (let dz = -1; dz <= 2 && ok; dz++) {
    if (h(x + dx, z + dz) !== TALL || edgeOf(x + dx, z + dz)) ok = false;
  }
  if (!ok) continue;
  const d = Math.hypot(x + 1 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let x = best.x; x < best.x + 3; x++) for (let z = best.z; z < best.z + 2; z++) {
    g.set(x, TALL, z, "stone_bricks");
    g.set(x, TALL + 1, z, "smooth_stone");
  }
}

const out = g.save(`${DIR}/way_326736324.nbt`);
console.log(JSON.stringify({ built: out, tall: [...H.values()].filter((v) => v === TALL).length, low: [...H.values()].filter((v) => v === LOW).length }));
