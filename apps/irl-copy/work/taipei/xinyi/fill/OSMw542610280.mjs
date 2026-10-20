import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610280";
const W = 30, H = 23, D = 24;
const ROOF = 11;          // roof deck height above lowest ground (lidar)
const MAX_G = 18;         // keeps parapet and cap inside the canvas

// Materials: a 1980s Taipei mid-rise commercial block. White tiled/concrete
// walls, a polished granite base, tinted glass in grid-framed bays, a belt
// course at each storey line, and a parapet with a stone cap.
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const WALL = "white_concrete";
const MULL = "light_gray_concrete";
const GLASS = "cyan_stained_glass_pane";
const FLOOR = "smooth_stone";
const DECK = "smooth_stone";
const CAP = "stone_brick_slab";
const LIGHT = "glowstone";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.min(MAX_G, Math.max(0, Math.round(gr))));
}
const inF = (x, z) => G.has(key(x, z));
const topOf = (gr) => Math.max(ROOF, gr + 2);
const perimOf = (x, z) => !inF(x, z - 1) || !inF(x, z + 1) || !inF(x - 1, z) || !inF(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, shell, floors, windows, parapets.
for (const [kk, gr] of G) {
  const [x, z] = kk.split(",").map(Number);
  const top = topOf(gr);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const perim = nN || nS || nW || nE;

  if (!perim) {
    // Interior: floor slabs per storey and the roof deck; air between.
    if (gr < top) put(x, gr, z, FLOOR);
    if (gr <= 5 && 5 < top) put(x, 5, z, FLOOR);
    put(x, top, z, DECK);
    continue;
  }

  // Perimeter shell.
  if (gr < top) put(x, gr, z, BASE);
  const ns = nN || nS;
  const ew = nW || nE;

  for (let y = gr + 1; y < top; y++) {
    // Belt courses at storey lines and the cornice under the roof.
    if (y === 5 || y === 10 || y === top - 1) {
      put(x, y, z, WALL);
      continue;
    }
    if (ns && ew) { put(x, y, z, WALL); continue; }

    let kind = "wall";
    let along = 0;
    if (ns) {
      const edge = !inF(x - 1, z) || !inF(x + 1, z);
      along = x;
      if (edge) kind = "wall";
      else kind = along % 3 === 0 ? "mull" : "glass";
    } else {
      const edge = !inF(x, z - 1) || !inF(x, z + 1);
      along = z;
      if (edge) kind = "wall";
      else kind = along % 3 === 0 ? "mull" : "glass";
    }

    if (kind === "glass") {
      if (ns) put(x, y, z, GLASS, { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
      else put(x, y, z, GLASS, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else if (kind === "mull") {
      put(x, y, z, MULL);
    } else {
      put(x, y, z, WALL);
    }

    // Warm light behind a lit window: glowstone in the interior cell inside.
    if (kind === "glass" && (ns !== ew)) {
      const lit = ns ? along % 6 === 1 : along % 6 === 1;
      const lightY = y === gr + 2 || y === 7;
      if (lit && lightY && y !== 5) {
        let xi = x, zi = z;
        if (ns) zi = nN ? z + 1 : z - 1;
        else xi = nW ? x + 1 : x - 1;
        if (inF(xi, zi) && !perimOf(xi, zi)) put(xi, y, zi, LIGHT);
      }
    }
  }

  // Roof deck, parapet and stone cap.
  put(x, top, z, DECK);
  put(x, top + 1, z, WALL);
  put(x, top + 2, z, CAP, { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance on the street-facing (south, +z) edge at the median cell.
const southEdge = [...G.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !inF(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southEdge.length) {
  const [ex, ez] = southEdge[Math.floor(southEdge.length / 2)];
  const gr = G.get(key(ex, ez));
  const top = topOf(gr);
  put(ex, gr + 1, ez, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 2, ez, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the entrance, kept inside the footprint.
  if (gr + 3 < top) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!inF(ex + dx, ez)) continue;
      const cg = G.get(key(ex + dx, ez));
      if (gr + 3 >= cg) put(ex + dx, gr + 3, ez, CAP, { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 3: roof equipment. Air-conditioning plant and a central core.
for (const [kk, gr] of G) {
  const [x, z] = kk.split(",").map(Number);
  const top = topOf(gr);
  if (perimOf(x, z)) continue;
  const inCore = x >= 9 && x <= 18 && z >= 6 && z <= 15;
  if (inCore) {
    const ring = x === 9 || x === 18 || z === 6 || z === 15;
    if (ring) {
      put(x, top + 1, z, WALL);
      put(x, top + 2, z, WALL);
      if (x === 13 && z === 15) {
        // Doorway through the core's south wall.
        g.set(x, top + 1, z, "air");
        g.set(x, top + 2, z, "air");
      }
    }
    put(x, top + 3, z, DECK);
  } else if (x % 6 === 2 && z % 6 === 2) {
    put(x, top + 1, z, MULL);
  }
}

g.save(`${DIR}/${ID}.nbt`);
