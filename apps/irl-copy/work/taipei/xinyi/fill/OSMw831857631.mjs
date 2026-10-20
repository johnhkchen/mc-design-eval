import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1980s Xinyi commercial block: white tiled walls, stone base,
// red awning over a shopfront, light-blue glass bays with piers, cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857631";
const W = 27, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const B = Math.min(...ground.values());
const TOP = B + 10;                 // parapet block; roof surface at B + 11

const PANE_NS = { north: "false", south: "false", east: "true", west: "true" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false" };
const DIRS = [
  { name: "north", dx: 0, dz: -1, facing: "north", axis: "x", pane: PANE_NS },
  { name: "south", dx: 0, dz: 1, facing: "south", axis: "x", pane: PANE_NS },
  { name: "west", dx: -1, dz: 0, facing: "west", axis: "z", pane: PANE_EW },
  { name: "east", dx: 1, dz: 0, facing: "east", axis: "z", pane: PANE_EW },
];
const uOf = (f, x, z) => (f.axis === "x" ? x : z);
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => has(x, z) && exposed(x, z).length > 0;

// Face statistics: length and along-face range of exposed sides.
const stats = {};
for (const d of DIRS) stats[d.name] = { cells: 0, uMin: Infinity, uMax: -Infinity, us: [] };
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const d of exposed(x, z)) {
    const s = stats[d.name];
    const u = uOf(d, x, z);
    s.cells++;
    s.uMin = Math.min(s.uMin, u);
    s.uMax = Math.max(s.uMax, u);
    s.us.push(u);
  }
}
const front = DIRS.reduce((a, b) => (stats[b.name].cells > stats[a.name].cells ? b : a));
const fs = stats[front.name];
fs.us.sort((a, b) => a - b);
const median = fs.us[Math.floor(fs.us.length / 2)];
const windowCols = fs.us.filter((u) => (u - fs.uMin) % 3 === 1);
const doorU = (windowCols.length ? windowCols : fs.us)
  .reduce((best, u) => (Math.abs(u - median) < Math.abs(best - median) ? u : best));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Main massing: foundation, cells, floors, facades.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = G(x, z);

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior cell: floor slabs and roof slab only; air between.
    if (gr <= TOP) put(x, gr, z, "smooth_stone");
    for (const y of [B + 5, TOP]) {
      if (y > gr && y <= TOP) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter cell: full wall column from ground to parapet.
  for (let y = gr; y <= TOP; y++) {
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === TOP) { put(x, y, z, "stone_brick_wall"); continue; }     // parapet cap
    if (y === B + 9) { put(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; } // cornice
    if (y === B + 5) { put(x, y, z, "smooth_stone"); continue; }       // storey line

    const kinds = ex.map((f) => {
      const u = uOf(f, x, z);
      const rel = u - stats[f.name].uMin;
      if (rel % 3 === 0) return { f, kind: "pier" };
      const doorCell = f.name === front.name && u === doorU && gr + 2 <= B + 3 &&
        (y === gr + 1 || y === gr + 2);
      if (doorCell) return { f, kind: "door" };
      if (y === B + 4) return { f, kind: "awning" };
      return { f, kind: "glass" };
    });

    if (kinds.some((k) => k.kind === "pier")) {
      put(x, y, z, "polished_andesite");
    } else if (kinds.some((k) => k.kind === "door")) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: front.facing, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (kinds.some((k) => k.kind === "awning")) {
      put(x, y, z, "red_terracotta");
    } else if (kinds.some((k) => k.kind === "glass")) {
      const gk = kinds.find((k) => k.kind === "glass");
      put(x, y, z, "light_blue_stained_glass_pane", gk.f.pane);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Warm light: glowstone set two blocks behind some glass (one air gap between).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const gr = G(x, z);
  for (const f of exposed(x, z)) {
    const rel = uOf(f, x, z) - stats[f.name].uMin;
    if (rel % 3 === 0) continue;
    const tx = x - 2 * f.dx, tz = z - 2 * f.dz;
    if (!has(tx, tz) || isPerim(tx, tz)) continue;

    // Upper storey lamps on alternate bays.
    const yUp = B + 7;
    if (rel % 2 === 1 && yUp > gr && G(tx, tz) < yUp) put(tx, yUp, tz, "glowstone");

    // Shopfront lamps on a few bays.
    const yShop = B + 2;
    if (rel % 6 === 2 && yShop > gr && G(tx, tz) < yShop) put(tx, yShop, tz, "glowstone");
  }
}

// Roof plant on interior roof cells (sits on the roof slab at TOP).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z) || G(x, z) > TOP) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, TOP + 1, z, "light_gray_concrete");
    if (has(x + 1, z) && !isPerim(x + 1, z)) put(x + 1, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
