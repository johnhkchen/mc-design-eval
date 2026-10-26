import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54011.cells.json`, "utf8"));

const W = 8, H = 29, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- footprint lookup ----
const cm = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  cm.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}

// ---- roof: one main tier (median of lidar roofs), wings keep their own height ----
const roofs = [...cm.values()].map((c) => c.roof).sort((a, b) => a - b);
const mainTop = clamp(roofs[Math.floor(roofs.length / 2)], 12, 22); // ~17 above y0

const topOf = (c) => {
  const t = Math.abs(c.roof - mainTop) <= 2 ? mainTop : clamp(c.roof, 8, 22);
  return Math.max(t, c.gr + 6);
};

// ---- depth from the facade: 0 = facade ring, 1 = air gap, 2+ = core ----
const depth = new Map();
const queue = [];
const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];
for (const c of cm.values()) {
  const edge = NB.some(([dx, dz]) => !cm.has(key(c.x + dx, c.z + dz)));
  if (edge) { depth.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (cm.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(cm.get(k));
    }
  }
}

// ---- storey lines: base at y0 (stone), floor lines every 3 blocks ----
// Ground storey: y 1..2 storefront glass, y3 lintel. Upper storeys: y4..5, 7..8, ...
const isFloorLine = (y, top) => y >= 3 && y % 3 === 0 && y < top - 1;
const isWindowRow = (y) => y >= 1 && y % 3 !== 0;

for (const c of cm.values()) {
  const { x, z, gr } = c;
  const top = topOf(c);
  const k = key(x, z);
  const dep = depth.get(k);
  const miss = {
    W: !cm.has(key(x - 1, z)),
    E: !cm.has(key(x + 1, z)),
    N: !cm.has(key(x, z - 1)),
    S: !cm.has(key(x, z + 1)),
  };
  const nMiss = Object.values(miss).filter(Boolean).length;
  const isFac = dep === 0;
  // Piers on the facade every 3 blocks along the face, and at corners
  const pier = isFac && (nMiss > 1 || ((miss.W || miss.E) ? z % 3 === 0 : x % 3 === 0));
  // Door on the north (z=0) street face, two bays wide at x=4..5
  const doorCell = isFac && miss.N && !miss.W && !miss.E && (x === 4 || x === 5);

  // Pane orientation for facade glazing
  const paneProps = (miss.W || miss.E)
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = 0; y < top; y++) {
    // Foundation: solid from y0 up to this cell's ground
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }

    // Ground base course
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    // Roof / parapet cap
    if (y === top - 1) {
      g.set(x, y, z, isFac ? "smooth_quartz" : (dep === 1 ? "smooth_quartz" : "stone"));
      continue;
    }

    // Cornice band just under the parapet on the street-facing walls
    if (isFac && y === top - 2) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Floor slabs at storey lines (full span of the footprint)
    if (isFloorLine(y, top)) {
      g.set(x, y, z, dep >= 2 ? "stone" : "smooth_quartz");
      continue;
    }

    if (isFac) {
      if (pier) { g.set(x, y, z, "quartz_pillar"); continue; }
      if (doorCell && y <= 2) {
        const hinge = x === 4 ? "left" : "right";
        const half = y === 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "north", half, hinge, open: "false", powered: "false",
        });
        continue;
      }
      if (isWindowRow(y)) {
        g.set(x, y, z, "gray_stained_glass_pane", paneProps);
        continue;
      }
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    if (dep === 1) {
      // Air gap behind the glass; a few warm lights in window bays
      if (isWindowRow(y) && y % 3 === 1 && (x + z + y) % 4 === 0 && !doorCell) {
        g.set(x, y, z, "shroomlight");
      }
      // otherwise leave as air
      continue;
    }

    // Core
    g.set(x, y, z, "stone");
  }

  // Rooftop penthouse on the inner core (main tier only), with a mechanical cap
  if (dep >= 2 && top === mainTop) {
    for (let y = top; y <= top + 1 && y < H; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
    if (dep >= 3) {
      if (top + 2 < H) g.set(x, top + 2, z, "iron_block");
    }
  }
}

g.save(`${DIR}/DC54011.nbt`);
