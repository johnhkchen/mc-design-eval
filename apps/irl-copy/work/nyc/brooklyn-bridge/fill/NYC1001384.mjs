import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001384";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// Federal-era (1792) brick walk-up on a 6 x 16 footprint: stone base, brick walls,
// stone lintel courses, a stone cornice, a shopfront with a recessed door and stone
// pilasters, three upper storeys of multi-pane windows, and a roof that follows the
// lidar height cell by cell, quantised to storey lines so the tiers stay clean.
const W = 6, HT = 24, D = 16;
const g = new Voxels([W, HT, D]);

const inside = new Set(cells.map(c => `${c[0]},${c[1]}`));
const G = Math.min(...cells.map(c => c[2]));                 // lowest ground

// Per-cell roof top: lidar roof snapped to storey lines (4 blocks), kept within 2-3 storeys
const topOf = new Map();
for (const [x, z, , roof] of cells) {
  let t = G + 4 * Math.round((roof - G) / 4);
  t = Math.max(t, G + 8);
  t = Math.min(t, G + 12, HT - 1);
  topOf.set(`${x},${z}`, t);
}

// Exposed faces of a footprint cell (perimeter test + facade orientation)
function exposures(x, z) {
  const o = [];
  if (!inside.has(`${x - 1},${z}`)) o.push({ f: "west",  xf: true,  along: z, len: D, dx: -1, dz: 0 });
  if (!inside.has(`${x + 1},${z}`)) o.push({ f: "east",  xf: true,  along: z, len: D, dx: 1,  dz: 0 });
  if (!inside.has(`${x},${z - 1}`)) o.push({ f: "north", xf: false, along: x, len: W, dx: 0,  dz: -1 });
  if (!inside.has(`${x},${z + 1}`)) o.push({ f: "south", xf: false, along: x, len: W, dx: 0,  dz: 1 });
  return o;
}

// Window bays: 1-block piers every third block, 2-wide windows between them
const isWindow = (along, len) => along >= 1 && along <= len - 2 && along % 3 !== 0;

function paneProps(xf) {
  return xf
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

for (const [x, z, g0] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  const top = topOf.get(`${x},${z}`);
  const ex = exposures(x, z);
  const perimeter = ex.length > 0;
  const e = perimeter ? ex[0] : null;

  for (let y = g0; y <= top - 1; y++) {
    const k = Math.floor((y - G) / 4);      // storey index (global grid)
    const rel = (y - G) % 4;                // 0 sill/base, 1-2 glass, 3 lintel

    if (!perimeter) {
      // Interior: floor slab per storey and roof slab; no rooms
      if (y === top - 1) g.set(x, y, z, "smooth_stone");
      else if (rel === 0 && k >= 1) g.set(x, y, z, "spruce_planks");
      continue;
    }

    // Perimeter shell
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");                         // cornice cap
      continue;
    }
    if (y === top - 2) {
      // Corbel line: a half slab just under the cornice casts a shadow line
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    const along = e.along, len = e.len;
    const win = isWindow(along, len);

    if (k === 0) {
      if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      if (rel === 3) {
        g.set(x, y, z, e.f === "west" ? "dark_oak_planks" : "stone_bricks");
        continue;
      }
      // rel 1-2: shopfront
      if (e.f === "west" && along === 7) {
        g.set(x, y, z, "oak_door", {
          facing: "west", half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (e.f === "west" && (along === 6 || along === 8)) {
        // Stone pilasters framing the entrance
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      if (win) {
        g.set(x, y, z, "glass_pane", paneProps(e.xf));
        if (rel === 1 && (along + k) % 3 === 0) {
          const ix = x - e.dx, iz = z - e.dz;
          if (inside.has(`${ix},${iz}`)) g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    // Upper storeys
    if (rel === 0) { g.set(x, y, z, "bricks"); continue; }           // sill course
    if (rel === 3) { g.set(x, y, z, "stone_bricks"); continue; }     // stone lintel band
    if (win) {
      g.set(x, y, z, "glass_pane", paneProps(e.xf));
      if (rel === 1 && (along + k) % 3 === 0) {
        const ix = x - e.dx, iz = z - e.dz;
        if (inside.has(`${ix},${iz}`)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// Hanging lantern in the entry hall, behind the shopfront door
if (inside.has("1,7")) {
  const yl = G + 3;
  g.set(1, yl, 7, "lantern", { hanging: "true", waterlogged: "false" });
}

// Two brick chimney stacks on the roof, each rising from its own cell's roof
for (const [cx, cz] of [[2, 4], [3, 11]]) {
  if (!inside.has(`${cx},${cz}`)) continue;
  const top = topOf.get(`${cx},${cz}`);
  if (top + 1 <= HT - 1) {
    g.set(cx, top, cz, "bricks");
    g.set(cx, top + 1, cz, "bricks");
  }
}

g.save(`${BASE}.nbt`);
