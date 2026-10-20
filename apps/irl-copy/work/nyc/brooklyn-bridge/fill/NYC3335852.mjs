import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3335852";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 17, D = 23;
const g = new Voxels([W, H, D]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Raw footprint data: "x,z" -> { ground, roof }
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(`${x},${z}`, { ground: Math.round(gr), roof: Math.round(rf) });
}
const inFp = (x, z) => raw.has(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];
const exposedDirs = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));

// Lidar roof: 3x3 mean, then quantised to 2-block tiers above the lowest roof
let minRoof = Infinity;
for (const v of raw.values()) minRoof = Math.min(minRoof, v.roof);

const info = new Map();
for (const [key, { ground, roof }] of raw) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = `${x + dx},${z + dz}`;
    if (raw.has(k)) { sum += raw.get(k).roof; n++; }
  }
  const mean = sum / n;
  const tiered = minRoof + 2 * Math.round((mean - minRoof) / 2);
  const base = clamp(ground, 0, H - 8);
  const r = clamp(tiered, base + 4, H - 4);
  const dirs = exposedDirs(x, z);
  info.set(key, { x, z, base, r, dirs, perim: dirs.length > 0 });
}

// Choose one entrance per street-facing face, near the middle of that face
const doors = new Map(); // key -> dir
for (const d of DIRS) {
  const cand = [...info.values()].filter((c) => c.perim && c.dirs.some((e) => e.name === d.name));
  if (cand.length < 4) continue;
  const us = cand.map((c) => (d.axis === "x" ? c.x : c.z));
  const mid = (Math.min(...us) + Math.max(...us)) / 2;
  let best = null;
  for (const c of cand) {
    const u = d.axis === "x" ? c.x : c.z;
    if (c.r - 2 < c.base + 1) continue;
    if (!best || Math.abs(u - mid) < Math.abs((d.axis === "x" ? best.x : best.z) - mid)) best = c;
  }
  if (best) doors.set(`${best.x},${best.z}`, d);
}

// Pass 1: foundations, interiors, perimeter shells, bands, cornice
for (const c of info.values()) {
  const { x, z, base, r, dirs, perim } = c;
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    for (let y = base + 2; y <= r - 2; y += 2) g.set(x, y, z, "spruce_planks");
    g.set(x, r - 1, z, "smooth_stone");
    if (x % 9 === 4 && z % 9 === 4) {
      for (let y = r; y <= Math.min(r + 1, H - 1); y++) g.set(x, y, z, "bricks");
      if (r + 2 < H) g.set(x, r + 2, z, "stone_bricks");
    }
    continue;
  }

  for (let y = base; y <= r - 1; y++) g.set(x, y, z, "bricks");
  for (let y = base + 2; y <= r - 2; y += 2) g.set(x, y, z, "stone_bricks");
  g.set(x, r - 1, z, "stone_bricks");
}

// Pass 2: windows, doors, warm glow on perimeter cells
for (const c of info.values()) {
  if (!c.perim) continue;
  const { x, z, base, r, dirs } = c;
  const primary = dirs[0];
  const door = doors.get(`${x},${z}`);

  const rows = [];
  if (!door) { if (base <= r - 2) rows.push(base); }
  if (base + 1 <= r - 2 && !door) rows.push(base + 1);
  for (let y = base + 3; y <= r - 2; y += 2) rows.push(y);
  if (door && base + 1 <= r - 2) {
    // door occupies base and base+1; windows above only
  }

  const u = primary.axis === "x" ? x : z;
  const windowed = dirs.length === 1 ? u % 3 !== 0 : (x + z) % 3 !== 0;

  if (windowed) {
    for (const y of rows) {
      g.set(x, y, z, "glass");
      const ix = x - primary.dx, iz = z - primary.dz;
      if (inFp(ix, iz) && exposedDirs(ix, iz).length === 0 && (x * 7 + z * 3 + y) % 4 === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Upper-storey windows still show on doored cells
  if (door) {
    for (let y = base + 3; y <= r - 2; y += 2) {
      if (windowed) g.set(x, y, z, "glass");
    }
    if (base + 1 <= r - 2) {
      g.set(x, base, z, "oak_door", { facing: door.name, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, base + 1, z, "oak_door", { facing: door.name, half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
