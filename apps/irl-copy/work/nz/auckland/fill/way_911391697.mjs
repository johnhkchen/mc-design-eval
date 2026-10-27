// way 911391697: a 1980s-90s precast-and-tinted-glass office tower on a three-storey shopfront podium, Auckland CBD style.
// Two 25-storey towers (lidar roofs ~100 blocks) stand over a level 3-storey wing and a 5-8 storey spine, setbacks snapped to flat tiers.
// The building is a shell: every voxel of the massing is either facade (piers, spandrels, panes), roof, or interior air with floor slabs.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_911391697.cells.json", "utf8"));   // [x, z, ground, roof]
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_911391697.nbt";
const SIZE = [52, 113, 22];
const TIERS = [2, 3, 5, 8, 12, 16, 20, 25];                       // storey counts the lidar snaps to (flat tiers)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                   // +x -x +z -z

// footprint: ground and storey count per cell
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r });
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const a = [c.r];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const w = cell.get(`${x + dx},${z + dz}`); if (w && (dx || dz)) a.push(w.r);
  }
  const n = Math.max(2, Math.round((med(a) - c.g) / 4));          // 3x3 median of the lidar roof, in storeys above the ground
  let best = TIERS[0];                                              // ties snap down
  for (const t of TIERS) if (Math.abs(t - n) < Math.abs(best - n)) best = t;
  c.n = best; c.R = c.g + 4 * best;                                 // R: the roof's top layer is y = R - 1
}
const inFoot = (x, z) => cell.has(`${x},${z}`);
// a voxel is in the massing if it is in the footprint and below that cell's roof; below the ground is foundation
const inV = (x, y, z) => { const c = cell.get(`${x},${z}`); return !!c && y >= 0 && y < c.R; };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inV(x + dx, y, z + dz)).map(([dx, dz]) => [dx, dz]);
const dirKey = ([dx, dz]) => `${dx},${dz}`;

const g3 = new Voxels(SIZE);
const put = (x, y, z, block, state) => g3.set(x, y, z, block, state);
const placed = new Map();                                           // "x,y,z" -> true (for the connectivity pass)
const kindOf = new Map();                                           // "x,y,z" -> "shell" | "slab" | "light" | "found"
const place = (x, y, z, block, state, kind) => { put(x, y, z, block, state); const k = `${x},${y},${z}`; placed.set(k, true); kindOf.set(k, kind); };

const lights = [];                                                  // candidate interior cells behind a window
const entranceCands = [];

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.R; y++) {
    const rel = y - c.g, top = y === c.R - 1;
    const ex = exposed(x, y, z);
    if (y < c.g) { place(x, y, z, "stone_bricks", null, "found"); continue; }        // foundation to the cell's ground
    if (ex.length) {
      const corner = ex.length > 1;                                 // a corner, or a one-cell-wide run: a pier either way
      const kk = Math.floor(rel / 4), r4 = rel % 4, ground = kk === 0;
      const along = ex.some(([, dz]) => dz) ? x : z;                // N/S walls run along x; E/W walls run along z
      if (top) place(x, y, z, "smooth_quartz", null, "shell");                     // cornice
      else if (rel === 0) place(x, y, z, "polished_andesite", null, "shell");       // base course
      else if (r4 === 0) place(x, y, z, "light_gray_concrete", null, "shell");      // spandrel at each storey line
      else if (corner) place(x, y, z, "white_concrete", null, "shell");             // corner pier
      else if (ground && r4 === 3) place(x, y, z, "smooth_quartz", null, "shell");  // shopfront lintel
      else if (along % 3 === 0) place(x, y, z, "white_concrete", null, "shell");    // pier
      else {
        const [dx, dz] = ex[0], pane = ground ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
        const alongDirs = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
        const conn = Object.fromEntries(["north", "south", "east", "west"].map((s) => [s, "false"]));
        for (const [ax, az] of alongDirs) {                         // a pane joins a neighbouring pane or pier in its wall
          const nb = exposed(x + ax, y, z + az);
          if (!nb.some((e) => dirKey(e) === dirKey([dx, dz]))) continue;
          conn[ax ? (ax > 0 ? "east" : "west") : (az > 0 ? "south" : "north")] = "true";
        }
        place(x, y, z, pane, { ...conn, waterlogged: "false" }, "shell");
        lights.push({ x, y, z, dx, dz, rel, kk, along, ground });
        if (ground && rel === 1 && dz === 1) entranceCands.push({ x, y, z, along });      }
    } else if (top) place(x, y, z, "gray_concrete", null, "shell");                 // roof deck, interior
    else if (rel % 4 === 0) place(x, y, z, "light_gray_concrete", null, "slab");   // floor slab per storey (interior)
    // else: interior air behind the glass
  }
  // parapet on the footprint edge
  if (DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz))) place(x, c.R, z, "smooth_quartz", null, "shell");
}

