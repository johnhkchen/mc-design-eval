// An office block on a Newton-side street, Auckland: a 1960s-70s concrete-framed commercial building, four storeys on
// most of the footprint with a five-storey tower on the east end and two-storey wings on the low side. Its ground floor
// is a glazed shopfront with a recessed-by-lintel entrance on the south (viewer) face; upper storeys are tinted glass
// bands between pier fins, white spandrels and light-grey floor slabs. Cells are the footprint's own columns: a plinth
// from y 0 to the ground-floor line (y 2) on every cell, so nothing floats on the slope and the downhill side shows its
// extra base; storey slabs every 4 blocks above that. The inside is air behind a one-block shell, with interior columns
// on a 6-block grid and warm lights behind some panes. Plant box on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162153892.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_162153892.nbt`;

const X = 42, Z = 31, Y = 36;
const F0 = 2;          // the ground-floor slab: the highest ground under the footprint
const BAY = 3;         // a pier fin every 3 blocks along a facade
const COL = 6;         // interior columns on a 6-block grid

// the lidar roofs smoothed into tiers: each cell takes the median of its 3x3 footprint neighbourhood, snapped to storeys
const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };
for (const c of col.values()) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) rs.push(n.r); }
  rs.sort((a, b) => a - b);
  const m = rs[rs.length >> 1];
  c.N = m >= 20 ? 5 : m >= 18 ? 4 : m >= 14 ? 3 : 2;   // storeys: the lidar 23 tower, 18 body, 15 and 11 wings
}

// the open faces of a cell at its storey k: off the footprint, or the neighbour stops below this storey
// (k === N is the roof: open only where the neighbour's roof is lower)
const openFaces = (c, k) => Object.keys(DIRS).filter((d) => {
  const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]);
  return !n || (k === c.N ? n.N < c.N : n.N <= k);
});

const g = new Voxels([X, Y, Z]);
const PLINTH = "polished_andesite", BASE = "smooth_stone", SLAB = "light_gray_concrete", WALL = "white_concrete";
const PIER = "light_gray_concrete", GLASS = "cyan_stained_glass_pane", SHOP = "light_blue_stained_glass_pane";
const FASCIA = "polished_andesite", CORNICE = "smooth_stone", AWNING = "black_concrete", PLANT = "gray_concrete";
const paneState = (wallAlongX) => (wallAlongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the entrance: a bay on the south (viewer) face, prefer the ground-floor line at y 2, off the piers, centred on the front
const xs = [...col.values()].map((c) => c.x), cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const frontFace = (c, k) => openFaces(c, k).includes("S");
const entranceCands = [...col.values()].filter((c) => frontFace(c, 0) && c.x % BAY !== 0 && c.x > 0 && c.x < X - 1
  && at(c.x - 1, c.z) && frontFace(at(c.x - 1, c.z), 0) && at(c.x + 1, c.z) && frontFace(at(c.x + 1, c.z), 0));
entranceCands.sort((a, b) => (a.g === 2 ? 0 : 1) - (b.g === 2 ? 0 : 1) || Math.abs(a.x - cx) - Math.abs(b.x - cx));
const door = entranceCands[0];

for (const c of col.values()) {
  const { x, z, N } = c;
  // plinth: solid from y 0 up to the ground-floor line
  for (let y = 0; y < F0; y++) g.set(x, y, z, PLINTH);

  for (let k = 0; k <= N; k++) {
    const yb = F0 + 4 * k;                   // this storey's floor slab; k === N is the roof slab
    const open = openFaces(c, k);
    const exposed = open.length > 0;
    g.set(x, yb, z, k === 0 && exposed ? BASE : k === N && exposed ? CORNICE : SLAB);
    if (k === N) continue;
    const ground = k === 0;
    const wallAlongX = open.includes("N") || open.includes("S");
    const pier = (wallAlongX ? x : z) % BAY === 0;
    for (let r = 1; r <= 3; r++) {
      const y = yb + r;
      if (!exposed) {                        // inside: air, with columns on the grid
        if (x % COL === 3 && z % COL === 3) g.set(x, y, z, PIER);
        continue;
      }
      if (r === 3) { g.set(x, y, z, ground ? FASCIA : WALL); continue; }
      if (pier) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, ground ? SHOP : GLASS, paneState(wallAlongX));
    }
  }
}

// the lights: a glowstone or shroomlight in the air behind some panes, on the first storey row
for (const c of col.values()) {
  const { x, z, N } = c;
  for (let k = 0; k < N; k++) {
    const open = openFaces(c, k);
    if (!open.length || (k === 0 && door && c.x === door.x && c.z === door.z)) continue;
    const wallAlongX = open.includes("N") || open.includes("S");
    if ((wallAlongX ? c.x : c.z) % BAY === 0) continue;
    const h = (x * 7 + z * 13 + k * 5) % 9;
    if (h !== 0 && h !== 4) continue;
    const out = DIRS[open[0]];
    const inn = at(x - out[0], z - out[1]);
    if (!inn || inn.N <= k || openFaces(inn, k).length || (inn.x % COL === 3 && inn.z % COL === 3)) continue;
    g.set(inn.x, F0 + 4 * k + 1, inn.z, h === 0 ? "glowstone" : "shroomlight");
  }
}

// the entrance: a glass-and-frame door on the south face at the ground floor, under a black awning band
if (door) {
  const y0 = F0 + 1;
  const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(door.x, y0, door.z, "dark_oak_door", doorState("lower"));
  g.set(door.x, y0 + 1, door.z, "dark_oak_door", doorState("upper"));
  for (const dx of [-1, 0, 1]) g.set(door.x + dx, F0 + 3, door.z, AWNING);
}

// the roof plant: a 4 x 3 gray box on the body roof (lidar 18 tier), nearest the middle of the footprint
let plant = null;
for (const c of col.values()) {
  if (c.N !== 4) continue;
  const cells4 = [];
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) cells4.push([c.x + dx, c.z + dz]);
  const inRect = (x, z) => cells4.some(([u, v]) => u === x && v === z);
  // every box cell is on the roof and no side of the box is open to air (the box rests on roof slab, not a step)
  const ok = cells4.every(([x, z]) => {
    const n = at(x, z); if (!n || n.N !== 4) return false;
    return Object.values(DIRS).every(([ax, az]) => inRect(x + ax, z + az) || (at(x + ax, z + az)?.N ?? 0) >= 4);
  });
  if (!ok) continue;
  const d = Math.hypot(c.x + 1.5 - X / 2, c.z + 1 - Z / 2);
  if (!plant || d < plant.d) plant = { d, cells: cells4 };
}
if (plant) for (const [x, z] of plant.cells) { g.set(x, F0 + 4 * 4 + 1, z, PLANT); g.set(x, F0 + 4 * 4 + 2, z, PLANT); }

const res = g.save(OUT);
console.log(JSON.stringify({ out: OUT, ...res, storeys: { tower: [...col.values()].filter((c) => c.N === 5).length, body: [...col.values()].filter((c) => c.N === 4).length, wings: [...col.values()].filter((c) => c.N < 4).length }, door: door ? [door.x, door.z] : null, plant: plant ? plant.cells.length : 0 }));
