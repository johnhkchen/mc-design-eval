import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001341.cells.json`, "utf8"));

const W = 10, H = 24, D = 14;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, roof] of cells) {
  info.set(key(x, z), { x, z, gr: Math.max(0, Math.round(gr)), roof: Math.round(roof) });
}
const has = (x, z) => info.has(key(x, z));

// ---- common datum and one flat roof for the whole building -------------------
const G = Math.min(...[...info.values()].map((c) => c.gr));
const roofs = [...info.values()].map((c) => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxS = Math.floor((H - 4 - G) / STOREY);
const nS = Math.max(3, Math.min(maxS, Math.round((medRoof - G) / STOREY)));
const R = G + STOREY * nS;                 // flat roof level (exclusive) for every cell

// ---- per-cell adjacency --------------------------------------------------------
const cellsM = [];
for (const c of info.values()) {
  const nb = {
    n: has(c.x, c.z - 1), s: has(c.x, c.z + 1),
    w: has(c.x - 1, c.z), e: has(c.x + 1, c.z),
  };
  const missing = Object.keys(nb).filter((k) => !nb[k]);
  const perim = missing.length > 0;
  const corner = (!nb.n || !nb.s) && (!nb.w || !nb.e);
  let inward = null;
  if (!nb.n && nb.s) inward = [c.x, c.z + 1];
  else if (!nb.s && nb.n) inward = [c.x, c.z - 1];
  else if (!nb.w && nb.e) inward = [c.x + 1, c.z];
  else if (!nb.e && nb.w) inward = [c.x - 1, c.z];
  cellsM.push({ ...c, g0: c.gr, nb, missing, perim, corner, inward });
}
const byKey = new Map(cellsM.map((m) => [key(m.x, m.z), m]));

// ---- entrance: street-front (north-facing) ground-floor non-corner cell -------
const outFacing = { n: "north", s: "south", w: "west", e: "east" };
const candidates = cellsM
  .filter((m) => m.perim && !m.corner && m.missing.length === 1)
  .sort((a, b) => {
    const pa = a.missing[0] === "n" ? 0 : 1;
    const pb = b.missing[0] === "n" ? 0 : 1;
    return pa - pb || a.x - b.x;
  });
let doorKey = null, doorFacing = null;
if (candidates.length) {
  const northOnes = candidates.filter((m) => m.missing[0] === "n");
  const pool = northOnes.length ? northOnes : candidates;
  const pick = pool[Math.floor(pool.length / 2)];
  doorKey = key(pick.x, pick.z);
  doorFacing = outFacing[pick.missing[0]];
}

// ---- one restrained chimney pair on the flat roof ----------------------------
let chimneyKey = null;
{
  const interior = cellsM.filter((m) => !m.perim && m.x % 3 === 1 && m.z % 4 === 2);
  if (interior.length) chimneyKey = key(interior[0].x, interior[0].z);
}

// ---- build ------------------------------------------------------------------
for (const m of cellsM) {
  const { x, z, g0, perim, corner, inward } = m;
  const k = key(x, z);
  const u = x + z;
  const window = perim && !corner && (u % 2 === 1);

  for (let y = 0; y < H; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < g0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y >= R) continue;

    const s = Math.floor((y - G) / STOREY);
    const dy = (y - G) % STOREY;

    // flat roof cap / parapet
    if (y === R - 1) {
      g.set(x, y, z, perim ? "smooth_stone" : "stone");
      continue;
    }

    // interior: floor slab at each storey line, air otherwise
    if (!perim) {
      if (dy === 0 && s < nS) g.set(x, y, z, "spruce_planks");
      continue;
    }

    // perimeter walls
    if (corner) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (s === 0) {
      if (dy === 0) g.set(x, y, z, "stone_bricks");                     // bulkhead
      else g.set(x, y, z, window ? "glass_pane" : "dark_oak_planks");   // glazing / frame
    } else {
      if (dy === 0) g.set(x, y, z, "smooth_stone");                      // belt course / sill
      else g.set(x, y, z, window ? "glass_pane" : "bricks");
    }

    // warm light behind selected upper-floor windows
    if (window && s === 1 && dy === 1 && u % 4 === 1 && inward) {
      g.set(inward[0], y, inward[1], "glowstone");
    }
  }

  // entrance
  if (k === doorKey) {
    g.set(x, g0, z, "dark_oak_door", {
      facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, g0 + 1, z, "dark_oak_door", {
      facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, g0 + 2, z, "stone_bricks");                                  // lintel
    if (inward) g.set(inward[0], g0 + 2, inward[1], "lantern", { hanging: "false" });
  }

  // chimney stack on the flat roof
  if (k === chimneyKey && R + 2 < H) {
    g.set(x, R, z, "bricks");
    g.set(x, R + 1, z, "bricks");
  }
}

g.save(`${DIR}/NYC1001341.nbt`);
