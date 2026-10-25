import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499752";
const W = 10, H = 26, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, ground, roof] of cells) {
  const G = clamp(Math.round(ground), 0, H - 8);
  const R = clamp(Math.round(roof), G + 6, H - 4);
  map.set(key(x, z), { x, z, G, R });
}
const has = (x, z) => map.has(key(x, z));
const get = (x, z) => map.get(key(x, z));

function missing(c) {
  const m = [];
  if (!has(c.x, c.z - 1)) m.push("north");
  if (!has(c.x, c.z + 1)) m.push("south");
  if (!has(c.x + 1, c.z)) m.push("east");
  if (!has(c.x - 1, c.z)) m.push("west");
  return m;
}
const isEdge = (c) => missing(c).length > 0;
const isCorner = (c) => missing(c).length >= 2;
const facadeOf = (c) => missing(c)[0] ?? null;
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const inwardOf = (dir) => {
  const o = OPP[dir];
  return { dx: o === "east" ? 1 : o === "west" ? -1 : 0, dz: o === "south" ? 1 : o === "north" ? -1 : 0 };
};

// Facade lines: cells sharing a facade and a row/column form one wall run.
// Window rhythm is measured from the run's own start, so every run is symmetrical.
const lineKey = (c, dir) => (dir === "north" || dir === "south" ? `${dir}:${c.z}` : `${dir}:${c.x}`);
const lineAlong = (c, dir) => (dir === "north" || dir === "south" ? c.x : c.z);
const lineStart = new Map();
for (const c of map.values()) {
  if (!isEdge(c) || isCorner(c)) continue;
  const dir = facadeOf(c);
  if (!dir) continue;
  const k = lineKey(c, dir);
  const a = lineAlong(c, dir);
  lineStart.set(k, Math.min(lineStart.get(k) ?? Infinity, a));
}

// Entrance: the longest south-facing run (fallback any), door at its middle.
let door = null;
{
  const runs = new Map();
  for (const c of map.values()) {
    if (!isEdge(c) || isCorner(c)) continue;
    const dir = facadeOf(c);
    if (!dir) continue;
    const k = lineKey(c, dir);
    if (!runs.has(k)) runs.set(k, { dir, cells: [] });
    runs.get(k).cells.push(c);
  }
  const ranked = [...runs.values()]
    .filter((r) => r.cells.length >= 3)
    .sort((a, b) => (b.dir === "south") - (a.dir === "south") || b.cells.length - a.cells.length);
  const run = ranked[0];
  if (run) {
    const sorted = run.cells.slice().sort((a, b) => lineAlong(a, run.dir) - lineAlong(b, run.dir));
    door = sorted[Math.floor(sorted.length / 2)];
    door.doorDir = run.dir;
  }
}

const glassProps = (dir) =>
  dir === "north" || dir === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- pass 1: foundations, walls, floors, cornice, roof ----
for (const c of map.values()) {
  const { x, z, G, R } = c;
  const edge = isEdge(c);
  const corner = isCorner(c);
  const dir = facadeOf(c);
  const along = dir ? lineAlong(c, dir) - lineStart.get(lineKey(c, dir)) : 0;

  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  for (let y = G; y <= R - 1; y++) {
    const s = Math.floor((y - G) / 5);
    const lvl = (y - G) % 5;

    if (!edge) {
      if (y === R - 1) g.set(x, y, z, "smooth_stone");
      else if (lvl === 0 && y > G) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Cornice and quoins
    if (y === R - 1) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }
    if (corner) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }

    // Storey lines
    if (lvl === 0) { g.set(x, y, z, "smooth_stone"); continue; }

    // Entrance: door at ground, with a stone surround and a lit transom above
    const isDoorCell = door && door.x === x && door.z === z;
    if (isDoorCell && s === 0) {
      if (lvl === 1) { g.set(x, y, z, "oak_door", { facing: door.doorDir === "south" ? "south" : door.doorDir, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" }); continue; }
      if (lvl === 2) { g.set(x, y, z, "oak_door", { facing: door.doorDir === "south" ? "south" : door.doorDir, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" }); continue; }
      if (lvl === 3) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Window bays: the first and last bay of each run stay solid pier, the rest alternate
    if (lvl >= 1 && lvl <= 3 && dir && along >= 1 && along % 2 === 1) {
      g.set(x, y, z, "glass_pane", glassProps(dir));
    } else {
      g.set(x, y, z, "stone_bricks");
    }
  }

  g.set(x, R, z, "deepslate_tiles");
}

// Door surround: flank the door with chiseled piers at ground level
if (door) {
  const dir = door.doorDir;
  const along = lineAlong(door, dir);
  for (const off of [-1, 1]) {
    const nx = dir === "north" || dir === "south" ? door.x + off : door.x;
    const nz = dir === "north" || dir === "south" ? door.z : door.z + off;
    const n = get(nx, nz);
    if (n && isEdge(n) && !isCorner(n)) {
      for (let y = n.G; y <= Math.min(n.G + 2, n.R - 2); y++) g.set(n.x, y, n.z, "chiseled_stone_bricks");
    }
  }
  void along;
}

// ---- pass 2: warm light behind some window glass ----
for (const c of map.values()) {
  if (!isEdge(c) || isCorner(c)) continue;
  const dir = facadeOf(c);
  if (!dir) continue;
  const { dx, dz } = inwardOf(dir);
  const ic = get(c.x + dx, c.z + dz);
  if (!ic || isEdge(ic)) continue;
  const along = lineAlong(c, dir) - lineStart.get(lineKey(c, dir));
  for (let s = 0; c.G + 5 * s + 2 <= c.R - 2; s++) {
    if ((s + along) % 3 !== 0) continue;
    const y = c.G + 5 * s + 2;
    if (y < ic.G + 1 || y >= ic.R - 1) continue;
    g.set(ic.x, y, ic.z, "glowstone");
  }
}

// ---- pass 3: a chimney on the most interior cell ----
{
  let best = null, bestD = -1;
  for (const c of map.values()) {
    if (isEdge(c)) continue;
    const d = Math.min(c.x, W - 1 - c.x, c.z, D - 1 - c.z);
    if (d > bestD) { bestD = d; best = c; }
  }
  if (best && best.R + 3 < H) {
    g.set(best.x, best.R + 1, best.z, "stone_bricks");
    g.set(best.x, best.R + 2, best.z, "chiseled_stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
