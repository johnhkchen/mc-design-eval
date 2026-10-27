// Way 332241899: a 1930s brick-and-concrete commercial block (five storeys, shopfronts on the ground floor), Auckland
// inner suburb. Walls are brick piers with glazed bays and white-concrete string courses and lintels; the stone plinth
// and foundation follow the slope; the roof is one flat slab with a stone coping. Storey lines sit on an absolute
// 4-block grid so the bands run level across the facade, and each column stands on its own ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const rows = JSON.parse(readFileSync(`${DIR}/way_332241899.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, g, r] of rows) C.set(key(x, z), { x, z, g, R: r >= 19 ? 20 : r });  // lidar roof noise: 19 reads as the 20 tier
for (const c of C.values()) c.R = Math.max(c.R, c.g + 5);                             // every column keeps a few storeys

const LINES = [4, 8, 12, 16];                                                         // absolute storey lines
const bandBases = (c) => [c.g, ...LINES.filter((L) => L >= c.g + 3 && L <= c.R - 4)].sort((a, b) => a - b);
const bandTop = (c, i, bases) => (i + 1 < bases.length ? bases[i + 1] : c.R - 1);      // exclusive; the top band ends at the coping row

// outward facing of a footprint cell, or null if interior; faces run along x (north/south) or z (east/west)
function faceOf(c) {
  const n = !C.has(key(c.x, c.z - 1)), s = !C.has(key(c.x, c.z + 1));
  const w = !C.has(key(c.x - 1, c.z)), e = !C.has(key(c.x + 1, c.z));
  if (!n && !s && !w && !e) return null;
  if (n) return { dir: "north", dx: 0, dz: -1, t: c.x };
  if (s) return { dir: "south", dx: 0, dz: 1, t: c.x };
  if (w) return { dir: "west", dx: -1, dz: 0, t: c.z };
  return { dir: "east", dx: 1, dz: 0, t: c.z };
}

// the entrance: the south-facing wall cell nearest the middle of the north-south front (x 22)
let door = null;
for (const c of C.values()) {
  const f = faceOf(c);
  if (!f || f.dir !== "south") continue;
  const d = Math.abs(c.x - 22);
  if (!door || d < door.d) door = { c, d };
}
const doorKey = door ? key(door.c.x, door.c.z) : null;

const g = new Voxels([44, 33, 38]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const opening = (t) => t % 4 === 1 || t % 4 === 2;                                  // two-block glazed bays, piers between

// hash for the sparse warm lights
const lit = (c, b) => (c.x * 7 + c.z * 13 + b * 3) % 7 === 0;

for (const c of C.values()) {
  const face = faceOf(c);
  const bases = bandBases(c);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

  // floor slabs at each storey line (the interior is an air gap between them)
  for (const b of bases) put(c.x, b, c.z, face && b === c.g ? "stone_bricks" : face ? "white_concrete" : "smooth_stone");
  // flat roof slab with a coping on the perimeter
  const roofY = c.R - 1;
  if (face) put(c.x, roofY, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else put(c.x, roofY, c.z, "smooth_stone");

  if (!face) continue;

  // the walls: one column of blocks on the outer ring, banded by storey
  for (let i = 0; i < bases.length; i++) {
    const b = bases[i], t = bandTop(c, i, bases), ground = i === 0;
    for (let y = b + 1; y <= t - 2; y++) {
      const isOpen = opening(face.t);
      if (ground && y === b + 1) put(c.x, y, c.z, isOpen ? "dark_oak_planks" : "stone_bricks");
      else if (isOpen) put(c.x, y, c.z, "glass_pane");
      else put(c.x, y, c.z, "bricks");
    }
    // lintel or shopfront fascia
    put(c.x, t - 1, c.z, "white_concrete");
    // warm light behind a glazed bay: a glowstone or shroomlight on the floor of the room inside
    if (!ground && opening(face.t) && lit(c, b)) {
      const ix = c.x - face.dx, iz = c.z - face.dz, inner = C.get(key(ix, iz));
      if (inner && !faceOf(inner) && bandBases(inner).includes(b)) {
        put(ix, b + 1, iz, lit(c, b + 1) ? "shroomlight" : "glowstone");
      }
    }
  }
}

// the entrance: two door blocks in the ground band, a dark timber fascia over it as the canopy
if (door) {
  const c = door.c, face = faceOf(c);
  const bases = bandBases(c);
  const top = bandTop(c, 0, bases);
  if (top - c.g >= 4) {
    const state = (half) => ({ facing: face.dir, half, hinge: "left", open: "false", powered: "false" });
    put(c.x, c.g + 1, c.z, "dark_oak_door", state("lower"));
    put(c.x, c.g + 2, c.z, "dark_oak_door", state("upper"));
    put(c.x, top - 1, c.z, "dark_oak_planks");
  }
}

// roof plant room: a small box with a flat top on the tallest flat tier
for (let x = 16; x <= 21; x++) for (let z = 14; z <= 18; z++) {
  const c = C.get(key(x, z));
  if (!c || c.R !== 20) continue;
  const ring = x === 16 || x === 21 || z === 14 || z === 18;
  if (ring) put(x, 20, z, "light_gray_concrete");
  put(x, 21, z, "light_gray_concrete");
}

if (!doorKey) throw new Error("no south-facing wall for the entrance");
const info = g.save(`${DIR}/way_332241899.nbt`);
console.log(`way_332241899: ${info.blocks} blocks, ${info.palette} palette entries`);
