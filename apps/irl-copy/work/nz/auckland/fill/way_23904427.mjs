// Ferry Building, Auckland (way 23904427): an Edwardian classical waterfront block with a clock tower.
// Massing follows the lidar roof per cell (3x3 median, quantised to 4-block storeys), so every tier is a
// full column from y0 up, with setbacks where the roof steps. Each storey is a slab (y%4==0), a window band
// (y%4 in 1,2: glass in a shell of cream stone with quartz piers) and a copper-capped spandrel (y%4==3).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23904427.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 72, D = 38, H = 63;
const MIN_T = 20, MAX_T = 52;                                  // lower wing .. clock-tower top (blocks above y0)
const key = (x, z) => x + "," + z;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && F.has(key(x, z));

// Roof tiers: 3x3 median of the lidar roof (kills stair-step noise), then snap to whole storeys.
const TOP = new Map();
for (const [k, { r }] of F) {
  const [x, z] = k.split(",").map(Number);
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(F.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  TOP.set(k, Math.min(MAX_T, Math.max(MIN_T, Math.round(v[v.length >> 1] / 4) * 4)));
}
const top = (x, z) => TOP.get(key(x, z)) ?? 0;
const bld = (x, y, z) => inF(x, z) && y >= 0 && y < top(x, z);           // building volume (walls and air alike)
const DIRS = [
  { dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" }, { dx: 0, dz: -1, name: "north" },
];
const outward = (x, y, z) => DIRS.filter((d) => !bld(x + d.dx, y, z + d.dz));
const shell = (x, y, z) => bld(x, y, z) && outward(x, y, z).length > 0;

// Entrance: the longest run of street-facing ground-floor wall on any one side; door at its middle.
let door = null;
for (const d of DIRS) {
  const along = d.dz ? (x, z) => x : (x, z) => z;
  const cand = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => !bld(x + d.dx, 1, z + d.dz));
  const pos = new Set(cand.map(([x, z]) => (d.dz ? `${z}:${x}` : `${x}:${z}`)));
  for (const [x, z] of cand) {
    const fixed = d.dz ? z : x;
    const a0 = along(x, z);
    const back = d.dz ? `${fixed}:${a0 - 1}` : `${a0 - 1}:${fixed}`;
    if (pos.has(back)) continue;                                  // start of a run only
    let n = 0, a = a0;
    while (pos.has(d.dz ? `${fixed}:${a}` : `${a}:${fixed}`)) { n++; a++; }
    if (!door || n > door.n) door = { n, dir: d, mid: [d.dz ? a0 + ((n - 1) >> 1) : fixed, d.dz ? fixed : a0 + ((n - 1) >> 1)], a0, fixed };
  }
}
const doorKey = door ? key(door.mid[0], door.mid[1]) : null;
const doorBay = new Set();
if (door) for (let o = -1; o <= 1; o++) doorBay.add(door.dir.dz ? key(door.mid[0] + o, door.mid[1]) : key(door.mid[0], door.mid[1] + o));

// Clock tower: the top tier's group, with a 3x3-ish lit cupola centred on it.
const maxTop = Math.max(...TOP.values());
const topGroup = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => top(x, z) === maxTop);
const cxm = topGroup.reduce((s, [x]) => s + x, 0) / topGroup.length, czm = topGroup.reduce((s, [, z]) => s + z, 0) / topGroup.length;
let cupola = topGroup.filter(([x, z]) => Math.abs(x - Math.round(cxm)) <= 1 && Math.abs(z - Math.round(czm)) <= 1);
if (!cupola.length) cupola = topGroup;
const cupKey = new Set(cupola.map(([x, z]) => key(x, z)));
const inCup = (x, z) => cupKey.has(key(x, z));
const spire = cupola.reduce((best, c) => (Math.hypot(c[0] - cxm, c[1] - czm) < Math.hypot(best[0] - cxm, best[1] - czm) ? c : best));

// Outer parapet edge on every roof that stops at the footprint edge (not under a taller neighbour).
const parapet = new Set();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (inCup(x, z)) continue;
  if (DIRS.some((d) => !inF(x + d.dx, z + d.dz))) parapet.add(k);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => { if (y >= 0 && y < H) g.set(x, y, z, b, s); };

// --- Shell, storeys, roof --------------------------------------------------------------------------
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const r = y % 4, kf = y >> 2;
    const sh = shell(x, y, z);
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                                 // plinth course
    if (y === T - 1) { put(x, y, z, sh ? "stone_bricks" : "oxidized_copper"); continue; }     // stone cornice on the edge, copper roof field (T is a storey multiple)
    if (r === 0) { put(x, y, z, sh ? "stone_bricks" : "smooth_stone"); continue; }             // string course / floor slab
    if (r === 3) { put(x, y, z, sh ? "quartz_bricks" : "smooth_stone"); continue; }           // spandrel / ceiling slab
    if (!sh) continue;                                                                        // interior air behind the glass
    const out = outward(x, y, z)[0];
    const pier = (x + z) % 3 === 0;                                                           // bay piers, continuous round corners
    if (kf === 0 && doorKey === key(x, z)) {
      const st = { facing: door.dir.name, hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" };
      put(x, y, z, "dark_oak_door", st); continue;
    }
    if (kf === 0 && doorBay.has(key(x, z))) { put(x, y, z, "quartz_pillar"); continue; }     // flanks of the entrance
    if (pier) { put(x, y, z, kf === 0 ? "stone_bricks" : "quartz_pillar"); continue; }
    put(x, y, z, "glass");
    // warm light just inside the sill of some windows (on the storey floor, never floating)
    if (r === 1 && out) {
      const ix = x - out.dx, iz = z - out.dz;
      if (bld(ix, y, iz) && !shell(ix, y, iz) && (x * 3 + z * 5 + kf) % 4 === 0) put(ix, y, iz, kf === 0 ? "shroomlight" : "glowstone");
    }
  }
}

// --- Roof tiers: parapets, plant boxes, the clock cupola and its spire ----------------------------
for (const k of parapet) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  put(x, T, z, "smooth_quartz");
  put(x, T + 1, z, "stone_bricks");
}
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  if (inCup(x, z) || parapet.has(k) || T < 28) continue;
  let deep = true;
  for (let dx = -2; dx <= 2 && deep; dx++) for (let dz = -2; dz <= 2 && deep; dz++) deep = inF(x + dx, z + dz);
  if (deep && (x * 7 + z * 3) % 11 === 0) { put(x, T, z, "light_gray_concrete"); put(x, T + 1, z, "light_gray_concrete"); }
}
const C = maxTop;
for (const [x, z] of cupola) {
  put(x, C, z, "stone_bricks");
  const out = DIRS.filter((d) => !inCup(x + d.dx, z + d.dz));
  for (const y of [C + 1, C + 2]) {
    if (out.length === 1) put(x, y, z, "glowstone");                                          // lit clock dial, face-centre
    else put(x, y, z, "smooth_quartz");
  }
  put(x, C + 3, z, "stone_bricks");
  put(x, C + 4, z, "oxidized_copper");
}
put(spire[0], C + 5, spire[1], "oxidized_copper");
put(spire[0], C + 6, spire[1], "oxidized_copper");
put(spire[0], C + 7, spire[1], "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/way_23904427.nbt`);

const counts = {};
for (const v of TOP.values()) counts[v] = (counts[v] || 0) + 1;
console.log("cells", F.size, "tiers", JSON.stringify(counts), "blocks", g.count());
console.log("door", door && { at: door.mid, facing: door.dir.name, run: door.n }, "cupola", cupola.length, "spire", spire);