// entrance: a plain pier-free bay on the longest south-facing ground run, near the middle of the frontage
if (entranceCands.length) {
  const xs = entranceCands.map((e) => e.x).sort((a, b) => a - b);
  const mid = xs[xs.length >> 1];
  const e = entranceCands.filter((c) => c.along % 3 !== 0).sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid))[0];
  if (e) {
    const facing = "north";                                          // the door faces into the building, away from the street
    const dState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
    place(e.x, e.y, e.z, "iron_door", dState("lower"), "shell");
    place(e.x, e.y + 1, e.z, "iron_door", dState("upper"), "shell");
    place(e.x, e.y + 2, e.z, "smooth_quartz", null, "shell");        // transom
  }
}

// warm light behind some windows: an interior air cell just inside a glass bay, mid-storey
let nLights = 0;
for (const l of lights) {
  if (!((l.along + 2 * l.kk) % 7 === 1) || l.rel % 4 !== 2) continue;
  const ix = l.x - l.dx, iz = l.z - l.dz;                           // one cell inside
  if (!inV(ix, l.y, iz)) continue;
  const k = `${ix},${l.y},${iz}`; if (placed.has(k)) continue;
  if (exposed(ix, l.y, iz).length) continue;
  const block = (l.kk + l.along) % 2 ? "glowstone" : "shroomlight";
  place(ix, l.y, iz, block, null, "light"); nLights++;
}

// roof: a lightning-rod spire on the tallest roof, a plant-box penthouse on the other tower, and planters on the podium roofs
const tall = [...cell].filter(([, c]) => c.n >= 25).map(([k]) => k.split(",").map(Number));
if (tall.length) {
  const [sx, sz] = tall[tall.length >> 1];
  const R = cell.get(`${sx},${sz}`).R;
  for (let i = 0; i < 5; i++) place(sx, R + i, sz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }, "roof");
}
let nPlanters = 0;
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const interiorTop = !exposed(x, c.R - 1, z).length;
  if (!interiorTop) continue;
  if (c.n >= 16 && x % 4 === 1 && z % 4 === 1 && !placed.has(`${x},${c.R},${z}`)) {
    place(x, c.R, z, "light_gray_concrete", null, "roof"); place(x, c.R + 1, z, "light_gray_concrete", null, "roof"); nPlanters++;
  } else if (c.n <= 12 && (x + 2 * z) % 9 === 4) {
    place(x, c.R, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" }, "roof"); nPlanters++;
  }
}

// nothing floats: every block must be reachable from the ground through placed blocks; interior slabs and lights that are not
// are dropped (the facade and roof are always reached through their columns)
const seen = new Set(); const stack = [];
for (const k of placed.keys()) if (k.split(",")[1] === "0") { seen.add(k); stack.push(k); }
while (stack.length) {
  const k = stack.pop(); const [x, y, z] = k.split(",").map(Number);
  for (const n of [[x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]]) {
    const nk = n.join(","); if (placed.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
  }
}
let dropped = 0;
for (const [k] of placed) {
  if (seen.has(k)) continue;
  const kind = kindOf.get(k);
  const [x, y, z] = k.split(",").map(Number);
  if (kind === "slab" || kind === "light" || kind === "roof") { g3.set(x, y, z, "air"); dropped++; }
  else console.warn("unsupported facade block", k, kind);
}

const stats = g3.save(OUT);
console.log(JSON.stringify({ cells: cell.size, maxY: Math.max(...[...placed.keys()].map((k) => +k.split(",")[1])), lights: nLights, planters: nPlanters, droppedFloating: dropped, ...stats }));
