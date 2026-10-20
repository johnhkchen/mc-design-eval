import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE105-0190-3F";
const W = 31, H = 28, D = 42;

// Dream-Way Building (君蔚樓), 2016: a three-storey Xinyi commercial block with
// blue-green glass panes in white concrete frames, a stone base, a shopfront
// entrance on the north face, and a parapet with rooftop plant.
const TOP = 16;                      // parapet top (roof ~16 above lowest ground)
const SLAB_LEVELS = [5, 10, 15];     // floor slabs; 15 doubles as roof slab
const BANDS = [[1, 4], [6, 9], [11, 14]]; // storey bands, bottom/top rows = spandrels

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
const key = (x, z) => `${x},${z}`;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, g] of cells) {
  ground.set(key(x, z), g);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));
const miss = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z),
});
const isPerim = (m) => m.n || m.s || m.w || m.e;

const g = new Voxels([W, H, D]);
const midX = Math.round((minX + maxX) / 2);
const midZ = Math.round((minZ + maxZ) / 2);

// deterministic pseudo-random for the lit windows
const h = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const m = miss(x, z);
  const perim = isPerim(m);
  const corner = (m.n || m.s) && (m.w || m.e);
  const wallAlongX = m.n || m.s;     // face runs east-west
  const along = wallAlongX ? x : z;
  const pier = corner || along % 3 === 0;
  // inward cell direction for lit interiors (single-face cells only)
  let dx = 0, dz = 0;
  if (perim && !corner) {
    if (m.n) dz = 1; else if (m.s) dz = -1;
    if (m.w) dx = 1; else if (m.e) dx = -1;
  }
  const frontN = m.n && !corner;
  // wider entrance opening on the north face, centred on the footprint
  const entranceX = frontN && Math.abs(x - midX) <= 3;
  const entranceCore = frontN && Math.abs(x - midX) <= 1;

  for (let y = gr; y <= TOP; y++) {
    if (y >= H) break;

    // base course at ground level
    if (y === gr) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }
    // floor slabs (air gap sits behind the glass; no interiors)
    if (SLAB_LEVELS.includes(y)) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // parapet with cornice
    if (y === TOP) {
      if (perim) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    const band = BANDS.find(([b, t]) => y >= b && y <= t);
    if (!band) continue;
    if (!perim) continue; // interior stays open air

    const [b, t] = band;
    // ground-floor entrance: clear glass opening with a quartz lintel above
    if (entranceX && y >= 1 && y <= 3) {
      g.set(x, y, z, "glass");
      continue;
    }
    if (entranceX && y === 4) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // spandrels and piers: white concrete frame
    if (y === b || y === t || pier) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    // glazing: blue-green glass pane, connected along the facade
    const props = wallAlongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "cyan_stained_glass_pane", props);

    // warm light behind some windows, in the first window row of each storey
    if (y === b + 1 && !corner && (h(x, y, z) % 9 === 0) && dx + dz !== 0) {
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isPerim(miss(ix, iz))) {
        g.set(ix, y, iz, h(ix, y, iz) % 2 ? "glowstone" : "shroomlight");
      }
    }
  }

  // warm light just inside the entrance so the lobby reads at dusk
  if (entranceCore) {
    const ix = x, iz = z + 1;
    if (has(ix, iz) && !isPerim(miss(ix, iz))) {
      g.set(ix, 2, iz, "glowstone");
    }
  }
}

// rooftop plant: condenser banks on the roof slab, a small mast in the centre
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const m = miss(x, z);
  if (isPerim(m)) continue;
  if (Math.abs(x - midX) <= 6 && Math.abs(z - midZ) <= 8 && (x + z) % 4 < 2) {
    g.set(x, TOP, z, "iron_block");
    if (Math.abs(x - midX) <= 3 && Math.abs(z - midZ) <= 4) {
      g.set(x, TOP + 1, z, "light_gray_concrete");
    }
  }
}
if (has(midX, midZ)) {
  for (let y = TOP; y <= TOP + 5 && y < H; y++) {
    g.set(midX, y, midZ, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
