import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109980";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 6 x 12, roof deck at y 21 (about 21 blocks above lowest ground),
// parapet to 23, small mechanical penthouse and lightning rod to 25.
const W = 6, H = 33, D = 12;
const ROOF = 21;
const g = new Voxels([W, H, D]);

const key2 = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(key2(x, z), gr);
const has = (x, z) => cellG.has(key2(x, z));

// Outward directions: n = -z, s = +z, w = -x, e = +x
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
function faces(x, z) {
  const out = [];
  for (const [f, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(f);
  }
  return out;
}
const isEdge = (x, z) => faces(x, z).length > 0;

// Warm lights behind glass: pick window cells on storeys 1..3 at mid-band,
// and mark the interior cell just inside as glowstone (only if it is interior).
const glowKeys = new Set();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const f of faces(x, z)) {
    const [dx, dz] = DIRS[f];
    const u = (f === "n" || f === "s") ? x : z;
    for (let k = 1; k <= 3; k++) {
      if (u % 3 === 0) continue;
      if ((u + k) % 4 !== 1) continue;
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isEdge(ix, iz)) glowKeys.add(`${ix},${5 * k + 2},${iz}`);
    }
  }
}

function facade(f, x, z, y, g0) {
  const k = Math.floor(y / 5);
  const r = y % 5;
  const u = (f === "n" || f === "s") ? x : z;

  if (k === 0) {
    if (r === 4) return ["black_concrete"];               // sign band
    if (f === "s" && u === 2) {                           // entrance on street face
      if (r === 3) return ["lantern", { hanging: "true" }];
      return ["tinted_glass"];
    }
    if (u % 3 === 0) return ["white_concrete"];           // shopfront piers
    return ["glass"];                                     // shopfront glazing
  }
  if (r === 4) return ["white_concrete"];                 // spandrel
  if (u % 3 === 0) return ["white_concrete"];             // mullion
  return ["light_blue_stained_glass"];                    // window
}

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const fs = faces(x, z);

  // Foundation and body, y 0..21
  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }   // base course at grade
    if (y === ROOF) { g.set(x, y, z, "light_gray_concrete"); continue; } // roof deck
    if (y === ROOF - 1) {                                              // cornice
      g.set(x, y, z, edge ? "smooth_stone" : "white_concrete");
      continue;
    }
    if (y % 5 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // floor slabs 5, 10, 15
    if (edge) {
      const [blk, props] = facade(fs[0], x, z, y, gr);
      if (props) g.set(x, y, z, blk, props); else g.set(x, y, z, blk);
      continue;
    }
    if (glowKeys.has(`${x},${y},${z}`)) g.set(x, y, z, "glowstone");
    // interior otherwise stays air
  }

  // Parapet on the perimeter
  if (edge) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "stone_brick_slab", { type: "top" });
  }

  // Mechanical penthouse, roughly centred
  if (!edge && x >= 2 && x <= 3 && z >= 4 && z <= 7) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}

// Lightning rod on top of the penthouse
if (has(2, 5)) g.set(2, ROOF + 4, 5, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
